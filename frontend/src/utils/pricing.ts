import dayjs from 'dayjs';
import type { AppData, Buyer, CartLine, Coupon, OrderItemType } from '../types';
import { classPrice, enrollable, memberConflict, seatsLeft } from './classes';
import { benefitsOf, bookingConflict, memberTimeConflict, overlap, packageConflict, packageDates, roomOf, slotCount } from './slots';

export const roundVnd = (x: number) => Math.floor(x + 0.5);

export interface SubBooking { date: string; listPrice: number; price: number; benefitKind?: 'GYM_ACCESS' | 'FREE_SLOT' | 'DISCOUNT' }
export interface LineQuote {
  line: CartLine;
  unitPrice: number;            // giá gốc
  membershipDiscount: number;
  couponDiscount: number;
  total: number;
  benefitKind?: 'GYM_ACCESS' | 'FREE_SLOT' | 'DISCOUNT';
  subBookings?: SubBooking[];   // package: allocation từng booking con
  error?: string;
}
export interface CartQuote {
  lines: LineQuote[];
  subtotal: number;
  membershipDiscount: number;
  couponDiscount: number;
  total: number;
  coupon?: Coupon;
  couponError?: string;
  valid: boolean;               // mọi dòng hợp lệ và có ít nhất 1 dòng
}

/** Số free slot còn lại trong tháng của member (D04: tháng lịch theo ngày booking). */
export function freeSlotsLeft(data: AppData, memberId: string, month: string) {
  const plan = benefitsOf(data, memberId);
  if (!plan || !plan.freeBookingSlotsPerMonth) return 0;
  const used = data.bookings.filter((b) => b.memberId === memberId && b.status === 'CONFIRMED' && b.benefitKind === 'FREE_SLOT' && b.date.startsWith(month)).reduce((s, b) => s + slotCount(data.settings, b.startTime, b.endTime), 0);
  return Math.max(0, plan.freeBookingSlotsPerMonth - used);
}

/** Giá một lượt đặt facility sau quyền lợi membership (BR_1.8, BR_2.5). freeUsed: bộ đếm free slot đã dùng trong giỏ theo tháng. */
function bookingPrice(data: AppData, buyer: Buyer | null, roomId: string, date: string, start: string, end: string, freeUsed: Record<string, number>): SubBooking {
  const room = roomOf(data, roomId);
  const slots = slotCount(data.settings, start, end);
  const listPrice = (room?.pricePerSlot ?? 0) * slots;
  const memberId = buyer?.kind === 'MEMBER' ? buyer.memberId : undefined;
  const plan = benefitsOf(data, memberId);
  if (!plan || !memberId || !room) return { date, listPrice, price: listPrice };
  if (plan.gymAccess && room.type === 'GYM') return { date, listPrice, price: 0, benefitKind: 'GYM_ACCESS' };
  const month = date.slice(0, 7);
  const left = freeSlotsLeft(data, memberId, month) - (freeUsed[month] ?? 0);
  if (left >= slots) { freeUsed[month] = (freeUsed[month] ?? 0) + slots; return { date, listPrice, price: 0, benefitKind: 'FREE_SLOT' }; }
  if (plan.bookingDiscountPct > 0) return { date, listPrice, price: roundVnd(listPrice * (100 - plan.bookingDiscountPct) / 100), benefitKind: 'DISCOUNT' };
  return { date, listPrice, price: listPrice };
}

