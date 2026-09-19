import dayjs from 'dayjs';
import type { AppData, Booking, GymClass, Plan, Room, Session, Subscription, SystemSettings } from '../types';

/** Lưới slot cố định của trung tâm — tính từ System Settings, không lưu bảng. */
export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const dowOf = (date: string) => ((dayjs(date).day() + 6) % 7) + 1;
export const overlap = (aS: string, aE: string, bS: string, bE: string) => aS < bE && bS < aE;

export interface Slot { start: string; end: string }
export function slotsOf(s: SystemSettings): Slot[] {
  const out: Slot[] = [];
  for (let m = toMin(s.openTime); m + s.slotMinutes <= toMin(s.closeTime); m += s.slotMinutes) out.push({ start: hhmm(m), end: hhmm(m + s.slotMinutes) });
  return out;
}
/** Khoảng giờ có khớp lưới slot không (bắt đầu tại mốc slot, dài bội số slot). */
export const onGrid = (s: SystemSettings, start: string, end: string) => {
  const a = toMin(start), b = toMin(end), o = toMin(s.openTime);
  return a >= o && b <= toMin(s.closeTime) && a < b && (a - o) % s.slotMinutes === 0 && (b - a) % s.slotMinutes === 0;
};

export const sportOf = (data: AppData, id?: string) => data.sports.find((s) => s.id === id);
export const roomOf = (data: AppData, id?: string) => data.rooms.find((r) => r.id === id);
/** Facility còn trong danh mục đặt mới */
export const bookableRooms = (data: AppData) => data.rooms.filter((r) => !r.deletedAt && r.isActive);

/** Membership đang có hiệu lực: ACTIVE và start <= today < end (BR_1.4) */
export function activeMembership(data: AppData, memberId?: string): Subscription | undefined {
  if (!memberId) return undefined;
  const today = dayjs().format('YYYY-MM-DD');
  return data.subscriptions.filter((s) => s.memberId === memberId && s.status === 'ACTIVE' && s.startDate <= today && today < s.endDate).sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
}
export function benefitsOf(data: AppData, memberId?: string): Plan | undefined {
  const s = activeMembership(data, memberId);
  return s ? data.plans.find((p) => p.id === s.planId) : undefined;
}

export type SlotState = 'FREE' | 'PARTIAL' | 'FULL' | 'MINE' | 'CLASS' | 'MAINT' | 'PAST' | 'OFF';

/** Bảo trì đang phủ khoảng giờ này? */
export function maintenanceAt(data: AppData, roomId: string, date: string, start: string, end: string) {
  const a = `${date} ${start}`, b = `${date} ${end}`;
  return data.maintenances.find((m) => !m.deletedAt && m.roomId === roomId && m.from < b && a < m.to);
}
/** Buổi học (không hủy, lớp không hủy) chiếm facility trong khoảng giờ — khóa hoàn toàn (BR_2.3) */
export function sessionAt(data: AppData, roomId: string, date: string, start: string, end: string, excludeSessionId?: string): (Session & { cls: GymClass }) | undefined {
  for (const s of data.sessions) {
    if (s.id === excludeSessionId || s.roomId !== roomId || s.date !== date || s.status !== 'SCHEDULED' || !overlap(start, end, s.startTime, s.endTime)) continue;
    const cls = data.classes.find((c) => c.id === s.classId);
    if (cls && cls.status !== 'CANCELLED') return { ...s, cls };
  }
  return undefined;
}
export const bookingsAt = (data: AppData, roomId: string, date: string, start: string, end: string, exclude: string[] = []) =>
  data.bookings.filter((b) => !exclude.includes(b.id) && b.roomId === roomId && b.date === date && b.status === 'CONFIRMED' && overlap(start, end, b.startTime, b.endTime));

/** Trạng thái từng slot của một facility trong ngày (UC_2.10). */
export function facilityDay(data: AppData, room: Room, date: string, meId?: string) {
  const now = dayjs();
  return slotsOf(data.settings).map((sl) => {
    const cls = sessionAt(data, room.id, date, sl.start, sl.end);
    const maint = maintenanceAt(data, room.id, date, sl.start, sl.end);
    const bks = bookingsAt(data, room.id, date, sl.start, sl.end);
    const mine = meId ? bks.find((b) => b.memberId === meId) : undefined;
    let state: SlotState = 'FREE';
    if (!room.isActive || room.deletedAt) state = 'OFF';
    else if (maint) state = 'MAINT';
    else if (cls) state = 'CLASS';
    else if (dayjs(`${date} ${sl.end}`).isBefore(now)) state = 'PAST';
    else if (mine) state = 'MINE';
    else if (bks.length >= room.capacity) state = 'FULL';
    else if (bks.length > 0) state = 'PARTIAL';
    return { ...sl, state, used: bks.length, capacity: room.capacity, bookings: bks, mine, cls: cls?.cls, maint };
  });
}

