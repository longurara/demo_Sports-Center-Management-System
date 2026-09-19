/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { initialData } from '../mock/data';
import type { AppData, Booking, Buyer, CartLine, Notification, Order, OrderItem, PaymentMethod, Subscription, SystemSettings, User, WalletTransaction } from '../types';
import { quoteCart, type CartQuote } from '../utils/pricing';
import { activeMembership, packageDates, roomOf } from '../utils/slots';
import { classDates, classSessions } from '../utils/classes';
import { nextOrderNumber } from '../utils/invoice';

type ArrayKeys<T> = { [K in keyof T]: T[K] extends unknown[] ? K : never }[keyof T];
type Collection = ArrayKeys<AppData>;
type Item<K extends Collection> = AppData[K][number];

export interface Cart { buyer: Buyer | null; lines: CartLine[]; couponCode: string }
export type CheckoutResult = { ok: true; order: Order } | { ok: false; error: string };

interface AppContextValue {
  data: AppData;
  currentUser: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  add: <K extends Collection>(key: K, item: Omit<Item<K>, 'id'>) => Item<K>;
  update: <K extends Collection>(key: K, id: string, patch: Partial<Item<K>>) => void;
  remove: <K extends Collection>(key: K, id: string) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  log: (action: string, entity: string, entityId: string, detail: string) => void;
  notify: (userId: string, title: string, content: string) => void;
  // helpers
  userById: (id?: string) => User | undefined;
  nameOf: (id?: string) => string;
  activeSubscription: (memberId: string) => Subscription | undefined;
  membershipStatus: (memberId: string) => 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NONE';
  walletBalance: (memberId?: string) => number;
  myNotifications: () => Notification[];
  resetData: () => void;
  // giỏ / đơn đang soạn (UC_3.18–3.20)
  cart: Cart;
  quote: CartQuote;
  setCartBuyer: (b: Buyer | null) => void;
  addToCart: (line: Omit<CartLine, 'key'>) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  setCoupon: (code: string) => void;
  checkout: (method: PaymentMethod) => CheckoutResult;
  // ví & hoàn tiền (UC_3.1/3.2/3.5)
  topUp: (memberId: string, amount: number, gateway: WalletTransaction['gateway'], ref?: string) => void;
  refundItem: (orderItemId: string, amount: number, reason: string) => number;
  // nghiệp vụ hủy
  cancelBooking: (bookingId: string, by: 'MEMBER' | 'STAFF' | 'SYSTEM', reason?: string) => { refunded: number };
  cancelPackage: (packageId: string) => { refunded: number; cancelled: number };
  cancelEnrollment: (enrollmentId: string, by: 'MEMBER' | 'STAFF') => { refunded: number };
  cancelMembership: (subscriptionId: string) => void;
  cancelClass: (classId: string, reason: string) => { refunded: number; members: number };
  cancelSession: (sessionId: string, reason: string) => { refunded: number };
  recomputeClass: (classId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let seq = Number(sessionStorage.getItem('sc_seq') ?? 1000);
export const nextId = (prefix = 'id') => { sessionStorage.setItem('sc_seq', String(++seq)); return `${prefix}${seq}`; };

// Prototype: giữ dữ liệu giả lập trong sessionStorage để F5 không mất trạng thái khi demo.
const DATA_KEY = 'sc_data_v7'; // đổi version khi thay đổi cấu trúc mock data
const load = <T,>(key: string, fallback: T): T => {
  try { const v = sessionStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const now = () => dayjs().format('YYYY-MM-DD HH:mm');
const emptyCart: Cart = { buyer: null, lines: [], couponCode: '' };

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load(DATA_KEY, initialData));
  const [currentUser, setCurrentUser] = useState<User | null>(() => load('sc_user', null));
  const [cart, setCart] = useState<Cart>(() => load('sc_cart', emptyCart));
  useEffect(() => { sessionStorage.setItem(DATA_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { if (currentUser) sessionStorage.setItem('sc_user', JSON.stringify(currentUser)); else sessionStorage.removeItem('sc_user'); }, [currentUser]);
  useEffect(() => { sessionStorage.setItem('sc_cart', JSON.stringify(cart)); }, [cart]);
  // Giữ currentUser đồng bộ với data (ví, hồ sơ)
  useEffect(() => { if (currentUser) { const u = data.users.find((x) => x.id === currentUser.id); if (u && u !== currentUser) setCurrentUser(u); } }, [data.users, currentUser]);

  const login = useCallback((email: string) => {
    const u = data.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.status !== 'ACTIVE') return false;
    setCurrentUser(u);
    setCart(u.role === 'MEMBER' ? { buyer: { kind: 'MEMBER', memberId: u.id }, lines: [], couponCode: '' } : emptyCart);
    return true;
  }, [data.users]);
  const logout = useCallback(() => { setCurrentUser(null); setCart(emptyCart); }, []);

  const add = useCallback(<K extends Collection>(key: K, item: Omit<Item<K>, 'id'>) => {
    const full = { ...item, id: nextId(key.slice(0, 2)) } as Item<K>;
    setData((prev) => ({ ...prev, [key]: [...(prev[key] as Item<K>[]), full] }));
    return full;
  }, []);
  const update = useCallback(<K extends Collection>(key: K, id: string, patch: Partial<Item<K>>) => {
    setData((prev) => ({ ...prev, [key]: (prev[key] as Item<K>[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);
  const remove = useCallback(<K extends Collection>(key: K, id: string) => {
    setData((prev) => ({ ...prev, [key]: (prev[key] as Item<K>[]).filter((x) => x.id !== id) }));
  }, []);
  const updateSettings = useCallback((patch: Partial<SystemSettings>) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })), []);

  const log = useCallback((action: string, entity: string, entityId: string, detail: string) => {
    setData((prev) => ({ ...prev, auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action, entity, entityId, detail, createdAt: now() }, ...prev.auditLogs] }));
  }, [currentUser]);
  const notify = useCallback((userId: string, title: string, content: string) => {
    setData((prev) => ({ ...prev, notifications: [{ id: nextId('n'), userId, title, content, read: false, createdAt: now() }, ...prev.notifications] }));
  }, []);

  // ---------- Giỏ ----------
  const quote = useMemo(() => quoteCart(data, cart.buyer, cart.lines, cart.couponCode), [data, cart]);
  const setCartBuyer = useCallback((b: Buyer | null) => setCart((c) => ({ ...c, buyer: b, lines: [], couponCode: '' })), []);
  const addToCart = useCallback((line: Omit<CartLine, 'key'>) => setCart((c) => ({ ...c, lines: [...c.lines, { ...line, key: nextId('ln') }] })), []);
  const removeFromCart = useCallback((key: string) => setCart((c) => ({ ...c, lines: c.lines.filter((l) => l.key !== key) })), []);
  const clearCart = useCallback(() => setCart((c) => ({ ...c, lines: [], couponCode: '' })), []);
  const setCoupon = useCallback((code: string) => setCart((c) => ({ ...c, couponCode: code.trim().toUpperCase() })), []);

  /** Ghi một khoản hoàn cho item: cập nhật item/order, cộng ví, ledger REFUND, notify (BR_3.13). Trả về số tiền thực hoàn. */
  const applyRefund = (d: AppData, orderItemId: string | undefined, amount: number, reason: string, actor: string): { d: AppData; refunded: number } => {
    const item = d.orderItems.find((x) => x.id === orderItemId);
    if (!item || amount <= 0) return { d, refunded: 0 };
    const order = d.orders.find((o) => o.id === item.orderId)!;
    if (!order.buyerId) return { d, refunded: 0 }; // guest không hoàn (BR_2.17)
    const amt = Math.min(amount, item.total - item.refundedAmount, order.total - order.refundedAmount);
    if (amt <= 0) return { d, refunded: 0 };
    const newOrderRefund = order.refundedAmount + amt;
    const u = d.users.find((x) => x.id === order.buyerId)!;
    const after = (u.walletBalance ?? 0) + amt;
    return {
      refunded: amt,
      d: {
        ...d,
        orderItems: d.orderItems.map((x) => (x.id === item.id ? { ...x, refundedAmount: x.refundedAmount + amt } : x)),
        orders: d.orders.map((o) => (o.id === order.id ? { ...o, refundedAmount: newOrderRefund, status: newOrderRefund >= o.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } : o)),
        users: d.users.map((x) => (x.id === u.id ? { ...x, walletBalance: after } : x)),
        walletTransactions: [...d.walletTransactions, { id: nextId('wt'), memberId: u.id, type: 'REFUND', amount: amt, balanceAfter: after, orderId: order.id, orderItemId: item.id, note: `Hoàn tiền: ${item.name} — ${reason}`, createdAt: now(), createdBy: actor }],
        notifications: [{ id: nextId('n'), userId: u.id, title: 'Hoàn tiền vào ví', content: `${amt.toLocaleString('vi-VN')} ₫ đã hoàn cho "${item.name}" (${reason}). Số dư: ${after.toLocaleString('vi-VN')} ₫.`, read: false, createdAt: now() }, ...d.notifications],
      },
    };
  };

  /** Thanh toán giỏ: kiểm tra lại toàn bộ, thu tiền một lần, tạo order/items/dịch vụ atomic (UC_3.3/3.4, BR_3.2). */
  const checkout = useCallback((method: PaymentMethod): CheckoutResult => {
    const q = quoteCart(data, cart.buyer, cart.lines, cart.couponCode);
    const buyer = cart.buyer;
    if (!buyer) return { ok: false, error: 'Chưa chọn người mua' };
    if (!cart.lines.length) return { ok: false, error: 'Đơn rỗng — cần ít nhất một dòng dịch vụ (BR_3.16)' };
    if (!q.valid) return { ok: false, error: q.couponError ?? q.lines.find((l) => l.error)?.error ?? 'Đơn không hợp lệ' };
    if (buyer.kind === 'GUEST' && method === 'WALLET') return { ok: false, error: 'Khách vãng lai không có ví' };
    if (buyer.kind === 'MEMBER' && currentUser?.role === 'MEMBER' && method !== 'WALLET') return { ok: false, error: 'Mua online chỉ thanh toán bằng ví (§2.4)' };
    const memberId = buyer.kind === 'MEMBER' ? buyer.memberId : undefined;
    const member = data.users.find((u) => u.id === memberId);
    if (method === 'WALLET' && (member?.walletBalance ?? 0) < q.total) return { ok: false, error: `Ví không đủ: cần ${q.total.toLocaleString('vi-VN')} ₫, còn ${(member?.walletBalance ?? 0).toLocaleString('vi-VN')} ₫` };

    let d: AppData = { ...data };
    const actor = currentUser?.id ?? 'system';
    const paidAt = now();
    const order: Order = { id: nextId('o'), orderNumber: nextOrderNumber(d.orders), buyerId: memberId, guestName: buyer.kind === 'GUEST' ? buyer.name : undefined, guestPhone: buyer.kind === 'GUEST' ? buyer.phone : undefined, paymentMethod: method, couponCode: q.coupon?.code, subtotal: q.subtotal, membershipDiscount: q.membershipDiscount, couponDiscount: q.couponDiscount, total: q.total, refundedAmount: 0, status: 'PAID', paidAt, createdBy: actor };
    const items: OrderItem[] = [];
    const notes: Notification[] = [];
    const audits: AppData['auditLogs'] = [];
    const bookings: Booking[] = [];
    q.lines.forEach((l, i) => {
      const item: OrderItem = { id: nextId('oi'), orderId: order.id, lineNumber: i + 1, type: l.line.type, refId: '', name: l.line.name, detail: l.line.detail, unitPrice: l.unitPrice, membershipDiscount: l.membershipDiscount, couponDiscount: l.couponDiscount, total: l.total, refundedAmount: 0 };
      const ln = l.line;
      if (ln.type === 'FACILITY_BOOKING') {
        const b: Booking = { id: nextId('b'), roomId: ln.roomId!, memberId, guestName: order.guestName, guestPhone: order.guestPhone, date: ln.date!, startTime: ln.startTime!, endTime: ln.endTime!, listPrice: l.unitPrice, price: l.total, refundedAmount: 0, benefitKind: l.benefitKind, status: 'CONFIRMED', orderItemId: item.id, createdAt: paidAt, createdBy: actor };
        bookings.push(b); item.refId = b.id;
      } else if (ln.type === 'FACILITY_PACKAGE') {
        const pk = { id: nextId('pk'), roomId: ln.roomId!, memberId: memberId!, startDate: ln.startDate!, daysOfWeek: ln.daysOfWeek!, startTime: ln.startTime!, endTime: ln.endTime!, weeks: ln.weeks!, status: 'ACTIVE' as const, orderItemId: item.id, createdAt: paidAt };
        d = { ...d, packages: [...d.packages, pk] }; item.refId = pk.id;
        // allocation coupon về booking con theo cơ sở sau membership (BR_3.12)
        const subs = l.subBookings ?? [];
        const baseSum = subs.reduce((s, x) => s + x.price, 0);
        let restCoupon = l.couponDiscount;
        packageDates(pk.startDate, pk.daysOfWeek, pk.weeks).forEach((date, k) => {
          const sb = subs[k]; const share = baseSum > 0 ? Math.floor(l.couponDiscount * sb.price / baseSum) : 0; restCoupon -= share;
          bookings.push({ id: nextId('b'), roomId: pk.roomId, memberId, date, startTime: pk.startTime, endTime: pk.endTime, listPrice: sb.listPrice, price: sb.price - share, refundedAmount: 0, benefitKind: sb.benefitKind, status: 'CONFIRMED', packageId: pk.id, orderItemId: item.id, createdAt: paidAt, createdBy: actor });
        });
        if (restCoupon > 0) { const last = bookings[bookings.length - 1]; last.price -= restCoupon; }
      } else if (ln.type === 'COURSE_ENROLLMENT') {
        const e = { id: nextId('e'), classId: ln.classId!, memberId: memberId!, enrolledAt: dayjs().format('YYYY-MM-DD'), status: 'ENROLLED' as const, orderItemId: item.id, refundedAmount: 0 };
        d = { ...d, enrollments: [...d.enrollments, e] }; item.refId = e.id;
        const cls = d.classes.find((c) => c.id === e.classId);
        if (cls?.coachId) notes.push({ id: nextId('n'), userId: cls.coachId, title: 'Học viên mới', content: `${member?.fullName} đã đăng ký lớp ${cls.name}.`, read: false, createdAt: paidAt });
      } else if (ln.type === 'MEMBERSHIP') {
        const plan = d.plans.find((p) => p.id === ln.planId)!;
        const today = dayjs().format('YYYY-MM-DD');
        // lazy-expire rồi nối kỳ / tạo mới (BR_1.5, BR_1.7)
        d = { ...d, subscriptions: d.subscriptions.map((s) => (s.memberId === memberId && s.status === 'ACTIVE' && s.endDate <= today ? { ...s, status: 'EXPIRED' } : s)) };
        const cur = d.subscriptions.find((s) => s.memberId === memberId && s.status === 'ACTIVE');
        if (cur) {
          const end = dayjs(cur.endDate).add(plan.durationDays, 'day').format('YYYY-MM-DD');
          d = { ...d, subscriptions: d.subscriptions.map((s) => (s.id === cur.id ? { ...s, endDate: end, planId: plan.id } : s)) };
          item.refId = cur.id; item.detail = `Gia hạn ${dayjs(cur.endDate).format('DD/MM/YYYY')} → ${dayjs(end).format('DD/MM/YYYY')} · ${plan.durationDays} ngày`;
        } else {
          const s: Subscription = { id: nextId('s'), memberId: memberId!, planId: plan.id, startDate: today, endDate: dayjs().add(plan.durationDays, 'day').format('YYYY-MM-DD'), status: 'ACTIVE', autoRenew: false, orderItemId: item.id };
          d = { ...d, subscriptions: [...d.subscriptions, s] }; item.refId = s.id; item.detail = `${dayjs(s.startDate).format('DD/MM/YYYY')} → ${dayjs(s.endDate).format('DD/MM/YYYY')} · ${plan.durationDays} ngày`;
        }
      }
      items.push(item);
    });
    // Thu tiền một lần
    let users = d.users; const wallet = [...d.walletTransactions];
    if (method === 'WALLET' && q.total > 0 && member) {
      const after = (member.walletBalance ?? 0) - q.total;
      users = users.map((u) => (u.id === member.id ? { ...u, walletBalance: after } : u));
      wallet.push({ id: nextId('wt'), memberId: member.id, type: 'PAYMENT', amount: q.total, balanceAfter: after, orderId: order.id, note: `Thanh toán đơn ${order.orderNumber}`, createdAt: paidAt, createdBy: actor });
    }
    const coupons = q.coupon ? d.coupons.map((c) => (c.id === q.coupon!.id ? { ...c, usedCount: c.usedCount + 1 } : c)) : d.coupons;
    if (memberId) notes.push({ id: nextId('n'), userId: memberId, title: 'Thanh toán thành công', content: `Đơn ${order.orderNumber}: ${items.map((i) => i.name).join(', ')} · ${q.total.toLocaleString('vi-VN')} ₫ (${method === 'WALLET' ? 'trừ ví' : 'tại quầy'}).`, read: false, createdAt: paidAt });
    audits.push({ id: nextId('a'), userId: actor, action: 'CHECKOUT', entity: 'Order', entityId: order.id, detail: `${order.orderNumber}: ${items.length} dòng, ${q.total.toLocaleString('vi-VN')} ₫ · ${method}${order.guestName ? ` · guest ${order.guestName}` : ''}`, createdAt: paidAt });
    d = { ...d, users, walletTransactions: wallet, coupons, orders: [...d.orders, order], orderItems: [...d.orderItems, ...items], bookings: [...d.bookings, ...bookings], notifications: [...notes, ...d.notifications], auditLogs: [...audits, ...d.auditLogs] };
    setData(d);
    setCart((c) => ({ ...c, lines: [], couponCode: '' }));
    return { ok: true, order };
  }, [data, cart, currentUser]);

  const topUp = useCallback((memberId: string, amount: number, gateway: WalletTransaction['gateway'], ref?: string) => {
    setData((prev) => {
      const u = prev.users.find((x) => x.id === memberId); if (!u) return prev;
      const after = (u.walletBalance ?? 0) + amount;
      return { ...prev, users: prev.users.map((x) => (x.id === memberId ? { ...x, walletBalance: after } : x)), walletTransactions: [...prev.walletTransactions, { id: nextId('wt'), memberId, type: 'TOP_UP', amount, balanceAfter: after, gateway, gatewayRef: ref, gatewayStatus: gateway === 'CASH' || gateway === 'BANK' ? undefined : 'SUCCESS', note: gateway === 'CASH' ? 'Nạp tiền mặt tại quầy' : gateway === 'BANK' ? 'Nạp chuyển khoản tại quầy' : `Nạp ví qua ${gateway}`, createdAt: now(), createdBy: currentUser?.id ?? memberId }], notifications: [{ id: nextId('n'), userId: memberId, title: 'Nạp ví thành công', content: `+${amount.toLocaleString('vi-VN')} ₫. Số dư: ${after.toLocaleString('vi-VN')} ₫.`, read: false, createdAt: now() }, ...prev.notifications] };
    });
  }, [currentUser]);

  const refundItem = useCallback((orderItemId: string, amount: number, reason: string) => {
    const r = applyRefund(data, orderItemId, amount, reason, currentUser?.id ?? 'system');
    if (r.refunded > 0) setData(r.d);
    return r.refunded;
  }, [data, currentUser]);

  const cancelBooking = useCallback((bookingId: string, by: 'MEMBER' | 'STAFF' | 'SYSTEM', reason?: string) => {
    const b = data.bookings.find((x) => x.id === bookingId);
    if (!b || b.status === 'CANCELLED') return { refunded: 0 };
    const hoursLeft = dayjs(`${b.date} ${b.startTime}`).diff(dayjs(), 'hour', true);
    const eligible = by === 'SYSTEM' || hoursLeft >= data.settings.bookingCancelDeadlineHours; // BR_2.6 / BR_2.19
    let d: AppData = { ...data, bookings: data.bookings.map((x) => (x.id === bookingId ? { ...x, status: 'CANCELLED' } : x)) };
    let refunded = 0;
    if (eligible && b.memberId) { const r = applyRefund(d, b.orderItemId, b.price - b.refundedAmount, reason ?? 'hủy trước deadline', currentUser?.id ?? 'system'); d = r.d; refunded = r.refunded; if (refunded) d = { ...d, bookings: d.bookings.map((x) => (x.id === bookingId ? { ...x, refundedAmount: x.refundedAmount + refunded } : x)) }; }
    const room = roomOf(d, b.roomId)?.name;
    if (b.memberId) d = { ...d, notifications: [{ id: nextId('n'), userId: b.memberId, title: 'Lượt đặt đã hủy', content: `${room} ${dayjs(b.date).format('DD/MM')} ${b.startTime}–${b.endTime} đã hủy${reason ? ` (${reason})` : ''}. ${refunded ? `Hoàn ${refunded.toLocaleString('vi-VN')} ₫ vào ví.` : 'Không hoàn tiền.'}`, read: false, createdAt: now() }, ...d.notifications] };
    d = { ...d, auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_BOOKING', entity: 'Booking', entityId: b.id, detail: `Hủy ${room} ${dayjs(b.date).format('DD/MM')} ${b.startTime} · ${b.memberId ? d.users.find((u) => u.id === b.memberId)?.fullName : `guest ${b.guestName}`} · hoàn ${refunded.toLocaleString('vi-VN')} ₫`, createdAt: now() }, ...d.auditLogs] };
    setData(d);
    return { refunded };
  }, [data, currentUser]);

  const cancelPackage = useCallback((packageId: string) => {
    const pk = data.packages.find((p) => p.id === packageId);
    if (!pk || pk.status === 'CANCELLED') return { refunded: 0, cancelled: 0 };
    let d: AppData = { ...data, packages: data.packages.map((p) => (p.id === packageId ? { ...p, status: 'CANCELLED' } : p)) };
    let refunded = 0, cancelled = 0;
    for (const b of d.bookings.filter((x) => x.packageId === packageId && x.status === 'CONFIRMED' && dayjs(`${x.date} ${x.startTime}`).isAfter(dayjs()))) {
      cancelled++;
      const eligible = dayjs(`${b.date} ${b.startTime}`).diff(dayjs(), 'hour', true) >= d.settings.bookingCancelDeadlineHours;
      d = { ...d, bookings: d.bookings.map((x) => (x.id === b.id ? { ...x, status: 'CANCELLED' } : x)) };
      if (eligible) { const r = applyRefund(d, b.orderItemId, b.price - b.refundedAmount, `hủy gói định kỳ, buổi ${dayjs(b.date).format('DD/MM')}`, currentUser?.id ?? 'system'); d = r.d; refunded += r.refunded; if (r.refunded) d = { ...d, bookings: d.bookings.map((x) => (x.id === b.id ? { ...x, refundedAmount: x.refundedAmount + r.refunded } : x)) }; }
    }
    d = { ...d, auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_PACKAGE', entity: 'FacilityPackage', entityId: pk.id, detail: `Hủy gói định kỳ ${roomOf(d, pk.roomId)?.name}: ${cancelled} buổi, hoàn ${refunded.toLocaleString('vi-VN')} ₫`, createdAt: now() }, ...d.auditLogs] };
    setData(d);
    return { refunded, cancelled };
  }, [data, currentUser]);

  const cancelEnrollment = useCallback((enrollmentId: string, by: 'MEMBER' | 'STAFF') => {
    const e = data.enrollments.find((x) => x.id === enrollmentId);
    if (!e || e.status === 'CANCELLED') return { refunded: 0 };
    const cls = data.classes.find((c) => c.id === e.classId)!;
    const item = data.orderItems.find((x) => x.id === e.orderItemId);
    const daysLeft = dayjs(cls.startDate).diff(dayjs().startOf('day'), 'day');
    const eligible = daysLeft >= data.settings.courseCancelDeadlineDays; // BR_2.7
    let d: AppData = { ...data, enrollments: data.enrollments.map((x) => (x.id === enrollmentId ? { ...x, status: 'CANCELLED' } : x)) };
    let refunded = 0;
    if (eligible && item) { const r = applyRefund(d, item.id, item.total - item.refundedAmount, `hủy trước ${data.settings.courseCancelDeadlineDays} ngày`, currentUser?.id ?? 'system'); d = r.d; refunded = r.refunded; if (refunded) d = { ...d, enrollments: d.enrollments.map((x) => (x.id === enrollmentId ? { ...x, refundedAmount: x.refundedAmount + refunded } : x)) }; }
    d = { ...d, notifications: [{ id: nextId('n'), userId: e.memberId, title: 'Đã hủy đăng ký lớp', content: `Lớp ${cls.name} đã hủy đăng ký${by === 'STAFF' ? ' (tại quầy)' : ''}. ${refunded ? `Hoàn ${refunded.toLocaleString('vi-VN')} ₫ vào ví.` : 'Quá deadline, không hoàn tiền.'}`, read: false, createdAt: now() }, ...d.notifications], auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_ENROLLMENT', entity: 'Enrollment', entityId: e.id, detail: `Hủy lớp ${cls.name} của ${d.users.find((u) => u.id === e.memberId)?.fullName} · hoàn ${refunded.toLocaleString('vi-VN')} ₫`, createdAt: now() }, ...d.auditLogs] };
    setData(d);
    return { refunded };
  }, [data, currentUser]);

  const cancelMembership = useCallback((subscriptionId: string) => {
    const s = data.subscriptions.find((x) => x.id === subscriptionId); if (!s) return;
    setData((prev) => ({ ...prev, subscriptions: prev.subscriptions.map((x) => (x.id === subscriptionId ? { ...x, status: 'CANCELLED', autoRenew: false } : x)), notifications: [{ id: nextId('n'), userId: s.memberId, title: 'Gói thành viên đã hủy', content: 'Quyền lợi dừng ngay, không hoàn tiền (BR_1.9).', read: false, createdAt: now() }, ...prev.notifications], auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_MEMBERSHIP', entity: 'Membership', entityId: s.id, detail: `Hủy gói của ${prev.users.find((u) => u.id === s.memberId)?.fullName}`, createdAt: now() }, ...prev.auditLogs] }));
  }, [data, currentUser]);

  /** Hủy lớp: hoàn phần chưa hoàn (chưa bắt đầu) hoặc allocation các buổi chưa diễn ra (đang học) — BR_2.7b */
  const cancelClass = useCallback((classId: string, reason: string) => {
    const cls = data.classes.find((c) => c.id === classId);
    if (!cls || cls.status === 'CANCELLED') return { refunded: 0, members: 0 };
    const all = classSessions(data, classId);
    const future = all.filter((s) => `${s.date} ${s.startTime}` > now());
    const ratio = all.length ? future.length / all.length : 1;
    let d: AppData = { ...data, classes: data.classes.map((c) => (c.id === classId ? { ...c, status: 'CANCELLED' } : c)) };
    let refunded = 0, members = 0;
    for (const e of d.enrollments.filter((x) => x.classId === classId && x.status === 'ENROLLED')) {
      members++;
      const item = d.orderItems.find((x) => x.id === e.orderItemId);
      if (item) { const amt = Math.floor((item.total - item.refundedAmount) * ratio); const r = applyRefund(d, item.id, amt, `lớp bị hủy: ${reason}`, currentUser?.id ?? 'system'); d = r.d; refunded += r.refunded; }
      d = { ...d, notifications: [{ id: nextId('n'), userId: e.memberId, title: 'Lớp bị hủy', content: `Lớp ${cls.name} đã bị hủy (${reason}).`, read: false, createdAt: now() }, ...d.notifications] };
    }
    if (cls.coachId) d = { ...d, notifications: [{ id: nextId('n'), userId: cls.coachId, title: 'Lớp bị hủy', content: `Lớp ${cls.name} đã bị hủy (${reason}).`, read: false, createdAt: now() }, ...d.notifications] };
    d = { ...d, auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_CLASS', entity: 'Class', entityId: classId, detail: `Hủy lớp ${cls.name}: ${reason} · ${members} HV · hoàn ${refunded.toLocaleString('vi-VN')} ₫`, createdAt: now() }, ...d.auditLogs] };
    setData(d);
    return { refunded, members };
  }, [data, currentUser]);

  const recomputeClass = useCallback((classId: string) => {
    setData((prev) => { const dates = classDates(prev.sessions.filter((s) => s.classId === classId)); return { ...prev, classes: prev.classes.map((c) => (c.id === classId && dates.startDate ? { ...c, startDate: dates.startDate, endDate: dates.endDate } : c)) }; });
  }, []);

  /** Hủy riêng một buổi (D05): hoàn allocation buổi đó cho từng học viên, cập nhật ngày lớp */
  const cancelSession = useCallback((sessionId: string, reason: string) => {
    const s = data.sessions.find((x) => x.id === sessionId);
    if (!s || s.status === 'CANCELLED') return { refunded: 0 };
    const cls = data.classes.find((c) => c.id === s.classId)!;
    const total = classSessions(data, cls.id).length;
    let d: AppData = { ...data, sessions: data.sessions.map((x) => (x.id === sessionId ? { ...x, status: 'CANCELLED', note: reason } : x)) };
    let refunded = 0;
    if (`${s.date} ${s.startTime}` > now()) {
      for (const e of d.enrollments.filter((x) => x.classId === cls.id && x.status === 'ENROLLED')) {
        const item = d.orderItems.find((x) => x.id === e.orderItemId);
        if (item && total) { const r = applyRefund(d, item.id, Math.floor(item.total / total), `hủy buổi ${dayjs(s.date).format('DD/MM')}: ${reason}`, currentUser?.id ?? 'system'); d = r.d; refunded += r.refunded; }
        d = { ...d, notifications: [{ id: nextId('n'), userId: e.memberId, title: 'Buổi học bị hủy', content: `${cls.name} — buổi ${dayjs(s.date).format('DD/MM')} ${s.startTime} đã hủy (${reason}).`, read: false, createdAt: now() }, ...d.notifications] };
      }
    }
    const dates = classDates(d.sessions.filter((x) => x.classId === cls.id));
    d = { ...d, classes: d.classes.map((c) => (c.id === cls.id && dates.startDate ? { ...c, startDate: dates.startDate, endDate: dates.endDate } : c)), auditLogs: [{ id: nextId('a'), userId: currentUser?.id ?? 'system', action: 'CANCEL_SESSION', entity: 'ClassSession', entityId: s.id, detail: `Hủy buổi ${dayjs(s.date).format('DD/MM')} ${s.startTime} lớp ${cls.name}: ${reason} · hoàn ${refunded.toLocaleString('vi-VN')} ₫`, createdAt: now() }, ...d.auditLogs] };
    setData(d);
    return { refunded };
  }, [data, currentUser]);

  const value = useMemo<AppContextValue>(() => {
    const userById = (id?: string) => data.users.find((u) => u.id === id);
    const nameOf = (id?: string) => userById(id)?.fullName ?? (id === 'system' ? 'Hệ thống' : '—');
    const activeSubscription = (memberId: string) => activeMembership(data, memberId);
    const membershipStatus = (memberId: string) => {
      const s = activeSubscription(memberId);
      if (!s) return data.subscriptions.some((x) => x.memberId === memberId) ? 'EXPIRED' : 'NONE';
      const days = dayjs(s.endDate).diff(dayjs().startOf('day'), 'day');
      if (days <= 0) return 'EXPIRED';
      if (days <= 7) return 'EXPIRING';
      return 'ACTIVE';
    };
    const walletBalance = (memberId?: string) => userById(memberId)?.walletBalance ?? 0;
    const myNotifications = () => data.notifications.filter((n) => n.userId === currentUser?.id);
    return {
      data, currentUser, login, logout, add, update, remove, updateSettings, log, notify,
      userById, nameOf, activeSubscription, membershipStatus, walletBalance, myNotifications,
      resetData: () => { sessionStorage.removeItem(DATA_KEY); sessionStorage.removeItem('sc_seq'); setData(initialData); setCart((c) => ({ ...c, lines: [], couponCode: '' })); },
      cart, quote, setCartBuyer, addToCart, removeFromCart, clearCart, setCoupon, checkout,
      topUp, refundItem, cancelBooking, cancelPackage, cancelEnrollment, cancelMembership, cancelClass, cancelSession, recomputeClass,
    };
  }, [data, currentUser, login, logout, add, update, remove, updateSettings, log, notify, cart, quote, setCartBuyer, addToCart, removeFromCart, clearCart, setCoupon, checkout, topUp, refundItem, cancelBooking, cancelPackage, cancelEnrollment, cancelMembership, cancelClass, cancelSession, recomputeClass]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
export const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