/** Kiểm tra sơ bộ một dòng trong giỏ, có xét xung đột với các dòng khác cùng giỏ (BR_3.18). */
export function validateLine(data: AppData, buyer: Buyer | null, line: CartLine, others: CartLine[]): string | null {
  const today = dayjs().format('YYYY-MM-DD');
  const memberId = buyer?.kind === 'MEMBER' ? buyer.memberId : undefined;
  const s = data.settings;
  if (buyer?.kind === 'GUEST' && line.type !== 'FACILITY_BOOKING') return 'Khách vãng lai chỉ được đặt sân lẻ (BR_2.17)';
  if (line.type === 'FACILITY_BOOKING') {
    const { roomId = '', date = '', startTime = '', endTime = '' } = line;
    if (date < today || dayjs(`${date} ${startTime}`).isBefore(dayjs())) return 'Khung giờ đã qua';
    if (dayjs(date).diff(dayjs(today), 'day') > s.maxAdvanceBookingDays) return `Chỉ đặt trước tối đa ${s.maxAdvanceBookingDays} ngày (BR_2.4)`;
    const extra = others.filter((o) => o.type === 'FACILITY_BOOKING' && o.roomId === roomId && o.date === date && overlap(startTime, endTime, o.startTime!, o.endTime!)).length;
    const cf = bookingConflict(data, roomId, date, startTime, endTime, { extra });
    if (cf) return cf;
    if (memberId) {
      const mc = memberTimeConflict(data, memberId, date, startTime, endTime);
      if (mc) return mc;
      const o = others.find((x) => (x.type === 'FACILITY_BOOKING' && x.date === date && overlap(startTime, endTime, x.startTime!, x.endTime!)) || (x.type === 'COURSE_ENROLLMENT' && data.sessions.some((ss) => ss.classId === x.classId && ss.status === 'SCHEDULED' && ss.date === date && overlap(startTime, endTime, ss.startTime, ss.endTime))));
      if (o) return `Trùng giờ với dòng "${o.name}" trong giỏ`;
    }
    return null;
  }
  if (line.type === 'FACILITY_PACKAGE') {
    if (!memberId) return 'Gói định kỳ chỉ dành cho thành viên';
    const { roomId = '', startDate = '', daysOfWeek = [], weeks = 0, startTime = '', endTime = '' } = line;
    if (!daysOfWeek.length || weeks < 1) return 'Cần chọn thứ trong tuần và số tuần';
    if (startDate < today) return 'Ngày bắt đầu phải từ hôm nay';
    const dates = packageDates(startDate, daysOfWeek, weeks).filter((d) => !(d === today && dayjs(`${d} ${startTime}`).isBefore(dayjs())));
    if (!dates.length) return 'Gói không sinh được buổi nào';
    const pc = packageConflict(data, roomId, dates, startTime, endTime);
    if (pc) return `${dayjs(pc.date).format('DD/MM')}: ${pc.reason}`;
    for (const d of dates) { const mc = memberTimeConflict(data, memberId, d, startTime, endTime); if (mc) return `${dayjs(d).format('DD/MM')}: ${mc}`; }
    const o = others.find((x) => x.type === 'FACILITY_BOOKING' && dates.includes(x.date!) && overlap(startTime, endTime, x.startTime!, x.endTime!));
    if (o) return `Trùng giờ với dòng "${o.name}" trong giỏ`;
    return null;
  }
  if (line.type === 'COURSE_ENROLLMENT') {
    if (!memberId) return 'Đăng ký lớp cần tài khoản thành viên';
    const c = data.classes.find((x) => x.id === line.classId);
    if (!c) return 'Không tìm thấy lớp';
    if (!enrollable(data, c)) return 'Lớp không còn nhận đăng ký (chưa OPEN, đã bắt đầu hoặc chưa có HLV)';
    if (seatsLeft(data, c.id) <= 0) return 'Lớp đã đủ sĩ số';
    if (data.enrollments.some((e) => e.memberId === memberId && e.classId === c.id && e.status === 'ENROLLED')) return 'Đã đăng ký lớp này';
    if (others.some((x) => x.type === 'COURSE_ENROLLMENT' && x.classId === c.id)) return 'Lớp đã có trong giỏ';
    const mc = memberConflict(data, memberId, c.id);
    if (mc) return mc;
    for (const x of others.filter((x) => x.type === 'COURSE_ENROLLMENT' && x.classId !== c.id)) {
      const hit = data.sessions.find((a) => a.classId === c.id && a.status === 'SCHEDULED' && data.sessions.some((b) => b.classId === x.classId && b.status === 'SCHEDULED' && b.date === a.date && overlap(a.startTime, a.endTime, b.startTime, b.endTime)));
      if (hit) return `Trùng lịch với lớp "${x.name}" trong giỏ (${dayjs(hit.date).format('DD/MM')})`;
    }
    return null;
  }
  if (line.type === 'MEMBERSHIP') {
    if (!memberId) return 'Mua gói cần tài khoản thành viên';
    const p = data.plans.find((x) => x.id === line.planId);
    if (!p || !p.active || p.deletedAt) return 'Gói không còn bán';
    if (others.some((x) => x.type === 'MEMBERSHIP')) return 'Mỗi đơn tối đa một dòng membership';
    return null;
  }
  return null;
}

