import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Empty, Popconfirm, Row, Segmented, Table, Tag, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import CourtGrid, { type Selection } from '../../components/CourtGrid';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { courtConflict, courtPrice, hh } from '../../utils/sports';

export default function Courts() {
  const { data, currentUser, update, log } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const courtSports = data.sports.filter((s) => data.rooms.some((r) => r.type === 'COURT' && r.sportId === s.id));
  const [sport, setSport] = useState<string>(courtSports[0]?.id ?? '');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sel, setSel] = useState<Selection | null>(null);

  const courts = data.rooms.filter((r) => r.type === 'COURT' && r.sportId === sport);
  const court = courts.find((c) => c.id === sel?.courtId);
  const quote = court && sel ? courtPrice(data, me.id, court, sel.hours) : null;
  const conflict = court && sel ? courtConflict(data, court.id, date, hh(sel.start), hh(sel.start + sel.hours)) : null;

  const mine = useMemo(() => data.courtBookings.filter((b) => b.memberId === me.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)), [data.courtBookings, me.id]);
  const upcoming = mine.filter((b) => b.status === 'BOOKED' && `${b.date} ${b.startTime}` >= dayjs().format('YYYY-MM-DD HH:mm'));

  const cancel = (id: string) => {
    const b = data.courtBookings.find((x) => x.id === id)!;
    update('courtBookings', id, { status: 'CANCELLED' });
    log('CANCEL_COURT', 'CourtBooking', id, `${me.fullName} hủy ${data.rooms.find((r) => r.id === b.courtId)?.name} ${dayjs(b.date).format('DD/MM')} ${b.startTime}`);
    message.success('Đã hủy đặt sân. Tiền sẽ được hoàn vào ví/gói theo chính sách.');
  };
  const canCancel = (d: string, t: string) => dayjs(`${d} ${t}`).diff(dayjs(), 'hour') >= 2;

  const days = Array.from({ length: 7 }).map((_, i) => dayjs().add(i, 'day'));

  return (
    <Page title="Đặt sân theo giờ" subtitle="Chọn bộ môn → ngày → khung giờ trống trên lưới. Thành viên có gói được giảm giá thuê sân." noCard
      extra={upcoming.length > 0 && <Tag color="blue" icon={<CalendarOutlined />}>{upcoming.length} lượt sắp tới</Tag>}>
      <Card size="small">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflowX: 'auto' }}>
            <Segmented value={sport} onChange={(v) => { setSport(v as string); setSel(null); }} options={courtSports.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))} />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {days.map((d) => {
              const k = d.format('YYYY-MM-DD'); const active = k === date;
              return <div key={k} onClick={() => { setDate(k); setSel(null); }} style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 8, textAlign: 'center', lineHeight: 1.2, background: active ? '#0f4d34' : '#f4f6fb', color: active ? '#fff' : '#3d3b35', minWidth: 46 }}>
                <div style={{ fontSize: 10, opacity: .8 }}>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.day()]}</div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.format('DD')}</div>
              </div>;
            })}
            <DatePicker value={dayjs(date)} onChange={(v) => { if (v) { setDate(v.format('YYYY-MM-DD')); setSel(null); } }} minDate={dayjs()} maxDate={dayjs().add(30, 'day')} allowClear={false} format="DD/MM/YYYY" style={{ width: 130 }} />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={17}>
          <Card title={<span><SportTag id={sport} /> <span style={{ marginLeft: 8, fontWeight: 500, color: '#7a776f', fontSize: 13 }}>{dayjs(date).format('dddd, DD/MM/YYYY')}</span></span>} size="small">
            {courts.length === 0 ? <Empty description="Bộ môn này chưa có sân" /> : <CourtGrid courts={courts} date={date} meId={me.id} selection={sel} onSelect={setSel} onBookingClick={(b) => b.memberId === me.id && message.info(`Bạn đã đặt ${b.startTime}–${b.endTime}`)} />}
          </Card>
        </Col>
        <Col xs={24} xl={7}>
          <Card title="Khung giờ đã chọn" size="small" style={{ position: 'sticky', top: 80 }}>
            {!sel || !court || !quote ? (
              <div style={{ color: '#9a968c', textAlign: 'center', padding: '20px 0' }}><ClockCircleOutlined style={{ fontSize: 28, marginBottom: 8 }} /><div>Click vào ô trống trên lưới để chọn giờ.<br />Click ô kề bên để kéo dài (tối đa 3 giờ).</div></div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{court.name}</div>
                <div style={{ color: '#7a776f', fontSize: 13 }}>{court.location} · sức chứa {court.capacity} người</div>
                <div style={{ margin: '12px 0', padding: 12, background: '#f7f5f0', borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><div style={{ fontSize: 11, color: '#9a968c' }}>NGÀY</div><b>{dayjs(date).format('DD/MM/YYYY')}</b></div>
                  <div><div style={{ fontSize: 11, color: '#9a968c' }}>GIỜ</div><b>{hh(sel.start)}–{hh(sel.start + sel.hours)}</b> <span style={{ color: '#9a968c' }}>({sel.hours}h)</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Giá niêm yết</span><span>{fmtMoney(quote.base)}</span></div>
                {quote.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a' }}><span>Ưu đãi gói {quote.plan?.name}</span><span>−{quote.discount}%</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 6, borderTop: '1px dashed #e2ddd2', paddingTop: 8 }}><span>Thanh toán</span><span className="sc-nowrap">{fmtMoney(quote.price)}</span></div>
                {quote.discount === 0 && <div style={{ fontSize: 12, color: '#7a776f', marginTop: 6 }}><InfoCircleOutlined /> Đăng ký gói All-access để được giảm 20–40% thuê sân. <a onClick={() => navigate('/member/plans')}>Xem gói</a></div>}
                {conflict && <Alert type="error" showIcon title={conflict} style={{ marginTop: 10 }} />}
                <Button type="primary" size="large" block style={{ marginTop: 14 }} disabled={!!conflict} onClick={() => navigate(`/member/checkout/court/${court.id}?date=${date}&start=${sel.start}&hours=${sel.hours}`)}>Đặt sân & thanh toán</Button>
                <Button block style={{ marginTop: 8 }} onClick={() => setSel(null)}>Bỏ chọn</Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Lịch đặt sân của tôi" size="small">
        <Table size="small" rowKey="id" dataSource={mine} pagination={{ pageSize: 6 }} columns={[
          { title: 'Sân', render: (_, r) => { const c = data.rooms.find((x) => x.id === r.courtId); return <><b>{c?.name}</b><div style={{ fontSize: 12 }}><SportTag id={c?.sportId} size="small" /></div></>; } },
          { title: 'Thời gian', render: (_, r) => <span className="sc-nowrap">{dayjs(r.date).format('DD/MM/YYYY')} · {r.startTime}–{r.endTime}</span> },
          { title: 'Giá', dataIndex: 'price', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
          { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          { title: '', render: (_, r) => r.status === 'BOOKED' && (canCancel(r.date, r.startTime)
            ? <Popconfirm title="Hủy lượt đặt sân này?" description="Hủy trước 2 giờ được hoàn 100%." onConfirm={() => cancel(r.id)}><Button size="small" danger>Hủy</Button></Popconfirm>
            : <span style={{ fontSize: 12, color: '#9a968c' }}>Không thể hủy (dưới 2h)</span>) },
        ]} />
      </Card>
    </Page>
  );
}