/** Có đặt được facility trong khoảng giờ không? Trả về lý do nếu không (BR_2.1/2.2/2.3/2.19). */
export function bookingConflict(data: AppData, roomId: string, date: string, start: string, end: string, opts: { excludeIds?: string[]; extra?: number } = {}): string | null {
  const room = roomOf(data, roomId);
  if (!room || room.deletedAt) return 'Không tìm thấy facility';
  if (!room.isActive) return `${room.name} đang ngừng nhận đặt`;
  if (!onGrid(data.settings, start, end)) return `Khung giờ không khớp lưới slot ${data.settings.slotMinutes} phút (${data.settings.openTime}–${data.settings.closeTime})`;
  const m = maintenanceAt(data, roomId, date, start, end);
  if (m) return `${room.name} bảo trì ${dayjs(m.from).format('DD/MM HH:mm')} → ${dayjs(m.to).format('DD/MM HH:mm')}`;
  const s = sessionAt(data, roomId, date, start, end);
  if (s) return `Slot có buổi học "${s.cls.name}" ${s.startTime}–${s.endTime}`;
  // Capacity theo từng slot trong khoảng
  for (let t = toMin(start); t < toMin(end); t += data.settings.slotMinutes) {
    const n = bookingsAt(data, roomId, date, hhmm(t), hhmm(t + data.settings.slotMinutes), opts.excludeIds).length + (opts.extra ?? 0);
    if (n >= room.capacity) return room.capacity === 1 ? `Đã có người đặt ${hhmm(t)}–${hhmm(t + data.settings.slotMinutes)}` : `Slot ${hhmm(t)} đã đủ ${room.capacity} chỗ`;
  }
  return null;
}

/** Các ngày booking con của gói định kỳ: [start, start + 7 × weeks) */
export function packageDates(startDate: string, daysOfWeek: number[], weeks: number) {
  const out: string[] = [];
  for (let i = 0; i < 7 * weeks; i++) { const d = dayjs(startDate).add(i, 'day'); if (daysOfWeek.includes(dowOf(d.format('YYYY-MM-DD')))) out.push(d.format('YYYY-MM-DD')); }
  return out;
}
/** BR_2.18: bất kỳ slot nào đã có booking/lớp/bảo trì đều từ chối cả gói. */
export function packageConflict(data: AppData, roomId: string, dates: string[], start: string, end: string): { date: string; reason: string } | null {
  const room = roomOf(data, roomId);
  for (const date of dates) {
    const base = bookingConflict(data, roomId, date, start, end);
    if (base) return { date, reason: base };
    if (room && bookingsAt(data, roomId, date, start, end).length > 0) return { date, reason: 'Slot đã có người đặt (gói định kỳ cần slot trống hoàn toàn)' };
  }
  return null;
}

/** Member có lịch (booking / buổi học đã đăng ký) trùng khoảng giờ không? (BR_2.13) */
export function memberTimeConflict(data: AppData, memberId: string, date: string, start: string, end: string, exclude: { bookingId?: string; classId?: string } = {}): string | null {
  const b = data.bookings.find((x) => x.id !== exclude.bookingId && x.memberId === memberId && x.date === date && x.status === 'CONFIRMED' && overlap(start, end, x.startTime, x.endTime));
  if (b) return `Trùng lượt đặt ${roomOf(data, b.roomId)?.name} ${b.startTime}–${b.endTime}`;
  const classIds = data.enrollments.filter((e) => e.memberId === memberId && e.status === 'ENROLLED' && e.classId !== exclude.classId).map((e) => e.classId);
  const s = data.sessions.find((x) => classIds.includes(x.classId) && x.date === date && x.status === 'SCHEDULED' && overlap(start, end, x.startTime, x.endTime));
  if (s) return `Trùng buổi học "${data.classes.find((c) => c.id === s.classId)?.name}" ${s.startTime}–${s.endTime}`;
  return null;
}

/** Coach có buổi dạy khác trùng giờ không? (BR_2.12) */
export function coachTimeConflict(data: AppData, coachId: string, date: string, start: string, end: string, excludeClassId?: string, excludeSessionId?: string) {
  return data.sessions.find((s) => {
    if (s.id === excludeSessionId || s.classId === excludeClassId || s.date !== date || s.status !== 'SCHEDULED' || !overlap(start, end, s.startTime, s.endTime)) return false;
    const c = data.classes.find((x) => x.id === s.classId);
    return !!c && c.status !== 'CANCELLED' && c.coachId === coachId;
  });
}

export const bookingLabel = (b: Booking) => `${dayjs(b.date).format('DD/MM')} ${b.startTime}–${b.endTime}`;
export const slotCount = (s: SystemSettings, start: string, end: string) => Math.max(1, Math.round((toMin(end) - toMin(start)) / s.slotMinutes));
