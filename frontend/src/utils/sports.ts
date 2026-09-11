import dayjs from 'dayjs';
import type { AppData, CourtBooking, Plan, Room } from '../types';

/** Giờ hoạt động của sân (đặt theo khung 1 giờ). */
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 22;
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
export const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export const sportOf = (data: AppData, id?: string) => data.sports.find((s) => s.id === id);

/** Gói hiện tại của thành viên có bao gồm bộ môn này không? */
export function planCovers(data: AppData, memberId: string, sportId: string): { ok: boolean; plan?: Plan } {
  const sub = data.subscriptions.filter((s) => s.memberId === memberId && s.status === 'ACTIVE' && s.endDate >= dayjs().format('YYYY-MM-DD')).sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const plan = data.plans.find((p) => p.id === sub?.planId);
  if (!plan) return { ok: false };
  return { ok: plan.sportIds.length === 0 || plan.sportIds.includes(sportId), plan };
}

/** Các gói (đang bán) cho phép tập bộ môn này — dùng để gợi ý nâng cấp. */
export const plansFor = (data: AppData, sportId: string) => data.plans.filter((p) => p.active && (p.sportIds.length === 0 || p.sportIds.includes(sportId)));

const overlap = (aS: string, aE: string, bS: string, bE: string) => aS < bE && bS < aE;

export type SlotState = 'FREE' | 'BOOKED' | 'CLASS' | 'PAST' | 'MINE';

/** Trạng thái từng khung giờ của một sân trong ngày. */
export function courtDay(data: AppData, court: Room, date: string, meId?: string) {
  const dow = ((dayjs(date).day() + 6) % 7) + 1;
  const now = dayjs();
  const classSlots = data.schedules.filter((sc) => sc.dayOfWeek === dow && data.classes.some((c) => c.id === sc.classId && c.roomId === court.id && c.status === 'OPEN' && c.startDate <= date && c.endDate >= date));
  const bookings = data.courtBookings.filter((b) => b.courtId === court.id && b.date === date && b.status !== 'CANCELLED');
  return HOURS.map((h) => {
    const s = hh(h), e = hh(h + 1);
    const cls = classSlots.find((sc) => overlap(s, e, sc.startTime, sc.endTime));
    const bk = bookings.find((b) => overlap(s, e, b.startTime, b.endTime));
    let state: SlotState = 'FREE';
    if (cls) state = 'CLASS';
    else if (bk) state = bk.memberId === meId ? 'MINE' : 'BOOKED';
    else if (dayjs(`${date} ${e}`).isBefore(now)) state = 'PAST';
    return { hour: h, state, booking: bk, cls: cls ? data.classes.find((c) => c.id === cls.classId) : undefined };
  });
}

/** Sân có trống trong khoảng giờ không? Trả về lý do nếu không. */
export function courtConflict(data: AppData, courtId: string, date: string, start: string, end: string, excludeId?: string): string | null {
  const court = data.rooms.find((r) => r.id === courtId);
  if (!court) return 'Không tìm thấy sân';
  const dow = ((dayjs(date).day() + 6) % 7) + 1;
  const cls = data.schedules.find((sc) => sc.dayOfWeek === dow && overlap(start, end, sc.startTime, sc.endTime) && data.classes.some((c) => c.id === sc.classId && c.roomId === courtId && c.status === 'OPEN' && c.startDate <= date && c.endDate >= date));
  if (cls) return `Sân có lớp "${data.classes.find((c) => c.id === cls.classId)?.name}" ${cls.startTime}–${cls.endTime}`;
  const bk = data.courtBookings.find((b) => b.id !== excludeId && b.courtId === courtId && b.date === date && b.status !== 'CANCELLED' && overlap(start, end, b.startTime, b.endTime));
  if (bk) return `Đã có người đặt ${bk.startTime}–${bk.endTime}`;
  return null;
}

/** Giá thuê sân sau ưu đãi gói thành viên. */
export function courtPrice(data: AppData, memberId: string | undefined, court: Room, hours: number) {
  const base = (court.hourlyRate ?? 0) * hours;
  const cover = memberId && court.sportId ? planCovers(data, memberId, court.sportId) : { ok: false, plan: undefined as Plan | undefined };
  const sub = memberId ? data.subscriptions.find((s) => s.memberId === memberId && s.status === 'ACTIVE' && s.endDate >= dayjs().format('YYYY-MM-DD')) : undefined;
  const plan = cover.plan ?? data.plans.find((p) => p.id === sub?.planId);
  const discount = plan?.courtDiscount ?? 0;
  const price = Math.round(base * (100 - discount) / 100 / 1000) * 1000;
  return { base, discount, price, plan };
}

export const bookingLabel = (b: CourtBooking) => `${dayjs(b.date).format('DD/MM')} ${b.startTime}–${b.endTime}`;
