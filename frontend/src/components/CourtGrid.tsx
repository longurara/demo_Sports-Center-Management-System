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

const LABEL: Record<SlotState, string> = { FREE: 'Trống', BOOKED: 'Đã đặt', MINE: 'Bạn đã đặt', CLASS: 'Lớp học', PAST: 'Đã qua' };

/**
 * Lưới sân × khung giờ trong một ngày. Click ô trống để chọn; click ô kề để kéo dài.
 * Ô đơn sắc: trống = trắng viền mảnh, đã đặt = khối xám, lớp = gạch chéo, đang chọn = mực.
 */
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

  const cols = `170px repeat(${HOURS.length}, 1fr)`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="sc-cg" style={{ minWidth: 760 }}>
        <div className="sc-cg-row head" style={{ gridTemplateColumns: cols }}>
          <div />
          {HOURS.map((h) => <div key={h} className="sc-cg-hour">{hh(h)}</div>)}
        </div>
        {courts.map((court) => {
          const slots = courtDay(data, court, date, meId);
          return (
            <div key={court.id} className="sc-cg-row" style={{ gridTemplateColumns: cols }}>
              <div className="sc-cg-court">
                <b>{court.name}</b>
                <span>{(court.hourlyRate ?? 0) / 1000}k/giờ · {court.location}</span>
              </div>
              {slots.map((s) => {
                const inSel = !!selection && selection.courtId === court.id && s.hour >= selection.start && s.hour < selection.start + selection.hours;
                const selStart = inSel && s.hour === selection!.start;
                const selEnd = inSel && s.hour === selection!.start + selection!.hours - 1;
                const tip = s.state === 'CLASS' ? `Lớp ${s.cls?.name}` : s.booking ? `${s.state === 'MINE' ? 'Bạn' : nameOf(s.booking.memberId)} · ${s.booking.startTime}–${s.booking.endTime}` : s.state === 'FREE' ? `Trống · ${hh(s.hour)}–${hh(s.hour + 1)}` : 'Đã qua giờ';
                const clickable = (s.state === 'FREE' && !!onSelect) || ((s.state === 'BOOKED' || s.state === 'MINE') && !!onBookingClick) || (s.state === 'CLASS' && !!onClassClick);
                const cls = ['sc-cg-cell', s.state.toLowerCase(), inSel ? 'sel' : '', selStart ? 'sel-start' : '', selEnd ? 'sel-end' : '', clickable ? 'clickable' : ''].join(' ');
                return (
                  <Tooltip key={s.hour} title={tip} mouseEnterDelay={0.3}>
                    <div className={cls} onClick={() => click(court, s.hour, s.state, s.booking, s.cls)}>
                      {selStart && selection!.hours > 1 ? `${hh(selection!.start)}–${hh(selection!.start + selection!.hours)}` : !inSel && s.state === 'CLASS' ? 'Lớp' : !inSel && s.state === 'MINE' ? 'Bạn' : ''}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
        <div className="sc-cg-legend">
          {(['FREE', 'BOOKED', 'MINE', 'CLASS', 'PAST'] as SlotState[]).map((k) => <span key={k}><i className={`sc-cg-cell ${k.toLowerCase()}`} />{LABEL[k]}</span>)}
          <span><i className="sc-cg-cell sel" />Đang chọn</span>
          {onSelect && maxHours > 1 && <span className="hint">Click ô kề bên để kéo dài, tối đa {maxHours} giờ</span>}
        </div>
      </div>
    </div>
  );
}