/** Tính giá gốc + ưu đãi membership cho một dòng (chưa coupon). */
function quoteLine(data: AppData, buyer: Buyer | null, line: CartLine, freeUsed: Record<string, number>): Omit<LineQuote, 'couponDiscount' | 'total'> {
  const memberId = buyer?.kind === 'MEMBER' ? buyer.memberId : undefined;
  if (line.type === 'FACILITY_BOOKING') {
    const q = bookingPrice(data, buyer, line.roomId!, line.date!, line.startTime!, line.endTime!, freeUsed);
    return { line, unitPrice: q.listPrice, membershipDiscount: q.listPrice - q.price, benefitKind: q.benefitKind };
  }
  if (line.type === 'FACILITY_PACKAGE') {
    const dates = packageDates(line.startDate!, line.daysOfWeek ?? [], line.weeks ?? 0);
    const subs = dates.map((d) => bookingPrice(data, buyer, line.roomId!, d, line.startTime!, line.endTime!, freeUsed));
    const unitPrice = subs.reduce((s, x) => s + x.listPrice, 0);
    return { line, unitPrice, membershipDiscount: unitPrice - subs.reduce((s, x) => s + x.price, 0), subBookings: subs };
  }
  if (line.type === 'COURSE_ENROLLMENT') {
    const c = data.classes.find((x) => x.id === line.classId);
    const unitPrice = classPrice(data, c);
    const pct = benefitsOf(data, memberId)?.classDiscountPct ?? 0;
    return { line, unitPrice, membershipDiscount: roundVnd(unitPrice * pct / 100), benefitKind: pct ? 'DISCOUNT' : undefined };
  }
  const p = data.plans.find((x) => x.id === line.planId);
  return { line, unitPrice: p?.price ?? 0, membershipDiscount: 0 };
}

/** Phân bổ số tiền về các dòng theo tỷ trọng cơ sở: floor rồi phát từng đồng dư theo phần lẻ giảm dần (BR_3.12). */
export function allocate(total: number, bases: number[]): number[] {
  const sum = bases.reduce((s, b) => s + b, 0);
  if (sum <= 0 || total <= 0) return bases.map(() => 0);
  const raw = bases.map((b) => (total * b) / sum);
  const out = raw.map((r) => Math.floor(r));
  let rest = total - out.reduce((s, x) => s + x, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).filter((x) => bases[x.i] > 0).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0 && order.length; k = (k + 1) % order.length) { out[order[k].i] += 1; rest -= 1; }
  return out;
}

export const findCoupon = (data: AppData, code?: string) => { const c = (code ?? '').trim().toUpperCase(); return c ? data.coupons.find((x) => !x.deletedAt && x.code.toUpperCase() === c) : undefined; };

