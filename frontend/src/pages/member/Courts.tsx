import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Popconfirm, Row, Table, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import CourtGrid, { type Selection } from '../../components/CourtGrid';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { courtConflict, courtDay, courtPrice, hh } from '../../utils/sports';

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

  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const freeCount = courts.reduce((n, c) => n + courtDay(data, c, date, me.id).filter((x) => x.state === 'FREE').length, 0);

  return (
    <Page title="Đặt sân theo giờ" subtitle="Chọn bộ môn, ngày và khung giờ trống trên lưới. Thành viên có gói được giảm giá thuê sân." noCard
      extra={upcoming.length > 0 && <Link to="#my-bookings" className="sc-court-upcoming">{upcoming.length} lượt sắp tới ↓</Link>}>
      {/* Thanh chọn môn + ngày */}
      <div className="sc-court-bar">
        <div className="sc-filter sc-court-sports">
          {courtSports.map((sp) => <button key={sp.id} type="button" className={`sc-filter-btn ${sport === sp.id ? 'on' : ''}`} onClick={() => { setSport(sp.id); setSel(null); }}>{sp.name}</button>)}
        </div>
        <div className="sc-court-days">
          {days.map((d) => {
            const k = d.format('YYYY-MM-DD');
            return (
              <button key={k} type="button" className={`sc-court-day ${k === date ? 'on' : ''}`} onClick={() => { setDate(k); setSel(null); }}>
                <small>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.day()]}</small><b>{d.format('DD')}</b>
              </button>
            );
          })}
          <DatePicker value={dayjs(date)} onChange={(v) => { if (v) { setDate(v.format('YYYY-MM-DD')); setSel(null); } }} minDate={dayjs()} maxDate={dayjs().add(30, 'day')} allowClear={false} format="DD/MM/YYYY" style={{ width: 132 }} />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={17}>
          <div className="sc-court-grid-card">
            <div className="sc-court-grid-head">
              <h3>{data.sports.find((x) => x.id === sport)?.name} · {cap(dayjs(date).format('dddd, DD/MM'))}</h3>
              <span>{courts.length} sân · {freeCount} khung giờ trống</span>
            </div>
            {courts.length === 0 ? <div className="sc-court-empty">Bộ môn này chưa có sân cho thuê.</div> : <CourtGrid courts={courts} date={date} meId={me.id} selection={sel} onSelect={setSel} onBookingClick={(b) => b.memberId === me.id && message.info(`Bạn đã đặt ${b.startTime}–${b.endTime}`)} />}
          </div>
        </Col>
        <Col xs={24} xl={7}>
          <div className="sc-court-side">
            {!sel || !court || !quote ? (
              <div className="sc-court-side-empty">
                <small>Khung giờ đã chọn</small>
                <h3>Chưa chọn giờ</h3>
                <p>Bấm vào một ô trống trên lưới để chọn giờ. Bấm ô kề bên để kéo dài, tối đa 3 giờ mỗi lượt.</p>
                <p className="muted">Hủy trước giờ chơi 2 tiếng được hoàn 100%.</p>
              </div>
            ) : (
              <div>
                <small>Khung giờ đã chọn</small>
                <h3>{court.name}</h3>
                <div className="sc-court-side-sub">{court.location} · sức chứa {court.capacity} người</div>
                <div className="sc-court-when">
                  <div><span>Ngày</span><b>{cap(dayjs(date).format('dddd, DD/MM'))}</b></div>
                  <div><span>Giờ</span><b>{hh(sel.start)}–{hh(sel.start + sel.hours)}</b><em>{sel.hours} giờ</em></div>
                </div>
                <div className="sc-court-quote">
                  <div><span>Giá niêm yết</span><span>{fmtMoney(quote.base)}</span></div>
                  {quote.discount > 0 && <div className="disc"><span>Ưu đãi gói {quote.plan?.name}</span><span>−{quote.discount}%</span></div>}
                  <div className="total"><span>Thanh toán</span><span className="sc-nowrap">{fmtMoney(quote.price)}</span></div>
                </div>
                {quote.discount === 0 && <p className="sc-court-side-note">Gói All-access được giảm 20–40% thuê sân. <Link to="/member/plans">Xem gói</Link></p>}
                {conflict && <Alert type="error" showIcon title={conflict} style={{ marginTop: 10 }} />}
                <button type="button" className="sc-plan-btn solid" style={{ marginTop: 16 }} disabled={!!conflict} onClick={() => navigate(`/member/checkout/court/${court.id}?date=${date}&start=${sel.start}&hours=${sel.hours}`)}>Đặt sân & thanh toán</button>
                <button type="button" className="sc-court-clear" onClick={() => setSel(null)}>Bỏ chọn</button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Card title="Lịch đặt sân của tôi" size="small" id="my-bookings">
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
