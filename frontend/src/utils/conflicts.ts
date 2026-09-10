import type { AppData, Schedule } from '../types';

const overlap = (a: Schedule, b: Schedule) =>
  a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && b.startTime < a.endTime;

/** Lịch mới có trùng phòng với lớp khác đang mở không? */
export function roomConflict(data: AppData, sc: Schedule, roomId: string) {
  return data.schedules.find((s) => {
    if (s.id === sc.id || s.classId === sc.classId) return false;
    const c = data.classes.find((x) => x.id === s.classId);
    return c?.status === 'OPEN' && c.roomId === roomId && overlap(s, sc);
  });
}

/** Coach có bị trùng giờ dạy với lớp khác không? */
export function coachConflict(data: AppData, coachId: string, classId: string) {
  const mine = data.schedules.filter((s) => s.classId === classId);
  for (const s of data.schedules) {
    if (s.classId === classId) continue;
    const c = data.classes.find((x) => x.id === s.classId);
    if (c?.status !== 'OPEN' || c.coachId !== coachId) continue;
    const hit = mine.find((m) => overlap(m, s));
    if (hit) return { cls: c, sc: s };
  }
  return null;
}

/** Member có bị trùng lịch với lớp đã đăng ký không? */
export function memberConflict(data: AppData, memberId: string, classId: string) {
  const mine = data.schedules.filter((s) => s.classId === classId);
  const enrolled = data.enrollments.filter((e) => e.memberId === memberId && e.status === 'ACTIVE' && e.classId !== classId).map((e) => e.classId);
  for (const s of data.schedules) {
    if (!enrolled.includes(s.classId)) continue;
    const hit = mine.find((m) => overlap(m, s));
    if (hit) return data.classes.find((x) => x.id === s.classId);
  }
  return null;
}

export const seatsLeft = (data: AppData, classId: string) => {
  const c = data.classes.find((x) => x.id === classId);
  if (!c) return 0;
  return c.capacity - data.enrollments.filter((e) => e.classId === classId && e.status === 'ACTIVE').length;
};
