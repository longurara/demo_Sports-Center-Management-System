import { Tooltip } from 'antd';
import type { CourtBooking, GymClass, Room } from '../types';
import { useApp } from '../store/AppContext';
import { HOURS, courtDay, hh, type SlotState } from '../utils/sports';

export interface Selection { courtId: string; start: number; hours: number }

interface Props {
  courts: Room[];
  date: string;
  meId?: string;
  selection?: Selection | null;
  maxHours?: number;
  onSelect?: (sel: Selection | null) => void;
  onBookingClick?: (b: CourtBooking) => void;
  onClassClick?: (c: GymClass) => void;
}

const STYLE: Record<SlotState, { bg: string; color: string; label: string }> = {
  FREE: { bg: '#e4f8eb', color: '#15803d', label: 'Trống' },
  BOOKED: { bg: '#fee2e2', color: '#b91c1c', label: 'Đã đặt' },
  MINE: { bg: '#dbeafe', color: '#1d4ed8', label: 'Bạn đã đặt' },
  CLASS: { bg: '#f1f5f9', color: '#64748b', label: 'Lớp học' },
  PAST: { bg: 'repeating-linear-gradient(135deg,#f8fafc 0 5px,#eef2f7 5px 10px)', color: '#cbd5e1', label: 'Đã qua' },
};

/** Lưới sân × khung giờ trong một ngày. Click ô trống để chọn; click ô kề để kéo dài. */
export default function CourtGrid({ courts, date, meId, selection, maxHours = 3, onSelect, onBookingClick, onClassClick }: Props) {
  const { data, nameOf } = useApp();

  const click = (court: Room, hour: number, state: SlotState, b?: CourtBooking, c?: GymClass) => {
    if (state === 'BOOKED' || state === 'MINE') { if (b && onBookingClick) onBookingClick(b); return; }
    if (state === 'CLASS') { if (c && onClassClick) onClassClick(c); return; }
    if (state !== 'FREE' || !onSelect) return;
    if (selection && selection.courtId === court.id) {
      const end = selection.start + selection.hours;
      if (hour === selection.start && selection.hours === 1) return onSelect(null);
      if (hour === end && selection.hours < maxHours) return onSelect({ ...selection, hours: selection.hours + 1 });
      if (hour === end - 1 && selection.hours > 1) return onSelect({ ...selection, hours: selection.hours - 1 });
      if (hour === selection.start - 1 && selection.hours < maxHours) return onSelect({ courtId: court.id, start: hour, hours: selection.hours + 1 });
    }
    onSelect({ courtId: court.id, start: hour, hours: 1 });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 760 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${HOURS.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
          <div />
          {HOURS.map((h) => <div key={h} style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>{hh(h)}</div>)}
        </div>
        {courts.map((court) => {
          const slots = courtDay(data, court, date, meId);
          const sport = data.sports.find((s) => s.id === court.sportId);
          return (
            <div key={court.id} style={{ display: 'grid', gridTemplateColumns: `150px repeat(${HOURS.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: `${sport?.color ?? '#64748b'}18`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{sport?.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{court.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{(court.hourlyRate ?? 0) / 1000}k/giờ · {court.location}</div>
                </div>
              </div>
              {slots.map((s) => {
                const selected = !!selection && selection.courtId === court.id && s.hour >= selection.start && s.hour < selection.start + selection.hours;
                const st = STYLE[s.state];
                const tip = s.state === 'CLASS' ? `Lớp ${s.cls?.name}` : s.booking ? `${s.state === 'MINE' ? 'Bạn' : nameOf(s.booking.memberId)} · ${s.booking.startTime}–${s.booking.endTime}` : s.state === 'FREE' ? `Trống · ${hh(s.hour)}–${hh(s.hour + 1)}` : 'Đã qua giờ';
                const clickable = (s.state === 'FREE' && !!onSelect) || ((s.state === 'BOOKED' || s.state === 'MINE') && !!onBookingClick) || (s.state === 'CLASS' && !!onClassClick);
                return (
                  <Tooltip key={s.hour} title={tip} mouseEnterDelay={0.3}>
                    <div onClick={() => click(court, s.hour, s.state, s.booking, s.cls)}
                      style={{
                        height: 34, borderRadius: 6, cursor: clickable ? 'pointer' : 'default',
                        background: selected ? '#2563eb' : st.bg, color: selected ? '#fff' : st.color,
                        border: selected ? '1px solid #1d4ed8' : s.state === 'FREE' ? '1px dashed #86efac' : '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600, transition: 'transform .1s',
                      }}
                      onMouseEnter={(e) => { if (s.state === 'FREE' && !selected) e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
                      {selected ? '✓' : s.state === 'CLASS' ? 'Lớp' : s.state === 'BOOKED' ? '●' : s.state === 'MINE' ? '★' : ''}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
          {(['FREE', 'BOOKED', 'MINE', 'CLASS', 'PAST'] as SlotState[]).map((k) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: STYLE[k].bg, border: k === 'FREE' ? '1px dashed #86efac' : '1px solid #e2e8f0' }} />{STYLE[k].label}</span>)}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#2563eb' }} />Đang chọn</span>
        </div>
      </div>
    </div>
  );
}
