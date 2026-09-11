import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import { DAY_NAMES } from '../store/AppContext';

export interface CalEvent {
  id: string;
  date: string;      // YYYY-MM-DD
  start: string;     // HH:mm
  end: string;
  title: string;
  sub?: string;
  color: string;     // màu chủ đạo (border/tiêu đề)
  icon?: ReactNode;
  badge?: ReactNode; // góc phải: điểm danh / trạng thái
  dashed?: boolean;  // sự kiện phụ (đặt sân, chưa xác nhận)
  tooltip?: ReactNode;
  onClick?: () => void;
}

interface Props { weekStart: dayjs.Dayjs; events: CalEvent[]; hourFrom?: number; hourTo?: number; hourHeight?: number }

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Lịch tuần dạng trục thời gian (giống Google Calendar): 7 cột ngày × khung giờ, sự kiện đặt theo giờ thực. */
export default function WeekCalendar({ weekStart, events, hourFrom = 6, hourTo = 22, hourHeight = 46 }: Props) {
  const days = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');
  const total = (hourTo - hourFrom) * hourHeight;
  const now = dayjs();
  const nowY = ((now.hour() * 60 + now.minute()) - hourFrom * 60) / 60 * hourHeight;

  // Xếp làn cho các sự kiện chồng giờ trong cùng ngày
  const laid = days.map((d) => {
    const ds = d.format('YYYY-MM-DD');
    const evs = events.filter((e) => e.date === ds).sort((a, b) => toMin(a.start) - toMin(b.start));
    const lanes: number[] = []; // end minute của mỗi làn
    return evs.map((e) => {
      const s = toMin(e.start), en = toMin(e.end);
      let lane = lanes.findIndex((x) => x <= s);
      if (lane === -1) { lane = lanes.length; lanes.push(en); } else lanes[lane] = en;
      const overlapping = evs.filter((o) => toMin(o.start) < en && s < toMin(o.end)).length;
      return { e, lane, cols: Math.max(1, overlapping) };
    });
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 760 }}>
        {/* Header ngày */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid #eef1f6' }}>
          <div />
          {days.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            const n = laid[i].length;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '8px 4px 10px', borderLeft: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: isToday ? '#2563eb' : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 }}>{DAY_NAMES[i + 1]}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999, marginTop: 2, fontWeight: 700, fontSize: 15, background: isToday ? '#2563eb' : 'transparent', color: isToday ? '#fff' : '#0f172a' }}>{d.format('DD')}</div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{n ? `${n} hoạt động` : '—'}</div>
              </div>
            );
          })}
        </div>
        {/* Lưới giờ */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', position: 'relative', height: total }}>
          <div style={{ position: 'relative' }}>
            {Array.from({ length: hourTo - hourFrom }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: i * hourHeight - 7, right: 8, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{String(hourFrom + i).padStart(2, '0')}:00</div>
            ))}
          </div>
          {days.map((d, di) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            return (
              <div key={di} style={{ position: 'relative', borderLeft: '1px solid #f1f5f9', background: isToday ? 'rgba(37,99,235,.025)' : undefined }}>
                {Array.from({ length: hourTo - hourFrom }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', top: i * hourHeight, left: 0, right: 0, borderTop: `1px ${i % 2 ? 'dashed' : 'solid'} ${i % 2 ? '#f4f6fb' : '#eef1f6'}` }} />
                ))}
                {laid[di].map(({ e, lane, cols }) => {
                  const top = (toMin(e.start) - hourFrom * 60) / 60 * hourHeight;
                  const h = Math.max(26, (toMin(e.end) - toMin(e.start)) / 60 * hourHeight - 3);
                  const w = 100 / cols;
                  const compact = h < 46;
                  const node = (
                    <div onClick={e.onClick} style={{
                      position: 'absolute', top: top + 1, height: h, left: `calc(${lane * w}% + 3px)`, width: `calc(${w}% - 6px)`,
                      background: e.dashed ? '#fff' : `${e.color}14`, border: `1px ${e.dashed ? 'dashed' : 'solid'} ${e.color}${e.dashed ? '' : '33'}`, borderLeft: `3px solid ${e.color}`,
                      borderRadius: 8, padding: compact ? '2px 6px' : '5px 8px', overflow: 'hidden', cursor: e.onClick ? 'pointer' : 'default', transition: 'transform .12s, box-shadow .12s', boxSizing: 'border-box',
                    }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'scale(1.02)'; ev.currentTarget.style.boxShadow = '0 8px 20px rgba(15,23,42,.12)'; ev.currentTarget.style.zIndex = '3'; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = 'none'; ev.currentTarget.style.zIndex = '1'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: e.color, whiteSpace: 'nowrap' }}>{e.start}–{e.end}</span>
                        {e.badge}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.icon && <span style={{ marginRight: 4 }}>{e.icon}</span>}{e.title}</div>
                      {!compact && e.sub && <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sub}</div>}
                    </div>
                  );
                  return <Tooltip key={e.id} title={e.tooltip ?? `${e.title} · ${e.start}–${e.end}${e.sub ? ` · ${e.sub}` : ''}`} mouseEnterDelay={0.25}>{node}</Tooltip>;
                })}
                {isToday && nowY >= 0 && nowY <= total && (
                  <div style={{ position: 'absolute', top: nowY, left: 0, right: 0, height: 2, background: '#dc2626', zIndex: 2 }}>
                    <span style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: 999, background: '#dc2626' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
