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

interface Props {
  weekStart: dayjs.Dayjs; events: CalEvent[];
  hourFrom?: number; hourTo?: number;   // giới hạn ngoài của trục giờ
  hourHeight?: number; dayCount?: number;
  fit?: boolean;                        // co trục giờ theo sự kiện đang hiển thị (mặc định bật), tối thiểu `minHours` giờ
  minHours?: number;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Lịch tuần dạng trục thời gian (giống Google Calendar): 7 cột ngày × khung giờ, sự kiện đặt theo giờ thực. */
export default function WeekCalendar({ weekStart, events, hourFrom: boundFrom = 6, hourTo: boundTo = 22, hourHeight = 52, dayCount = 7, fit = true, minHours = 8 }: Props) {
  const days = Array.from({ length: dayCount }).map((_, i) => weekStart.add(i, 'day'));
  const inView = events.filter((e) => days.some((d) => d.format('YYYY-MM-DD') === e.date));
  // Trục giờ bám theo sự kiện: bắt đầu trước sự kiện sớm nhất 1 giờ, kết thúc sau sự kiện muộn nhất 1 giờ.
  let hourFrom = boundFrom, hourTo = boundTo;
  if (fit && inView.length) {
    const lo = Math.min(...inView.map((e) => toMin(e.start))), hi = Math.max(...inView.map((e) => toMin(e.end)));
    hourFrom = Math.max(boundFrom, Math.floor(lo / 60) - 1);
    hourTo = Math.min(boundTo, Math.ceil(hi / 60) + 1);
    if (hourTo - hourFrom < minHours) { hourTo = Math.min(boundTo, hourFrom + minHours); hourFrom = Math.max(boundFrom, hourTo - minHours); }
  }
  const cols = `56px repeat(${dayCount}, 1fr)`;
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
      return { e, lane };
    });
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: dayCount >= 5 ? 760 : 0 }}>
        {/* Header ngày */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid #ece8df' }}>
          <div />
          {days.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            const n = laid[i].length;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '8px 4px 10px', borderLeft: '1px solid #f3f1ec' }}>
                <div style={{ fontSize: 12, color: isToday ? '#0f4d34' : '#9a968c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, fontFamily: "'Barlow Condensed', sans-serif" }}>{DAY_NAMES[d.day() === 0 ? 7 : d.day()]}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999, marginTop: 2, fontWeight: 700, fontSize: 15, background: isToday ? '#0f4d34' : 'transparent', color: isToday ? '#fff' : '#14130f' }}>{d.format('DD')}</div>
                <div style={{ fontSize: 10.5, color: n ? '#7a776f' : '#c5c1b6', marginTop: 2 }}>{n ? `${n} buổi` : 'Nghỉ'}</div>
              </div>
            );
          })}
        </div>
        {/* Lưới giờ */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, position: 'relative', height: total }}>
          <div style={{ position: 'relative' }}>
            {Array.from({ length: hourTo - hourFrom }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: i * hourHeight - 7, right: 10, fontSize: 11, color: '#9a968c', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{String(hourFrom + i).padStart(2, '0')}:00</div>
            ))}
          </div>
          {days.map((d, di) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            return (
              <div key={di} style={{ position: 'relative', borderLeft: '1px solid #f3f1ec', background: isToday ? 'rgba(15,77,52,.025)' : undefined }}>
                {Array.from({ length: hourTo - hourFrom }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', top: i * hourHeight, left: 0, right: 0, borderTop: '1px solid #ece8df' }} />
                ))}
                {laid[di].map(({ e, lane }) => {
                  const top = (toMin(e.start) - hourFrom * 60) / 60 * hourHeight;
                  const h = Math.max(30, (toMin(e.end) - toMin(e.start)) / 60 * hourHeight - 3);
                  const shift = lane * 22; // sự kiện chồng giờ xếp lệch sang phải, đè lên nhau (kiểu Google Calendar)
                  const compact = h < 50;
                  const wide = dayCount <= 3;
                  const node = (
                    <div onClick={e.onClick} style={{
                      position: 'absolute', top: top + 1, height: h, left: `calc(${shift}% + 3px)`, right: 3, zIndex: 1 + lane,
                      background: e.dashed ? '#fff' : `color-mix(in srgb, ${e.color} 10%, #fff)`, border: `1px ${e.dashed ? 'dashed' : 'solid'} ${e.dashed ? e.color : `color-mix(in srgb, ${e.color} 28%, #fff)`}`, borderLeft: `3px solid ${e.color}`,
                      boxShadow: lane ? '0 4px 14px rgba(20,19,15,.12)' : undefined,
                      borderRadius: 6, padding: compact ? '3px 7px' : '5px 8px', overflow: 'hidden', cursor: e.onClick ? 'pointer' : 'default', transition: 'transform .12s, box-shadow .12s', boxSizing: 'border-box',
                    }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'scale(1.02)'; ev.currentTarget.style.boxShadow = '0 10px 24px rgba(20,19,15,.16)'; ev.currentTarget.style.zIndex = '9'; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = lane ? '0 4px 14px rgba(20,19,15,.12)' : 'none'; ev.currentTarget.style.zIndex = String(1 + lane); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, lineHeight: 1.2 }}>
                        <span style={{ fontSize: wide ? 12 : 11, fontWeight: 700, color: e.color, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{e.start}–{e.end}</span>
                        {e.badge}
                      </div>
                      <div style={{ fontSize: wide ? 14 : 13, fontWeight: 600, color: '#14130f', lineHeight: 1.2, marginTop: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: compact ? 1 : 2, WebkitBoxOrient: 'vertical' }}>{e.icon && <span style={{ marginRight: 4 }}>{e.icon}</span>}{e.title}</div>
                      {!compact && h >= 68 && e.sub && <div style={{ fontSize: wide ? 12.5 : 11, color: '#7a776f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{e.sub}</div>}
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
