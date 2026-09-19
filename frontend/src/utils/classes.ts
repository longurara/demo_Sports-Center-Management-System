import dayjs from 'dayjs';
import type { AppData, Course, GymClass, Schedule, Session } from '../types';
import { bookingsAt, coachTimeConflict, dowOf, maintenanceAt, memberTimeConflict, overlap, sessionAt } from './slots';

export type ClassPhase = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

/** Trạng thái hiển thị: lưu DRAFT/PENDING_APPROVAL/OPEN/CANCELLED; ONGOING/COMPLETED suy ra từ ngày (BR_2.10). */
export function classPhase(c: GymClass, today = dayjs().format('YYYY-MM-DD')): ClassPhase {
  if (c.status !== 'OPEN') return c.status;
  if (today < c.startDate) return 'OPEN';
  if (today > c.endDate) return 'COMPLETED';
  return 'ONGOING';
}

export const courseOf = (data: AppData, c?: GymClass): Course | undefined => data.courses.find((x) => x.id === c?.courseId);
export const classPrice = (data: AppData, c?: GymClass) => courseOf(data, c)?.price ?? 0;
export const classSessions = (data: AppData, classId: string) => data.sessions.filter((s) => s.classId === classId && s.status === 'SCHEDULED').sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
export const enrolledCount = (data: AppData, classId: string) => data.enrollments.filter((e) => e.classId === classId && e.status === 'ENROLLED').length;
export const seatsLeft = (data: AppData, classId: string) => { const c = data.classes.find((x) => x.id === classId); return c ? c.capacity - enrolledCount(data, classId) : 0; };
/** Danh mục nhận đăng ký: OPEN, chưa đến ngày bắt đầu, có Coach, còn session (BR_2.9) */
export const enrollable = (data: AppData, c: GymClass) => classPhase(c) === 'OPEN' && !!c.coachId && classSessions(data, c.id).length > 0;

/** Bộ môn Coach được dạy = specialization APPROVED (BR_1.12) */
export const coachSportIds = (data: AppData, coachId?: string) => data.coachSpecializations.filter((s) => s.coachId === coachId && s.status === 'APPROVED').map((s) => s.sportId);
export const activeCoachClasses = (data: AppData, coachId: string) => data.classes.filter((c) => c.coachId === coachId && c.status === 'OPEN' && classPhase(c) !== 'COMPLETED');

/** Sinh session theo lịch tuần từ ngày bắt đầu cho đủ total (UC_2.12). */
export function generateSessions(classId: string, schedules: Pick<Schedule, 'dayOfWeek' | 'startTime' | 'endTime'>[], total: number, roomId: string, fromDate: string): Omit<Session, 'id'>[] {
  const out: Omit<Session, 'id'>[] = [];
  if (!schedules.length) return out;
  for (let i = 0; out.length < total && i < 400; i++) {
    const d = dayjs(fromDate).add(i, 'day').format('YYYY-MM-DD');
    for (const sc of [...schedules].filter((s) => s.dayOfWeek === dowOf(d)).sort((a, b) => a.startTime.localeCompare(b.startTime))) {
      if (out.length >= total) break;
      out.push({ classId, date: d, startTime: sc.startTime, endTime: sc.endTime, roomId, status: 'SCHEDULED' });
    }
  }
  return out;
}
export const classDates = (sessions: Pick<Session, 'date' | 'status'>[]) => {
  const ds = sessions.filter((s) => s.status === 'SCHEDULED').map((s) => s.date).sort();
  return { startDate: ds[0] ?? '', endDate: ds[ds.length - 1] ?? '' };
};

/** Kiểm tra toàn bộ session dự kiến với facility (buổi khác / booking / bảo trì). */
export function sessionsFacilityConflict(data: AppData, sessions: Pick<Session, 'date' | 'startTime' | 'endTime' | 'roomId'>[], excludeClassId?: string) {
  for (const s of sessions) {
    const other = data.sessions.find((x) => x.classId !== excludeClassId && x.roomId === s.roomId && x.date === s.date && x.status === 'SCHEDULED' && overlap(s.startTime, s.endTime, x.startTime, x.endTime) && data.classes.find((c) => c.id === x.classId)?.status !== 'CANCELLED');
    if (other) return `${dayjs(s.date).format('DD/MM')} ${s.startTime}: trùng buổi lớp "${data.classes.find((c) => c.id === other.classId)?.name}"`;
    if (bookingsAt(data, s.roomId, s.date, s.startTime, s.endTime).length) return `${dayjs(s.date).format('DD/MM')} ${s.startTime}: facility đã có booking lẻ`;
    if (maintenanceAt(data, s.roomId, s.date, s.startTime, s.endTime)) return `${dayjs(s.date).format('DD/MM')} ${s.startTime}: facility đang bảo trì`;
  }
  return null;
}
/** Coach có trùng giờ với bất kỳ session nào của lớp không (BR_2.12). */
export function coachConflict(data: AppData, coachId: string, classId: string) {
  for (const s of classSessions(data, classId)) {
    const hit = coachTimeConflict(data, coachId, s.date, s.startTime, s.endTime, classId);
    if (hit) return { session: s, other: data.classes.find((c) => c.id === hit.classId)! };
  }
  return null;
}
/** Member có trùng giờ với bất kỳ session nào của lớp không (BR_2.13). */
export function memberConflict(data: AppData, memberId: string, classId: string) {
  for (const s of classSessions(data, classId)) {
    const why = memberTimeConflict(data, memberId, s.date, s.startTime, s.endTime, { classId });
    if (why) return `${dayjs(s.date).format('DD/MM')} ${s.startTime}: ${why}`;
  }
  return null;
}
/** Facility mới cho một buổi có trống không (đổi phòng / dời buổi). */
export function sessionSlotConflict(data: AppData, s: Pick<Session, 'id' | 'roomId' | 'date' | 'startTime' | 'endTime'>) {
  const room = data.rooms.find((r) => r.id === s.roomId);
  if (!room || room.deletedAt || !room.isActive) return 'Facility không khả dụng';
  const m = maintenanceAt(data, s.roomId, s.date, s.startTime, s.endTime);
  if (m) return `Facility bảo trì ${dayjs(m.from).format('DD/MM HH:mm')} → ${dayjs(m.to).format('DD/MM HH:mm')}`;
  const o = sessionAt(data, s.roomId, s.date, s.startTime, s.endTime, s.id);
  if (o) return `Trùng buổi lớp "${o.cls.name}" ${o.startTime}–${o.endTime}`;
  if (bookingsAt(data, s.roomId, s.date, s.startTime, s.endTime).length) return 'Facility đã có booking lẻ trong khung giờ này';
  return null;
}
export const DAY_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
