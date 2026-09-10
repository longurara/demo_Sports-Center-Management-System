import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import { DAY_NAMES, useApp } from '../store/AppContext';
import type { Schedule } from '../types';

const PALETTE = [
  { bg: '#eff6ff', border: '#2563eb' }, { bg: '#f0fdf4', border: '#16a34a' }, { bg: '#faf5ff', border: '#9333ea' },
  { bg: '#fff7ed', border: '#f97316' }, { bg: '#ecfeff', border: '#0891b2' }, { bg: '#fdf2f8', border: '#db2777' },
  { bg: '#fefce8', border: '#ca8a04' }, { bg: '#f1f5f9', border: '#475569' },
];

export default function WeekTimetable({ schedules, onClick }: { schedules: Schedule[]; onClick?: (classId: string) => void }) {
  const { data, nameOf } = useApp();
  const colorOf = (classId: string) => PALETTE[Math.max(0, data.classes.findIndex((c) => c.id === classId)) % PALETTE.length];
  const today = ((dayjs().day() + 6) % 7) + 1;
  const monday = dayjs().subtract(today - 1, 'day');

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 10, minWidth: 1080 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const items = schedules.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={d} className={`sc-tt-day${d === today ? ' today' : ''}`}>
              <div className="sc-tt-day-head">{DAY_NAMES[d]}<div style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>{monday.add(d - 1, 'day').format('DD/MM')}</div></div>
              {items.length === 0 && <div style={{ color: '#cbd5e1', textAlign: 'center', fontSize: 12, paddingTop: 20 }}>Trống</div>}
              {items.map((s) => {
                const c = data.classes.find((x) => x.id === s.classId);
                if (!c) return null;
                const room = data.rooms.find((r) => r.id === c.roomId)?.name;
                const col = colorOf(c.id);
                return (
                  <Tooltip key={s.id} title={`${c.name} · ${room} · HLV ${nameOf(c.coachId)}`}>
                    <div className="sc-tt-chip" style={{ background: col.bg, borderLeftColor: col.border, cursor: onClick ? 'pointer' : 'default' }} onClick={() => onClick?.(c.id)}>
                      <b style={{ color: col.border }}>{s.startTime} – {s.endTime}</b>
                      <div className="name">{c.name}</div>
                      <div className="meta">{room}</div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
