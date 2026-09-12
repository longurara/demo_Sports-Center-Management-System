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
  /** Loại ô: lớp học (mực) hay sân đã đặt (xanh sân, viền đứt). */
  kind?: 'CLASS' | 'COURT';
  /** Trạng thái ghi bằng chữ ở góc phải (Có mặt / Muộn / Vắng / Đã đặt…). */
  status?: { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' };
  tooltip?: ReactNode;
  onClick?: () => void;
}

interface Props {
  weekStart: dayjs.Dayjs; events: CalEvent[];
  hourFrom?: number; hourTo?: number;   // giới hạn ngoài của trục giờ
  hourHeight?: number; dayCount?: number;
  fit?: boolean;                        // co trục giờ theo sự kiện đang hiển thị (mặc định bật), tối thiểu `minHours` giờ
  minHours?: number;
  /** Gập những khoảng ≥ `collapseAfter` giờ liên tiếp không có buổi nào thành một dải mỏng. */
  collapseAfter?: number;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const TONE = { ok: '#0f4d34', warn: '#b45309', bad: '#c94a1e', muted: '#7a776f' };
const GAP_H = 34; // chiều cao dải giờ trống đã gập

/**
 * Lịch tuần dạng trục thời gian: 7 cột ngày × khung giờ, sự kiện đặt theo giờ thực.
 * Khoảng giờ trống dài được gập lại để lịch không toàn ô trắng; ô sự kiện đơn sắc, trạng thái bằng chữ.
 */
export default function WeekCalendar({ weekStart, events, hourFrom: boundFrom = 6, hourTo: boundTo = 22, hourHeight = 56, dayCount = 7, fit = true, minHours = 6, collapseAfter = 3 }: Props) {
  const days = Array.from({ length: dayCount }).map((_, i) => weekStart.add(i, 'day'));
  const inView = events.filter((e) => days.some((d) => d.format('YYYY-MM-DD') === e.date));

  // 1) Trục giờ bám theo sự kiện
  let hourFrom = boundFrom, hourTo = boundTo;
  if (fit && inView.length) {
    const lo = Math.min(...inView.map((e) => toMin(e.start))), hi = Math.max(...inView.map((e) => toMin(e.end)));
    hourFrom = Math.max(boundFrom, Math.floor(lo / 60) - 1);
    hourTo = Math.min(boundTo, Math.ceil(hi / 60) + 1);
    if (hourTo - hourFrom < minHours) { hourTo = Math.min(boundTo, hourFrom + minHours); hourFrom = Math.max(boundFrom, hourTo - minHours); }
  }

  // 2) Gập giờ trống: chia trục thành các đoạn {from,to,collapsed}; y(phút) tính từ tổng chiều cao các đoạn trước.
  const busy = new Set<number>();
  inView.forEach((e) => { for (let h = Math.floor(toMin(e.start) / 60); h < Math.ceil(toMin(e.end) / 60); h++) busy.add(h); });
  type Seg = { from: number; to: number; collapsed: boolean; y: number; h: number };
  const segs: Seg[] = [];
  let y = 0;
  for (let h = hourFrom; h < hourTo;) {
    let run = h;
    while (run < hourTo && !busy.has(run)) run++;
    const empty = run - h;
    if (empty >= collapseAfter && inView.length) {
      segs.push({ from: h, to: run, collapsed: true, y, h: GAP_H }); y += GAP_H; h = run;
    } else {
      const end = empty > 0 ? run : h + 1;
      const height = (end - h) * hourHeight;
      segs.push({ from: h, to: end, collapsed: false, y, h: height }); y += height; h = end;
    }
  }
  const total = y;
  const yOf = (min: number) => {
    const hr = min / 60;
    for (const sg of segs) {
      if (hr < sg.from) return sg.y;
      if (hr < sg.to) return sg.collapsed ? sg.y + GAP_H / 2 : sg.y + (hr - sg.from) * hourHeight;
    }
    return total;
  };

  const cols = `56px repeat(${dayCount}, 1fr)`;
  const today = dayjs().format('YYYY-MM-DD');
  const now = dayjs();
  const nowMin = now.hour() * 60 + now.minute();
  const nowY = nowMin >= hourFrom * 60 && nowMin <= hourTo * 60 ? yOf(nowMin) : -1;

  // 3) Xếp làn cho sự kiện chồng giờ trong cùng ngày
  const laid = days.map((d) => {
    const ds = d.format('YYYY-MM-DD');
    const evs = events.filter((e) => e.date === ds).sort((a, b) => toMin(a.start) - toMin(b.start));
    const lanes: number[] = [];
    return evs.map((e) => {
      const s = toMin(e.start), en = toMin(e.end);
      let lane = lanes.findIndex((x) => x <= s);
      if (lane === -1) { lane = lanes.length; lanes.push(en); } else lanes[lane] = en;
      return { e, lane };
    });
  });

  const wide = dayCount <= 3;
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="sc-cal" style={{ minWidth: dayCount >= 5 ? 760 : 0 }}>
        {/* Header ngày */}
        <div className="sc-cal-head" style={{ gridTemplateColumns: cols }}>
          <div />
          {days.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            const n = laid[i].length;
            return (
              <div key={i} className={`sc-cal-day ${isToday ? 'today' : ''}`}>
                <small>{DAY_NAMES[d.day() === 0 ? 7 : d.day()]}</small>
                <b>{d.format('DD')}</b>
                <em>{n ? `${n} buổi` : 'Nghỉ'}</em>
              </div>
            );
          })}
        </div>

        {/* Lưới giờ */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, position: 'relative', height: total }}>
          {/* Cột nhãn giờ */}
          <div style={{ position: 'relative' }}>
            {segs.map((sg) => sg.collapsed
              ? <div key={sg.from} className="sc-cal-gap-label" style={{ top: sg.y, height: sg.h }}>{hh(sg.from)}–{hh(sg.to)}</div>
              : Array.from({ length: sg.to - sg.from }).map((_, i) => <div key={sg.from + i} className="sc-cal-hour" style={{ top: sg.y + i * hourHeight - 7 }}>{hh(sg.from + i)}</div>))}
          </div>

          {days.map((d, di) => {
            const isToday = d.format('YYYY-MM-DD') === today;
            return (
              <div key={di} className={`sc-cal-col ${isToday ? 'today' : ''}`}>
                {segs.map((sg) => sg.collapsed
                  ? <div key={sg.from} className="sc-cal-gap" style={{ top: sg.y, height: sg.h }} />
                  : Array.from({ length: sg.to - sg.from }).map((_, i) => <div key={sg.from + i} className="sc-cal-line" style={{ top: sg.y + i * hourHeight }} />))}
                {laid[di].map(({ e, lane }) => {
                  const top = yOf(toMin(e.start));
                  const h = Math.max(34, yOf(toMin(e.end)) - top - 3);
                  const compact = h < 54;
                  const node = (
                    <div onClick={e.onClick} className={`sc-cal-ev ${e.kind === 'COURT' ? 'court' : 'class'} ${e.onClick ? 'clickable' : ''}`}
                      style={{ top: top + 1, height: h, left: `calc(${lane * 22}% + 3px)`, zIndex: 1 + lane, boxShadow: lane ? '0 4px 14px rgba(20,19,15,.12)' : undefined }}>
                      <div className="sc-cal-ev-top">
                        <span className="sc-cal-ev-time" style={{ fontSize: wide ? 13 : 12 }}>{e.start}–{e.end}</span>
                        {e.status && <span className="sc-cal-ev-status" style={{ color: TONE[e.status.tone] }}>{e.status.label}</span>}
                      </div>
                      <div className="sc-cal-ev-title" style={{ fontSize: wide ? 14.5 : 13.5, WebkitLineClamp: compact ? 1 : 2 }}>{e.title}</div>
                      {!compact && h >= 72 && e.sub && <div className="sc-cal-ev-sub" style={{ fontSize: wide ? 12.5 : 11.5 }}>{e.sub}</div>}
                    </div>
                  );
                  return <Tooltip key={e.id} title={e.tooltip ?? `${e.title} · ${e.start}–${e.end}${e.sub ? ` · ${e.sub}` : ''}`} mouseEnterDelay={0.25}>{node}</Tooltip>;
                })}
                {isToday && nowY >= 0 && <div className="sc-cal-now" style={{ top: nowY }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