/** Kiểm tra coupon cho đơn (BR_3.5). Trả về lỗi hoặc tổng giảm + cơ sở từng dòng. */
function applyCoupon(data: AppData, buyer: Buyer | null, coupon: Coupon, lines: Omit<LineQuote, 'couponDiscount' | 'total'>[]): { error?: string; discount: number; perLine: number[] } {
  const none = { discount: 0, perLine: lines.map(() => 0) };
  const today = dayjs().format('YYYY-MM-DD');
  if (!coupon.active) return { ...none, error: 'Mã đã ngừng áp dụng' };
  if (today < coupon.validFrom || today > coupon.validTo) return { ...none, error: 'Mã ngoài thời gian hiệu lực' };
  if (coupon.usedCount >= coupon.maxUses) return { ...none, error: 'Mã đã hết lượt sử dụng' };
  if (buyer?.kind !== 'MEMBER') return { ...none, error: 'Khách vãng lai không dùng được coupon (D02)' };
  const mine = data.orders.filter((o) => o.buyerId === buyer.memberId && o.couponCode?.toUpperCase() === coupon.code.toUpperCase()).length;
  if (mine >= coupon.maxUsesPerUser) return { ...none, error: `Bạn đã dùng mã này ${mine}/${coupon.maxUsesPerUser} lần` };
  const ok = (t: OrderItemType) => !coupon.applicableTypes || coupon.applicableTypes.includes(t);
  const eligible = lines.filter((l) => ok(l.line.type));
  if (!eligible.length) return { ...none, error: 'Không có dòng nào thuộc loại áp dụng của mã' };
  const listSum = eligible.reduce((s, l) => s + l.unitPrice, 0);
  if (listSum < coupon.minOrderAmount) return { ...none, error: `Cần tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')} ₫ cho các dòng áp dụng` };
  const bases = lines.map((l) => (ok(l.line.type) ? l.unitPrice - l.membershipDiscount : 0));
  const base = bases.reduce((s, b) => s + b, 0);
  if (base <= 0) return { ...none, error: 'Các dòng áp dụng đã miễn phí, không áp coupon' };
  let discount = coupon.discountType === 'PERCENT' ? roundVnd(base * coupon.discountValue / 100) : coupon.discountValue;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, base);
  return { discount, perLine: allocate(discount, bases) };
}

/** Báo giá toàn giỏ: giá gốc → quyền lợi membership → coupon (BR_2.5 / BR_3.5 / BR_3.12). */
export function quoteCart(data: AppData, buyer: Buyer | null, lines: CartLine[], couponCode?: string): CartQuote {
  const freeUsed: Record<string, number> = {};
  const base = lines.map((line, i) => ({ ...quoteLine(data, buyer, line, freeUsed), error: validateLine(data, buyer, line, lines.filter((_, j) => j !== i)) ?? undefined }));
  const coupon = findCoupon(data, couponCode);
  let couponError = couponCode?.trim() && !coupon ? 'Không tìm thấy mã' : undefined;
  let perLine = base.map(() => 0);
  let couponDiscount = 0;
  if (coupon) { const r = applyCoupon(data, buyer, coupon, base); couponError = r.error; couponDiscount = r.discount; perLine = r.perLine; }
  const out = base.map((l, i) => ({ ...l, couponDiscount: perLine[i], total: l.unitPrice - l.membershipDiscount - perLine[i] }));
  return {
    lines: out,
    subtotal: out.reduce((s, l) => s + l.unitPrice, 0),
    membershipDiscount: out.reduce((s, l) => s + l.membershipDiscount, 0),
    couponDiscount,
    total: out.reduce((s, l) => s + l.total, 0),
    coupon: coupon && !couponError ? coupon : undefined,
    couponError,
    valid: out.length > 0 && out.every((l) => !l.error) && !couponError,
  };
}

export const ITEM_TYPE_LABEL: Record<OrderItemType, string> = { MEMBERSHIP: 'Gói thành viên', FACILITY_BOOKING: 'Đặt sân / phòng', FACILITY_PACKAGE: 'Gói sân định kỳ', COURSE_ENROLLMENT: 'Đăng ký lớp' };
