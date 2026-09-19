import { useState } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';
import type { Session } from '../types';
import WeekCalendar, { type CalEvent } from './WeekCalendar';

/**
 * Thời khóa biểu tuần theo trục giờ, lấy từ class_sessions thật (buổi đã sinh, có dời/hủy).
 * Có điều hướng tuần; ô lớp ghi facility + sĩ số.
 */
export default function WeekTimetable({ sessions, onClick, showCoach }: { sessions: Session[]; onClick?: (classId: string) => void; showCoach?: boolean }) {
  const { data, nameOf } = useApp();
  const [offset, setOffset] = useState(0);
  const monday = dayjs().subtract((dayjs().day() + 6) % 7, 'day').startOf('day').add(offset, 'week');
  const sunday = monday.add(6, 'day');
  const from = monday.format('YYYY-MM-DD'), to = sunday.format('YYYY-MM-DD');

  const events: CalEvent[] = sessions.filter((s) => s.date >= from && s.date <= to && s.status === 'SCHEDULED').flatMap((s) => {
    const c = data.classes.find((x) => x.id === s.classId);
    if (!c) return [];
    const room = data.rooms.find((r) => r.id === s.roomId)?.name ?? '';
    const n = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED').length;
    return [{
      id: s.id, date: s.date, start: s.startTime, end: s.endTime,
      title: c.name, kind: 'CLASS' as const,
      sub: showCoach ? `${room} · HLV ${nameOf(c.coachId).split(' ').slice(-1)[0]}` : room,
      status: { label: `${n}/${c.capacity} HV`, tone: n >= c.capacity ? 'warn' : 'muted' },
      tooltip: `${c.name} · ${room} · HLV ${nameOf(c.coachId)} · ${n}/${c.capacity} học viên${s.note ? ` · ${s.note}` : ''}`,
      onClick: onClick ? () => onClick(c.id) : undefined,
    }];
  });
  const hours = events.reduce((t, e) => t + (dayjs(`2000-01-01 ${e.end}`).diff(dayjs(`2000-01-01 ${e.start}`), 'minute')) / 60, 0);

  return (
    <div>
      <div className="sc-tt-bar">
        <div className="sc-tt-nav">
          <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Tuần trước">←</button>
          <button type="button" className="today" onClick={() => setOffset(0)} disabled={offset === 0}>Tuần này</button>
          <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Tuần sau">→</button>
        </div>
        <h3>{monday.format('DD/MM')} – {sunday.format('DD/MM/YYYY')}</h3>
        <span>{events.length} buổi · {Number.isInteger(hours) ? hours : hours.toFixed(1)} giờ</span>
      </div>
      {events.length === 0
        ? <div className="sc-tt-empty">Không có buổi nào trong tuần này.</div>
        : <WeekCalendar weekStart={monday} events={events} hourHeight={56} />}
    </div>
  );
}
