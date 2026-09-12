import { useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Radio, Row, Segmented, Select, Space, Table, Tag, message } from 'antd';
import { CalendarOutlined, DollarOutlined, LeftOutlined, PercentageOutlined, PrinterOutlined, RightOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import UserCell from '../../components/UserCell';
import CourtGrid, { type Selection } from '../../components/CourtGrid';
import { fmtMoney, useApp } from '../../store/AppContext';
import { nextInvoiceNo } from '../../utils/invoice';
import { HOURS, courtConflict, courtPrice, hh } from '../../utils/sports';
import type { CourtBooking } from '../../types';

/** Trang quản lý đặt sân — dùng chung cho Lễ tân và Quản lý. */
export default function CourtBookings({ manager }: { manager?: boolean }) {
  const { data, add, update, log, notify, nameOf, currentUser } = useApp();
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sport, setSport] = useState<string>('ALL');
  const [sel, setSel] = useState<Selection | null>(null);
  const [view, setView] = useState<CourtBooking | null>(null);
  const [form] = Form.useForm();
  const memberId = Form.useWatch('memberId', form);
  const hours = Form.useWatch('hours', form) ?? 1;

  const courts = data.rooms.filter((r) => r.type === 'COURT' && (sport === 'ALL' || r.sportId === sport));
  const court = data.rooms.find((r) => r.id === sel?.courtId);
  const quote = court && sel ? courtPrice(data, memberId, court, hours) : null;
  const conflict = court && sel ? courtConflict(data, court.id, date, hh(sel.start), hh(sel.start + hours)) : null;

  const dayBookings = data.courtBookings.filter((b) => b.date === date && courts.some((c) => c.id === b.courtId)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const active = dayBookings.filter((b) => b.status !== 'CANCELLED');
  const revenue = active.reduce((s, b) => s + b.price, 0);
  const bookedHours = active.reduce((s, b) => s + (Number(b.endTime.slice(0, 2)) - Number(b.startTime.slice(0, 2))), 0);
  const occupancy = courts.length ? Math.round(bookedHours / (courts.length * HOURS.length) * 100) : 0;
  const base = manager ? '/manager' : '/receptionist';

  const book = (v: { memberId: string; hours: number; method: 'CASH' | 'BANK' | 'VNPAY' | 'MOMO'; note?: string }) => {
    if (!court || !sel || !quote) return;
    const start = hh(sel.start), end = hh(sel.start + v.hours);
    const cf = courtConflict(data, court.id, date, start, end);
    if (cf) { message.error(cf); return; }
    const b = add('courtBookings', { courtId: court.id, memberId: v.memberId, date, startTime: start, endTime: end, price: quote.price, status: 'BOOKED', createdAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id, note: v.note });
    add('payments', { invoiceNo: nextInvoiceNo(data.payments), memberId: v.memberId, amount: quote.price, method: v.method, type: 'COURT', refName: `${court.name} · ${dayjs(date).format('DD/MM')} ${start}–${end}`, paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id });
    log('BOOK_COURT', 'CourtBooking', b.id, `Đặt ${court.name} ${dayjs(date).format('DD/MM')} ${start}–${end} cho ${nameOf(v.memberId)} - thu ${fmtMoney(quote.price)}`);
    notify(v.memberId, 'Đặt sân thành công', `${court.name} ngày ${dayjs(date).format('DD/MM')} lúc ${start}–${end}.`);
    message.success('Đã đặt sân và tạo hóa đơn'); setSel(null); form.resetFields();
  };

  const setStatus = (b: CourtBooking, status: CourtBooking['status']) => {
    update('courtBookings', b.id, { status });
    const c = data.rooms.find((r) => r.id === b.courtId);
    log(status === 'CANCELLED' ? 'CANCEL_COURT' : status === 'CHECKED_IN' ? 'COURT_CHECKIN' : 'COURT_DONE', 'CourtBooking', b.id, `${status === 'CANCELLED' ? 'Hủy' : status === 'CHECKED_IN' ? 'Nhận sân' : 'Hoàn tất'} ${c?.name} ${dayjs(b.date).format('DD/MM')} ${b.startTime} - ${nameOf(b.memberId)}`);
    if (status === 'CANCELLED') notify(b.memberId, 'Lượt đặt sân đã hủy', `${c?.name} ${dayjs(b.date).format('DD/MM')} ${b.startTime}–${b.endTime} đã được hủy. Tiền sẽ hoàn theo chính sách.`);
    message.success('Đã cập nhật'); setView(null);
  };
  const paymentOf = (b: CourtBooking) => data.payments.find((p) => p.type === 'COURT' && p.memberId === b.memberId && p.refName.startsWith(data.rooms.find((r) => r.id === b.courtId)?.name ?? '#') && p.refName.includes(`${dayjs(b.date).format('DD/MM')} ${b.startTime}`));

  return (
    <Page title="Đặt sân & lịch sân" subtitle="Click ô trống để đặt sân tại quầy; click ô đã đặt để nhận sân / hủy. Ô xám là lớp học đang dùng sân." noCard
      extra={<Space>
        <Button icon={<LeftOutlined />} onClick={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))} />
        <DatePicker value={dayjs(date)} onChange={(v) => v && setDate(v.format('YYYY-MM-DD'))} allowClear={false} format="dddd, DD/MM/YYYY" style={{ width: 200 }} />
        <Button icon={<RightOutlined />} onClick={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))} />
        <Button onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}>Hôm nay</Button>
      </Space>}>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Lượt đặt trong ngày" value={active.length} icon={<CalendarOutlined />} color="#0f4d34" hint={`${dayBookings.filter((b) => b.status === 'CANCELLED').length} đã hủy`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Doanh thu sân" value={fmtMoney(revenue)} icon={<DollarOutlined />} color="#16a34a" hint={`${bookedHours} giờ sân`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Công suất sân" value={`${occupancy}%`} icon={<PercentageOutlined />} color="#c94a1e" hint={`${courts.length} sân · ${HOURS.length}h/ngày`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Chờ nhận sân" value={active.filter((b) => b.status === 'BOOKED').length} icon={<ScheduleOutlined />} color="#9333ea" hint={`${active.filter((b) => b.status === 'CHECKED_IN').length} đang chơi`} /></Col>
      </Row>

      <Card size="small" title={<div style={{ overflowX: 'auto' }}><Segmented value={sport} onChange={(v) => { setSport(v as string); setSel(null); }} options={[{ value: 'ALL', label: 'Tất cả sân' }, ...data.sports.filter((s) => data.rooms.some((r) => r.type === 'COURT' && r.sportId === s.id)).map((s) => ({ value: s.id, label: s.name }))]} /></div>}>
        <CourtGrid courts={courts} date={date} selection={sel} maxHours={1} onSelect={(s) => { setSel(s); if (s) form.setFieldsValue({ hours: 1, method: 'CASH' }); }} onBookingClick={setView} onClassClick={(c) => manager ? navigate(`/manager/classes/${c.id}`) : message.info(`Lớp ${c.name} đang dùng sân khung giờ này`)} />
      </Card>

      <Card size="small" title={`Danh sách đặt sân ngày ${dayjs(date).format('DD/MM/YYYY')}`}>
        <Table size="small" rowKey="id" dataSource={dayBookings} pagination={{ pageSize: 8 }} columns={[
          { title: 'Giờ', render: (_, r) => <b className="sc-nowrap">{r.startTime}–{r.endTime}</b> },
          { title: 'Sân', render: (_, r) => { const c = data.rooms.find((x) => x.id === r.courtId); return <Space size={6}><SportTag id={c?.sportId} size="small" />{c?.name}</Space>; } },
          { title: 'Thành viên', render: (_, r) => <UserCell id={r.memberId} size={28} /> },
          { title: 'Giá', dataIndex: 'price', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
          { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          { title: 'Tạo bởi', render: (_, r) => <span style={{ fontSize: 12, color: '#7a776f' }}>{r.createdBy === r.memberId ? 'Online' : nameOf(r.createdBy)}</span> },
          { title: '', render: (_, r) => <Button size="small" onClick={() => setView(r)}>Chi tiết</Button> },
        ]} />
      </Card>

      <Modal title="Đặt sân tại quầy" open={!!sel} onCancel={() => setSel(null)} onOk={() => form.submit()} okText="Đặt sân & thu tiền" okButtonProps={{ disabled: !!conflict }}>
        {court && sel && (
          <Form form={form} layout="vertical" onFinish={book} initialValues={{ hours: 1, method: 'CASH' }}>
            <Alert type="info" showIcon style={{ marginBottom: 12 }} title={<span><b>{court.name}</b> · {dayjs(date).format('DD/MM/YYYY')} · bắt đầu {hh(sel.start)} · {fmtMoney(court.hourlyRate ?? 0)}/giờ</span>} />
            <Form.Item name="memberId" label="Thành viên" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" placeholder="Tên / SĐT" options={data.users.filter((u) => u.role === 'MEMBER' && u.status === 'ACTIVE').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} /></Form.Item>
            <Form.Item name="hours" label="Số giờ"><InputNumber min={1} max={Math.min(3, 22 - sel.start)} style={{ width: '100%' }} /></Form.Item>
            {conflict && <Alert type="error" showIcon title={conflict} style={{ marginBottom: 12 }} />}
            {quote && (
              <div style={{ background: '#f7f5f0', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{hours} giờ × {fmtMoney(court.hourlyRate ?? 0)}</span><span>{fmtMoney(quote.base)}</span></div>
                {quote.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a' }}><span>Ưu đãi gói {quote.plan?.name}</span><span>−{quote.discount}%</span></div>}
                {memberId && quote.discount === 0 && <div style={{ fontSize: 12, color: '#9a968c' }}>Thành viên chưa có gói ưu đãi sân — tính giá niêm yết.</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 6 }}><span>Thu</span><span>{fmtMoney(quote.price)}</span></div>
              </div>
            )}
            <Form.Item name="method" label="Phương thức"><Radio.Group options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }, { value: 'VNPAY', label: 'VNPay' }, { value: 'MOMO', label: 'MoMo' }]} /></Form.Item>
            <Form.Item name="note" label="Ghi chú"><Input placeholder="VD: mượn 2 vợt, 1 ống cầu" /></Form.Item>
          </Form>
        )}
      </Modal>

      <Drawer title="Chi tiết đặt sân" open={!!view} onClose={() => setView(null)} width={420}>
        {view && (() => {
          const c = data.rooms.find((r) => r.id === view.courtId);
          const pay = paymentOf(view);
          const isToday = view.date === dayjs().format('YYYY-MM-DD');
          return (
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <UserCell id={view.memberId} size={44} />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Sân"><Space size={6}><SportTag id={c?.sportId} size="small" />{c?.name}</Space></Descriptions.Item>
                <Descriptions.Item label="Thời gian">{dayjs(view.date).format('DD/MM/YYYY')} · {view.startTime}–{view.endTime}</Descriptions.Item>
                <Descriptions.Item label="Giá"><b>{fmtMoney(view.price)}</b></Descriptions.Item>
                <Descriptions.Item label="Trạng thái"><StatusTag value={view.status} /></Descriptions.Item>
                <Descriptions.Item label="Đặt lúc">{view.createdAt} · {view.createdBy === view.memberId ? <Tag color="cyan" style={{ margin: 0 }}>Online</Tag> : nameOf(view.createdBy)}</Descriptions.Item>
                {view.note && <Descriptions.Item label="Ghi chú">{view.note}</Descriptions.Item>}
              </Descriptions>
              <Space wrap>
                {view.status === 'BOOKED' && <Button type="primary" disabled={!isToday} onClick={() => setStatus(view, 'CHECKED_IN')}>Nhận sân</Button>}
                {view.status === 'CHECKED_IN' && <Button type="primary" onClick={() => setStatus(view, 'COMPLETED')}>Hoàn tất</Button>}
                {(view.status === 'BOOKED' || view.status === 'CHECKED_IN') && <Popconfirm title="Hủy lượt đặt này?" description="Hoàn tiền theo chính sách (trước 2h: 100%)." onConfirm={() => setStatus(view, 'CANCELLED')}><Button danger>Hủy đặt</Button></Popconfirm>}
                {pay && <Button icon={<PrinterOutlined />} onClick={() => navigate(`${base}/payments/${pay.id}`)}>Hóa đơn {pay.invoiceNo}</Button>}
              </Space>
              {view.status === 'BOOKED' && !isToday && <div style={{ fontSize: 12, color: '#9a968c' }}>Chỉ nhận sân trong ngày diễn ra.</div>}
            </Space>
          );
        })()}
      </Drawer>
    </Page>
  );
}
