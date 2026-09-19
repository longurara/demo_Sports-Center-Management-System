import { useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Drawer, Descriptions, Input, Popconfirm, Radio, Row, Segmented, Select, Space, Table, Tag, message } from 'antd';
import { CalendarOutlined, DollarOutlined, LeftOutlined, PercentageOutlined, RightOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import UserCell from '../../components/UserCell';
import CourtGrid, { type Selection } from '../../components/CourtGrid';
import { fmtMoney, useApp } from '../../store/AppContext';
import { bookableRooms, slotsOf } from '../../utils/slots';
import { quoteCart } from '../../utils/pricing';
import type { Booking } from '../../types';

/** Lịch facility theo ngày (UC_2.10) + đặt sân tại quầy cho member/guest (UC_2.7) — dùng chung Lễ tân / Manager. */
export default function CourtBookings({ manager }: { manager?: boolean }) {
  const { data, cart, setCartBuyer, addToCart, nameOf, cancelBooking } = useApp();
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sport, setSport] = useState<string>('ALL');
  const [sel, setSel] = useState<Selection | null>(null);
  const [view, setView] = useState<Booking[] | null>(null);
  const [kind, setKind] = useState<'MEMBER' | 'GUEST'>(cart.buyer?.kind ?? 'MEMBER');
  const [memberId, setMemberId] = useState<string | undefined>(cart.buyer?.kind === 'MEMBER' ? cart.buyer.memberId : undefined);
  const [guest, setGuest] = useState({ name: '', phone: '' });
  const slots = slotsOf(data.settings);

  const rooms = bookableRooms(data).filter((r) => sport === 'ALL' || r.sportIds.includes(sport));
  const room = data.rooms.find((r) => r.id === sel?.roomId);
  const start = sel ? slots[sel.start].start : '', end = sel ? slots[sel.start + sel.slots - 1].end : '';
  const buyer = kind === 'MEMBER' ? (memberId ? { kind: 'MEMBER' as const, memberId } : null) : (guest.name && guest.phone ? { kind: 'GUEST' as const, name: guest.name, phone: guest.phone } : null);
  const line = room && sel ? { key: 'preview', type: 'FACILITY_BOOKING' as const, roomId: room.id, date, startTime: start, endTime: end, name: `Đặt ${room.name}`, detail: `${dayjs(date).format('DD/MM/YYYY')} · ${start}–${end} · ${sel.slots} slot` } : null;
  const preview = line ? quoteCart(data, buyer, [line]).lines[0] : null;

  const dayBookings = data.bookings.filter((b) => b.date === date && rooms.some((c) => c.id === b.roomId)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const active = dayBookings.filter((b) => b.status === 'CONFIRMED');
  const revenue = active.reduce((s, b) => s + b.price, 0);
  const base = manager ? '/manager' : '/receptionist';

  const addLine = () => {
    if (!line || !buyer) return;
    if (!cart.buyer || JSON.stringify(cart.buyer) !== JSON.stringify(buyer)) setCartBuyer(buyer);
    addToCart({ ...line });
    message.success('Đã thêm vào đơn tại quầy'); setSel(null);
    navigate('/receptionist/counter');
  };

  return (
    <Page title={manager ? 'Lịch đặt sân / phòng' : 'Đặt sân tại quầy'} subtitle="Slot có buổi học / bảo trì bị khóa; gym hiển thị số chỗ x/N; sân capacity 1 là ô đơn" noCard extra={
      <Space wrap>
        <Segmented value={sport} onChange={(v) => { setSport(v as string); setSel(null); }} options={[{ value: 'ALL', label: 'Tất cả' }, ...data.sports.filter((s) => !s.deletedAt && bookableRooms(data).some((r) => r.sportIds.includes(s.id))).map((s) => ({ value: s.id, label: s.name }))]} />
        <Space.Compact>
          <Button icon={<LeftOutlined />} onClick={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))} />
          <DatePicker value={dayjs(date)} onChange={(v) => v && setDate(v.format('YYYY-MM-DD'))} allowClear={false} format="DD/MM/YYYY" />
          <Button icon={<RightOutlined />} onClick={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))} />
        </Space.Compact>
      </Space>
    }>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Lượt đặt trong ngày" value={active.length} icon={<CalendarOutlined />} color="#0f4d34" hint={`${active.filter((b) => !b.memberId).length} guest · ${active.filter((b) => b.packageId).length} từ gói định kỳ`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Doanh thu booking" value={fmtMoney(revenue)} icon={<DollarOutlined />} color="#c94a1e" hint={`${active.filter((b) => b.price === 0).length} lượt miễn phí theo gói`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Đã hủy" value={dayBookings.filter((b) => b.status === 'CANCELLED').length} icon={<ScheduleOutlined />} color="#7a776f" hint={`hoàn ${fmtMoney(dayBookings.reduce((s, b) => s + b.refundedAmount, 0))}`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Bảo trì hôm nay" value={data.maintenances.filter((m) => !m.deletedAt && m.from.slice(0, 10) <= date && m.to.slice(0, 10) >= date).length} icon={<PercentageOutlined />} color="#f59e0b" hint="facility không nhận booking" /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={manager ? 24 : 17}>
          <Card title={`Lưới facility · ${dayjs(date).format('dddd, DD/MM/YYYY')}`}>
            <CourtGrid rooms={rooms} date={date} selection={sel} maxSlots={3} onSelect={manager ? undefined : setSel} onBookingClick={(b) => setView(b)} onClassClick={(c) => navigate(`${base === '/manager' ? '/manager' : '/receptionist'}${manager ? `/classes/${c.id}` : '/enrollments'}`)} />
          </Card>
        </Col>
        {!manager && (
          <Col xs={24} xl={7}>
            <Card title="Đặt tại quầy" style={{ position: 'sticky', top: 80 }}>
              <Radio.Group value={kind} onChange={(e) => setKind(e.target.value)} optionType="button" buttonStyle="solid" size="small" options={[{ value: 'MEMBER', label: 'Thành viên' }, { value: 'GUEST', label: 'Guest' }]} style={{ marginBottom: 10 }} />
              {kind === 'MEMBER'
                ? <Select showSearch optionFilterProp="label" placeholder="Tìm thành viên" style={{ width: '100%' }} value={memberId} onChange={setMemberId} options={data.users.filter((u) => u.role === 'MEMBER' && u.status === 'ACTIVE').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
                : <Space orientation="vertical" style={{ width: '100%' }} size={6}><Input placeholder="Tên khách" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /><Input placeholder="SĐT" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} /></Space>}
              {!sel || !room ? <div style={{ color: '#9a968c', fontSize: 13, marginTop: 14 }}>Bấm một ô trống trên lưới để chọn slot; bấm ô kề để kéo dài (tối đa 3 slot).</div> : (
                <div style={{ marginTop: 14 }}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Facility">{room.name}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian">{dayjs(date).format('DD/MM')} · {start}–{end} ({sel.slots} slot)</Descriptions.Item>
                    <Descriptions.Item label="Giá gốc">{fmtMoney((preview?.unitPrice) ?? 0)}</Descriptions.Item>
                    {preview && preview.membershipDiscount > 0 && <Descriptions.Item label="Ưu đãi gói"><span style={{ color: '#16a34a' }}>−{fmtMoney(preview.membershipDiscount)} <StatusTag value={preview.benefitKind} /></span></Descriptions.Item>}
                    <Descriptions.Item label="Tạm tính"><b>{fmtMoney(preview?.total ?? 0)}</b></Descriptions.Item>
                  </Descriptions>
                  {!buyer && <Alert type="warning" showIcon title={kind === 'MEMBER' ? 'Chọn thành viên' : 'Nhập tên + SĐT khách (bắt buộc)'} style={{ marginTop: 10 }} />}
                  {preview?.error && <Alert type="error" showIcon title={preview.error} style={{ marginTop: 10 }} />}
                  <Button type="primary" block size="large" style={{ marginTop: 12 }} disabled={!buyer || !!preview?.error} onClick={addLine}>Thêm vào đơn tại quầy</Button>
                  <Button block style={{ marginTop: 8 }} onClick={() => setSel(null)}>Bỏ chọn</Button>
                  {kind === 'GUEST' && <div style={{ fontSize: 12, color: '#9a968c', marginTop: 8 }}>Guest: thanh toán tại quầy, không quyền lợi, không hoàn tiền.</div>}
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
      <Card title={`Lượt đặt ngày ${dayjs(date).format('DD/MM')} (${dayBookings.length})`}>
        <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={dayBookings} scroll={{ x: 'max-content' }} columns={[
          { title: 'Giờ', render: (_, b) => <b className="sc-nowrap">{b.startTime}–{b.endTime}</b> },
          { title: 'Facility', render: (_, b) => { const r = data.rooms.find((x) => x.id === b.roomId); return <><b>{r?.name}</b> <Space size={[2, 2]}>{r?.sportIds.map((id) => <SportTag key={id} id={id} size="small" />)}</Space></>; } },
          { title: 'Khách', render: (_, b) => b.memberId ? <UserCell id={b.memberId} size={28} /> : <span><Tag color="gold" style={{ margin: 0 }}>Guest</Tag> {b.guestName} · {b.guestPhone}</span> },
          { title: 'Giá', dataIndex: 'price', align: 'right', render: (v, b) => <span className="sc-nowrap"><b>{fmtMoney(v)}</b> {b.benefitKind && <StatusTag value={b.benefitKind} />}{b.packageId && <Tag style={{ margin: 0 }}>gói</Tag>}</span> },
          { title: 'Trạng thái', dataIndex: 'status', render: (v, b) => <span className="sc-nowrap"><StatusTag value={v} />{b.refundedAmount > 0 && <small style={{ color: '#dc2626' }}>hoàn {fmtMoney(b.refundedAmount)}</small>}</span> },
          { title: 'Đặt lúc', dataIndex: 'createdAt', render: (v, b) => <span style={{ fontSize: 12 }}>{v} · {b.createdBy === b.memberId ? 'online' : nameOf(b.createdBy)}</span> },
          { title: '', render: (_, b) => b.status === 'CONFIRMED' && `${b.date} ${b.startTime}` > dayjs().format('YYYY-MM-DD HH:mm') && (() => { const ok = dayjs(`${b.date} ${b.startTime}`).diff(dayjs(), 'hour', true) >= data.settings.bookingCancelDeadlineHours; return (
            <Popconfirm title={b.memberId ? (ok ? `Hủy và hoàn ${fmtMoney(b.price - b.refundedAmount)} về ví?` : 'Quá deadline — hủy không hoàn tiền?') : 'Hủy booking guest (không hoàn)?'} onConfirm={() => { const r = cancelBooking(b.id, 'STAFF'); message.success(`Đã hủy, hoàn ${fmtMoney(r.refunded)}`); }}><Button size="small" danger>Hủy</Button></Popconfirm>
          ); })() },
        ]} />
      </Card>
      <Drawer open={!!view} onClose={() => setView(null)} title="Booking trong slot" width={420}>
        {view?.map((b) => (
          <Card key={b.id} size="small" style={{ marginBottom: 10 }}>
            <div>{b.memberId ? <UserCell id={b.memberId} size={28} /> : <span><Tag color="gold">Guest</Tag> {b.guestName} · {b.guestPhone}</span>}</div>
            <div style={{ fontSize: 12.5, marginTop: 6 }}>{data.rooms.find((r) => r.id === b.roomId)?.name} · {b.startTime}–{b.endTime} · {fmtMoney(b.price)} {b.benefitKind && <StatusTag value={b.benefitKind} />}</div>
            <div style={{ fontSize: 12, color: '#7a776f' }}>Đặt lúc {b.createdAt} · {b.createdBy === b.memberId ? 'online' : nameOf(b.createdBy)}{b.orderItemId && <> · <a onClick={() => navigate(`${base}/orders/${data.orderItems.find((it) => it.id === b.orderItemId)?.orderId}`)}>hóa đơn</a></>}</div>
          </Card>
        ))}
      </Drawer>
    </Page>
  );
}
