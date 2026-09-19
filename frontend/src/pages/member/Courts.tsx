import { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, DatePicker, InputNumber, Popconfirm, Row, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import CourtGrid, { type Selection } from '../../components/CourtGrid';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { DAY_SHORT } from '../../utils/classes';
import { quoteCart, type SubBooking } from '../../utils/pricing';
import { bookableRooms, benefitsOf, packageDates, slotsOf } from '../../utils/slots';

/** Đặt sân/phòng online (UC_2.6, UC_2.8, UC_2.9, UC_2.10): lưới slot + gói định kỳ → thêm vào đơn đang soạn; hủy theo deadline. */
export default function Courts() {
  const { data, currentUser, cart, addToCart, cancelBooking, cancelPackage } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const s = data.settings;
  const slots = slotsOf(s);
  const rooms = bookableRooms(data);
  const sports = data.sports.filter((sp) => !sp.deletedAt && rooms.some((r) => r.sportIds.includes(sp.id)));
  const [sport, setSport] = useState<string>(sports[0]?.id ?? '');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sel, setSel] = useState<Selection | null>(null);
  const plan = benefitsOf(data, me.id);
  const buyer = { kind: 'MEMBER' as const, memberId: me.id };

  const list = rooms.filter((r) => r.sportIds.includes(sport));
  const room = list.find((c) => c.id === sel?.roomId);
  const start = sel ? slots[sel.start].start : '', end = sel ? slots[sel.start + sel.slots - 1].end : '';
  const line = room && sel ? { key: 'preview', type: 'FACILITY_BOOKING' as const, roomId: room.id, date, startTime: start, endTime: end, name: `Đặt ${room.name}`, detail: `${dayjs(date).format('DD/MM/YYYY')} · ${start}–${end} · ${sel.slots} slot` } : null;
  const preview = line ? quoteCart(data, buyer, [...cart.lines, line]).lines[cart.lines.length] : null;

  // Gói định kỳ
  const [pk, setPk] = useState({ roomId: '', startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), daysOfWeek: [2, 5] as number[], slotIdx: 12, weeks: 4 });
  const pkRoom = rooms.find((r) => r.id === pk.roomId);
  const pkLine = pkRoom ? { key: 'pk', type: 'FACILITY_PACKAGE' as const, roomId: pkRoom.id, startDate: pk.startDate, daysOfWeek: pk.daysOfWeek, startTime: slots[pk.slotIdx]?.start, endTime: slots[pk.slotIdx]?.end, weeks: pk.weeks, name: `Gói định kỳ ${pkRoom.name}`, detail: `${pk.daysOfWeek.map((d) => DAY_SHORT[d]).join('/')} ${slots[pk.slotIdx]?.start}–${slots[pk.slotIdx]?.end} · ${pk.weeks} tuần từ ${dayjs(pk.startDate).format('DD/MM')}` } : null;
  const pkQuote = pkLine ? quoteCart(data, buyer, [...cart.lines, pkLine]).lines[cart.lines.length] : null;
  const pkDates = pkLine ? packageDates(pk.startDate, pk.daysOfWeek, pk.weeks) : [];

  const mine = useMemo(() => data.bookings.filter((b) => b.memberId === me.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)), [data.bookings, me.id]);
  const myPackages = data.packages.filter((p) => p.memberId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const upcoming = mine.filter((b) => b.status === 'CONFIRMED' && `${b.date} ${b.startTime}` >= dayjs().format('YYYY-MM-DD HH:mm'));
  const canCancel = (d: string, t: string) => dayjs(`${d} ${t}`).diff(dayjs(), 'hour', true) >= s.bookingCancelDeadlineHours;
  const days = Array.from({ length: Math.min(7, s.maxAdvanceBookingDays + 1) }).map((_, i) => dayjs().add(i, 'day'));

  return (
    <Page title="Đặt sân / phòng" subtitle={`Chọn facility, ngày và slot ${s.slotMinutes} phút. Đặt trước tối đa ${s.maxAdvanceBookingDays} ngày; hủy trước ${s.bookingCancelDeadlineHours} giờ hoàn 100% về ví.`} noCard
      extra={upcoming.length > 0 && <Link to="#my-bookings" className="sc-court-upcoming">{upcoming.length} lượt sắp tới ↓</Link>}>
      <Tabs items={[
        { key: 'single', label: 'Đặt theo slot', children: (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div className="sc-court-bar">
              <div className="sc-filter sc-court-sports">
                {sports.map((sp) => <button key={sp.id} type="button" className={`sc-filter-btn ${sport === sp.id ? 'on' : ''}`} onClick={() => { setSport(sp.id); setSel(null); }}>{sp.name}</button>)}
              </div>
              <div className="sc-court-days">
                {days.map((d) => { const k = d.format('YYYY-MM-DD'); return (
                  <button key={k} type="button" className={`sc-court-day ${k === date ? 'on' : ''}`} onClick={() => { setDate(k); setSel(null); }}><small>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.day()]}</small><b>{d.format('DD')}</b></button>
                ); })}
                <DatePicker value={dayjs(date)} onChange={(v) => { if (v) { setDate(v.format('YYYY-MM-DD')); setSel(null); } }} minDate={dayjs()} maxDate={dayjs().add(s.maxAdvanceBookingDays, 'day')} allowClear={false} format="DD/MM/YYYY" style={{ width: 132 }} />
              </div>
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={17}>
                <div className="sc-court-grid-card">
                  <div className="sc-court-grid-head">
                    <h3>{data.sports.find((x) => x.id === sport)?.name} · {dayjs(date).format('dddd, DD/MM')}</h3>
                    <span>{list.length} facility · slot có lớp / bảo trì bị khóa</span>
                  </div>
                  {list.length === 0 ? <div className="sc-court-empty">Bộ môn này chưa có facility.</div> : <CourtGrid rooms={list} date={date} meId={me.id} selection={sel} onSelect={setSel} onBookingClick={(b) => b.some((x) => x.memberId === me.id) && message.info('Bạn đã đặt slot này')} />}
                </div>
              </Col>
              <Col xs={24} xl={7}>
                <div className="sc-court-side">
                  {!sel || !room || !preview ? (
                    <div className="sc-court-side-empty">
                      <small>Slot đã chọn</small>
                      <h3>Chưa chọn</h3>
                      <p>Bấm ô trống trên lưới; bấm ô kề để kéo dài, tối đa 3 slot.</p>
                      <p className="muted">{plan ? `Gói ${plan.name}: ${plan.gymAccess ? 'gym miễn phí · ' : ''}−${plan.bookingDiscountPct}% · ${plan.freeBookingSlotsPerMonth} slot free/tháng` : 'Chưa có gói: giá gốc. Gói giảm 10–40%.'}</p>
                    </div>
                  ) : (
                    <div>
                      <small>Slot đã chọn</small>
                      <h3>{room.name}</h3>
                      <div className="sc-court-side-sub">{room.location} · {room.capacity > 1 ? `${room.capacity} chỗ/slot` : '1 booking/slot'}</div>
                      <div className="sc-court-when">
                        <div><span>Ngày</span><b>{dayjs(date).format('dddd, DD/MM')}</b></div>
                        <div><span>Giờ</span><b>{start}–{end}</b><em>{sel.slots} slot</em></div>
                      </div>
                      <div className="sc-court-quote">
                        <div><span>Giá niêm yết</span><span>{fmtMoney(preview.unitPrice)}</span></div>
                        {preview.membershipDiscount > 0 && <div className="disc"><span>{preview.benefitKind === 'GYM_ACCESS' ? 'Gym miễn phí theo gói' : preview.benefitKind === 'FREE_SLOT' ? 'Slot miễn phí theo gói' : `Ưu đãi gói −${plan?.bookingDiscountPct}%`}</span><span>−{fmtMoney(preview.membershipDiscount)}</span></div>}
                        <div className="total"><span>Tạm tính</span><span className="sc-nowrap">{fmtMoney(preview.total)}</span></div>
                      </div>
                      {preview.error && <Alert type="error" showIcon title={preview.error} style={{ marginTop: 10 }} />}
                      <button type="button" className="sc-plan-btn solid" style={{ marginTop: 16 }} disabled={!!preview.error} onClick={() => { addToCart(line!); message.success('Đã thêm vào đơn đang soạn'); setSel(null); }}>Thêm vào đơn</button>
                      <button type="button" className="sc-court-clear" onClick={() => setSel(null)}>Bỏ chọn</button>
                      <div style={{ fontSize: 12, color: '#9a968c', marginTop: 8 }}>Giỏ chưa giữ chỗ — chỗ được xác nhận khi thanh toán. <a onClick={() => navigate('/member/checkout')}>Đơn đang soạn ({cart.lines.length})</a></div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Space>
        ) },
        { key: 'package', label: 'Gói sân định kỳ', children: (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card title="Cấu hình gói (UC_2.8)">
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Facility</div><Select style={{ width: '100%' }} placeholder="Chọn sân / phòng" value={pk.roomId || undefined} onChange={(v) => setPk({ ...pk, roomId: v })} options={rooms.filter((r) => r.capacity === 1).map((r) => ({ value: r.id, label: `${r.name} · ${fmtMoney(r.pricePerSlot)}/slot` }))} /></div>
                  <Space wrap>
                    <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Bắt đầu</div><DatePicker value={dayjs(pk.startDate)} minDate={dayjs()} format="DD/MM/YYYY" allowClear={false} onChange={(v) => v && setPk({ ...pk, startDate: v.format('YYYY-MM-DD') })} /></div>
                    <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Slot</div><Select style={{ width: 140 }} value={pk.slotIdx} onChange={(v) => setPk({ ...pk, slotIdx: v })} options={slots.map((sl, i) => ({ value: i, label: `${sl.start}–${sl.end}` }))} /></div>
                    <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Số tuần</div><InputNumber min={1} max={12} value={pk.weeks} onChange={(v) => setPk({ ...pk, weeks: v ?? 1 })} /></div>
                  </Space>
                  <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Thứ trong tuần</div><Checkbox.Group value={pk.daysOfWeek} onChange={(v) => setPk({ ...pk, daysOfWeek: (v as number[]).sort() })} options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: DAY_NAMES[d] }))} /></div>
                  <Alert type="info" showIcon title="Gói không bị giới hạn đặt trước; bất kỳ slot nào đã có booking / lớp / bảo trì thì cả gói bị từ chối (BR_2.18). Một dòng tính tiền, nhiều booking con." />
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card title={`Preview ${pkDates.length} buổi`}>
                {!pkLine ? <div style={{ color: '#9a968c' }}>Chọn facility để xem lịch dự kiến.</div> : (
                  <>
                    {pkQuote?.error && <Alert type="error" showIcon title={pkQuote.error} style={{ marginBottom: 12 }} />}
                    <Table size="small" rowKey="date" pagination={false} scroll={{ y: 260 }} dataSource={pkDates.map((d, i): SubBooking => ({ ...(pkQuote?.subBookings?.[i] ?? { listPrice: 0, price: 0 }), date: d }))} columns={[
                      { title: '#', width: 40, render: (_, __, i) => i + 1 },
                      { title: 'Ngày', dataIndex: 'date', render: (v) => <span className="sc-nowrap">{DAY_NAMES[((dayjs(v).day() + 6) % 7) + 1]} {dayjs(v).format('DD/MM')}</span> },
                      { title: 'Giờ', render: () => `${slots[pk.slotIdx]?.start}–${slots[pk.slotIdx]?.end}` },
                      { title: 'Giá gốc', dataIndex: 'listPrice', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
                      { title: 'Sau ưu đãi', dataIndex: 'price', align: 'right', render: (v, r) => <span className="sc-nowrap"><b>{fmtMoney(v)}</b> {r.benefitKind && <StatusTag value={r.benefitKind} />}</span> },
                    ]} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <div><div style={{ fontSize: 12, color: '#7a776f' }}>Tổng gói (1 dòng, {pkDates.length} booking con)</div><b style={{ fontSize: 20 }}>{fmtMoney(pkQuote?.total ?? 0)}</b>{pkQuote && pkQuote.membershipDiscount > 0 && <span style={{ color: '#16a34a', marginLeft: 8 }}>đã giảm {fmtMoney(pkQuote.membershipDiscount)}</span>}</div>
                      <Button type="primary" size="large" disabled={!!pkQuote?.error} onClick={() => { addToCart(pkLine); message.success('Đã thêm gói định kỳ vào đơn'); navigate('/member/checkout'); }}>Thêm vào đơn</Button>
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        ) },
      ]} />

      <Card title="Lịch đặt của tôi" size="small" id="my-bookings">
        <Tabs size="small" items={[
          { key: 'b', label: `Lượt đặt (${mine.length})`, children: (
            <Table size="small" rowKey="id" dataSource={mine} pagination={{ pageSize: 6 }} columns={[
              { title: 'Facility', render: (_, r) => { const c = data.rooms.find((x) => x.id === r.roomId); return <><b>{c?.name}</b><div style={{ fontSize: 12 }}><Space size={[2, 2]}>{c?.sportIds.map((id) => <SportTag key={id} id={id} size="small" />)}</Space>{r.packageId && <Tag style={{ marginLeft: 4 }}>gói định kỳ</Tag>}</div></>; } },
              { title: 'Thời gian', render: (_, r) => <span className="sc-nowrap">{dayjs(r.date).format('DD/MM/YYYY')} · {r.startTime}–{r.endTime}</span> },
              { title: 'Giá', dataIndex: 'price', align: 'right', render: (v, r) => <span className="sc-nowrap"><b>{fmtMoney(v)}</b> {r.benefitKind && <StatusTag value={r.benefitKind} />}</span> },
              { title: 'Trạng thái', dataIndex: 'status', render: (v, r) => <span className="sc-nowrap"><StatusTag value={v} />{r.refundedAmount > 0 && <small style={{ color: '#dc2626' }}>hoàn {fmtMoney(r.refundedAmount)}</small>}</span> },
              { title: '', render: (_, r) => r.status === 'CONFIRMED' && `${r.date} ${r.startTime}` > dayjs().format('YYYY-MM-DD HH:mm') && (canCancel(r.date, r.startTime)
                ? <Popconfirm title={`Hủy lượt này? Hoàn ${fmtMoney(r.price - r.refundedAmount)} về ví (trước ${s.bookingCancelDeadlineHours}h).`} onConfirm={() => { const res = cancelBooking(r.id, 'MEMBER'); message.success(`Đã hủy, hoàn ${fmtMoney(res.refunded)} vào ví`); }}><Button size="small" danger>Hủy</Button></Popconfirm>
                : <Popconfirm title="Quá deadline — hủy sẽ KHÔNG hoàn tiền. Vẫn hủy?" onConfirm={() => { cancelBooking(r.id, 'MEMBER'); message.info('Đã hủy, không hoàn tiền'); }}><Button size="small">Hủy (không hoàn)</Button></Popconfirm>) },
            ]} />
          ) },
          { key: 'p', label: `Gói định kỳ (${myPackages.length})`, children: (
            <Table size="small" rowKey="id" dataSource={myPackages} pagination={false} columns={[
              { title: 'Facility', render: (_, p) => <b>{data.rooms.find((r) => r.id === p.roomId)?.name}</b> },
              { title: 'Lịch', render: (_, p) => `${p.daysOfWeek.map((d) => DAY_SHORT[d]).join('/')} ${p.startTime}–${p.endTime} · ${p.weeks} tuần từ ${dayjs(p.startDate).format('DD/MM')}` },
              { title: 'Buổi', render: (_, p) => { const bs = data.bookings.filter((b) => b.packageId === p.id); return `${bs.filter((b) => b.status === 'CONFIRMED').length}/${bs.length} còn hiệu lực`; } },
              { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
              { title: '', render: (_, p) => p.status === 'ACTIVE' && <Popconfirm title="Hủy cả gói? Các buổi tương lai đủ deadline được hoàn theo allocation từng buổi." onConfirm={() => { const r = cancelPackage(p.id); message.success(`Đã hủy ${r.cancelled} buổi, hoàn ${fmtMoney(r.refunded)}`); }}><Button size="small" danger>Hủy gói</Button></Popconfirm> },
            ]} />
          ) },
        ]} />
      </Card>
    </Page>
  );
}
