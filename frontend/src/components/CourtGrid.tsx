import { Tooltip } from 'antd';
import type { Booking, GymClass, Room } from '../types';
import { useApp } from '../store/AppContext';
import { facilityDay, slotsOf, type SlotState } from '../utils/slots';

/** Vùng chọn: facility + slot bắt đầu (index trên lưới) + số slot liên tiếp */
export interface Selection { roomId: string; start: number; slots: number }

interface Props {
  rooms: Room[];
  date: string;
  meId?: string;
  selection?: Selection | null;
  maxSlots?: number;
  onSelect?: (sel: Selection | null) => void;
  onBookingClick?: (b: Booking[]) => void;
  onClassClick?: (c: GymClass) => void;
}

const LABEL: Record<SlotState, string> = { FREE: 'Trống', PARTIAL: 'Còn chỗ', FULL: 'Đầy', MINE: 'Bạn đã đặt', CLASS: 'Lớp học', MAINT: 'Bảo trì', PAST: 'Đã qua', OFF: 'Ngừng nhận' };

/**
 * Lưới facility × slot trong một ngày (UC_2.10). Slot nhiều chỗ (gym) hiển thị x/N; sân capacity 1 là ô đơn.
 * Click ô trống để chọn; click ô kề để kéo dài. Lớp học / bảo trì khóa hoàn toàn slot.
 */
export default function CourtGrid({ rooms, date, meId, selection, maxSlots = 3, onSelect, onBookingClick, onClassClick }: Props) {
  const { data, nameOf } = useApp();
  const slots = slotsOf(data.settings);

  const click = (room: Room, idx: number, state: SlotState, b: Booking[], c?: GymClass) => {
    if (state === 'FULL' || state === 'MINE') { if (b.length && onBookingClick) onBookingClick(b); return; }
    if (state === 'CLASS') { if (c && onClassClick) onClassClick(c); return; }
    if (state === 'PARTIAL' && b.length && onBookingClick && !onSelect) return onBookingClick(b);
    if ((state !== 'FREE' && state !== 'PARTIAL') || !onSelect) return;
    if (selection && selection.roomId === room.id) {
      const end = selection.start + selection.slots;
      if (idx === selection.start && selection.slots === 1) return onSelect(null);
      if (idx === end && selection.slots < maxSlots) return onSelect({ ...selection, slots: selection.slots + 1 });
      if (idx === end - 1 && selection.slots > 1) return onSelect({ ...selection, slots: selection.slots - 1 });
      if (idx === selection.start - 1 && selection.slots < maxSlots) return onSelect({ roomId: room.id, start: idx, slots: selection.slots + 1 });
    }
    onSelect({ roomId: room.id, start: idx, slots: 1 });
  };

  const cols = `170px repeat(${slots.length}, 1fr)`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="sc-cg" style={{ minWidth: 760 }}>
        <div className="sc-cg-row head" style={{ gridTemplateColumns: cols }}>
          <div />
          {slots.map((s) => <div key={s.start} className="sc-cg-hour">{s.start}</div>)}
        </div>
        {rooms.map((room) => {
          const day = facilityDay(data, room, date, meId);
          return (
            <div key={room.id} className="sc-cg-row" style={{ gridTemplateColumns: cols }}>
              <div className="sc-cg-court">
                <b>{room.name}</b>
                <span>{room.pricePerSlot / 1000}k/slot · {room.capacity > 1 ? `${room.capacity} chỗ/slot` : room.location}</span>
              </div>
              {day.map((s, idx) => {
                const inSel = !!selection && selection.roomId === room.id && idx >= selection.start && idx < selection.start + selection.slots;
                const selStart = inSel && idx === selection!.start;
                const selEnd = inSel && idx === selection!.start + selection!.slots - 1;
                const tip = s.state === 'CLASS' ? `Lớp ${s.cls?.name} ${s.cls ? '' : ''}` : s.state === 'MAINT' ? `Bảo trì: ${s.maint?.reason}` : s.state === 'OFF' ? 'Facility ngừng nhận đặt'
                  : s.bookings.length ? `${s.used}/${s.capacity} · ${s.bookings.map((b) => (b.memberId === meId ? 'Bạn' : b.memberId ? nameOf(b.memberId) : `Khách ${b.guestName}`)).slice(0, 4).join(', ')}${s.bookings.length > 4 ? '…' : ''}`
                  : s.state === 'FREE' ? `Trống · ${s.start}–${s.end}` : 'Đã qua giờ';
                const clickable = ((s.state === 'FREE' || s.state === 'PARTIAL') && !!onSelect) || ((s.state === 'FULL' || s.state === 'MINE' || s.state === 'PARTIAL') && !!onBookingClick) || (s.state === 'CLASS' && !!onClassClick);
                const cls = ['sc-cg-cell', s.state.toLowerCase(), inSel ? 'sel' : '', selStart ? 'sel-start' : '', selEnd ? 'sel-end' : '', clickable ? 'clickable' : ''].join(' ');
                const text = selStart && selection!.slots > 1 ? `${slots[selection!.start].start}–${slots[selection!.start + selection!.slots - 1].end}` : inSel ? '' : s.state === 'CLASS' ? 'Lớp' : s.state === 'MAINT' ? 'Bảo trì' : s.state === 'MINE' ? (room.capacity > 1 ? `Bạn ${s.used}/${s.capacity}` : 'Bạn') : (s.state === 'PARTIAL' || s.state === 'FULL') && room.capacity > 1 ? `${s.used}/${s.capacity}` : '';
                return (
                  <Tooltip key={s.start} title={tip} mouseEnterDelay={0.3}>
                    <div className={cls} onClick={() => click(room, idx, s.state, s.bookings, s.cls)}>{text}</div>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
        <div className="sc-cg-legend">
          {(['FREE', 'PARTIAL', 'FULL', 'MINE', 'CLASS', 'MAINT', 'PAST'] as SlotState[]).map((k) => <span key={k}><i className={`sc-cg-cell ${k.toLowerCase()}`} />{LABEL[k]}</span>)}
          <span><i className="sc-cg-cell sel" />Đang chọn</span>
          {onSelect && maxSlots > 1 && <span className="hint">Click ô kề bên để kéo dài, tối đa {maxSlots} slot · slot {data.settings.slotMinutes} phút</span>}
        </div>
      </div>
    </div>
  );
}
