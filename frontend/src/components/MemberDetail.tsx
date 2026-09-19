import { Button, Card, Col, Descriptions, Progress, Row, Space, Switch, Table, Tabs, Tag, Timeline, message } from 'antd';
import { CalendarOutlined, DollarOutlined, LoginOutlined, TrophyOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from './Page';
import StatusTag from './StatusTag';
import StatCard from './StatCard';
import BodyMetricsChart from './BodyMetricsChart';
import { initialsOf } from './UserCell';
import { DAY_NAMES, fmtMoney, useApp } from '../store/AppContext';

export default function MemberDetail({ receptionist }: { receptionist?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, membershipStatus, activeSubscription, update, log, currentUser, setCartBuyer } = useApp();
  const u = userById(id);
  if (!u) return <Page title="Không tìm thấy thành viên"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const base = receptionist ? '/receptionist' : '/manager';

  const sub = activeSubscription(u.id);
  const st = membershipStatus(u.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const subs = data.subscriptions.filter((s) => s.memberId === u.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const periods = data.orderItems.filter((it) => it.type === 'MEMBERSHIP' && data.orders.find((o) => o.id === it.orderId)?.buyerId === u.id).map((it) => ({ ...it, order: data.orders.find((o) => o.id === it.orderId)! })).sort((a, b) => b.order.paidAt.localeCompare(a.order.paidAt));
  const enrolls = data.enrollments.filter((e) => e.memberId === u.id);
  const orders = data.orders.filter((o) => o.buyerId === u.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const wallet = data.walletTransactions.filter((w) => w.memberId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bookings = data.bookings.filter((b) => b.memberId === u.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  const checkIns = data.checkIns.filter((c) => c.memberId === u.id).sort((a, b) => b.time.localeCompare(a.time));
  const att = data.attendances.filter((a) => a.memberId === u.id).map((a) => ({ ...a, session: data.sessions.find((s) => s.id === a.sessionId)! })).filter((a) => a.session).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const attRate = att.length ? Math.round((att.filter((a) => a.status !== 'ABSENT').length / att.length) * 100) : 0;
  const totalPaid = orders.reduce((s, o) => s + o.total - o.refundedAmount, 0);
  const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, session: data.sessions.find((s) => s.id === r.sessionId)! })).filter((r) => r.session).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const reviews = data.progressReviews.filter((r) => r.memberId === u.id && !r.deletedAt);
  const timeline = [
    ...periods.map((p) => ({ t: p.order.paidAt, color: 'blue', text: `${p.name} — ${p.detail}` })),
    ...enrolls.map((e) => ({ t: e.enrolledAt, color: e.status === 'ENROLLED' ? 'green' : 'red', text: `${e.status === 'ENROLLED' ? 'Đăng ký' : 'Hủy'} lớp ${data.classes.find((c) => c.id === e.classId)?.name}` })),
    { t: u.createdAt, color: 'gray', text: 'Tạo tài khoản' },
  ].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 8);

  const setStatus = (status: 'ACTIVE' | 'INACTIVE' | 'BANNED') => { update('users', u.id, { status }); log(status === 'ACTIVE' ? 'ENABLE_USER' : status === 'BANNED' ? 'BAN_USER' : 'DISABLE_USER', 'Account', u.id, `${status === 'ACTIVE' ? 'Kích hoạt' : status === 'BANNED' ? 'Cấm' : 'Vô hiệu hóa'} tài khoản ${u.fullName}`); message.success('Đã cập nhật trạng thái'); };

  return (
    <Page
      title={u.fullName}
      subtitle={`Mã TV ${u.id.toUpperCase()} · ${u.email} · ${u.phone}${u.address ? ` · ${u.address}` : ''}`}
      extra={<Space wrap>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        {receptionist && <>
          <Button icon={<WalletOutlined />} onClick={() => navigate(`/receptionist/wallet?member=${u.id}`)}>Nạp ví</Button>
          <Button onClick={() => navigate(`/receptionist/subscriptions?member=${u.id}`)}>Gói thành viên</Button>
          <Button onClick={() => navigate(`/receptionist/enrollments?member=${u.id}`)}>Đăng ký lớp</Button>
          <Button type="primary" icon={<DollarOutlined />} onClick={() => { setCartBuyer({ kind: 'MEMBER', memberId: u.id }); navigate('/receptionist/counter'); }}>Lập đơn tại quầy</Button>
        </>}
        {!receptionist && currentUser?.role === 'MANAGER' && <>
          {u.status !== 'ACTIVE' && <Button onClick={() => setStatus('ACTIVE')}>Kích hoạt</Button>}
          {u.status === 'ACTIVE' && <Button onClick={() => setStatus('INACTIVE')}>Vô hiệu hóa</Button>}
          {u.status !== 'BANNED' && <Button danger onClick={() => setStatus('BANNED')}>Cấm</Button>}
        </>}
      </Space>}
      noCard
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <div className="sc-cover" style={{ height: 90, borderRadius: 0 }} />
            <div style={{ padding: '0 20px 20px', marginTop: -36 }}>
              <div style={{ position: 'relative', zIndex: 1, width: 72, height: 72, borderRadius: 999, border: '4px solid #fff', boxShadow: '0 6px 16px rgba(20,19,15,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, fontFamily: "'Barlow Condensed', sans-serif", color: '#14130f', backgroundColor: '#d6f24b' }}>{initialsOf(u.fullName)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <b style={{ fontSize: 16 }}>{u.fullName}</b><StatusTag value={u.status} />
              </div>
              <div style={{ color: '#7a776f', fontSize: 13, marginBottom: 14 }}>Tham gia {dayjs(u.createdAt).format('DD/MM/YYYY')} · {dayjs().diff(dayjs(u.createdAt), 'month')} tháng</div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Ngày sinh">{u.dob ? `${dayjs(u.dob).format('DD/MM/YYYY')} (${dayjs().diff(dayjs(u.dob), 'year')} tuổi)` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Giới tính"><StatusTag value={u.gender} /></Descriptions.Item>
                <Descriptions.Item label="Liên hệ khẩn cấp">{u.emergencyContact ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Mục tiêu">{u.goal ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Sức khỏe">{u.healthNote ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Trình độ"><StatusTag value={u.level} /></Descriptions.Item>
              </Descriptions>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card title="Gói thành viên" extra={<StatusTag value={st} />} style={{ height: '100%' }}>
                {sub && plan ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <b style={{ fontSize: 16 }}>{plan.name}</b><span style={{ color: '#7a776f', fontSize: 13 }}>{fmtMoney(plan.price)}</span>
                    </div>
                    <Progress percent={Math.round((daysLeft / plan.durationDays) * 100)} showInfo={false} strokeColor={st === 'EXPIRING' ? '#f59e0b' : '#0f4d34'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#7a776f' }}>
                      <span>{dayjs(sub.startDate).format('DD/MM/YYYY')}</span><b style={{ color: st === 'EXPIRING' ? '#f59e0b' : '#14130f' }}>còn {daysLeft} ngày</b><span>{dayjs(sub.endDate).format('DD/MM/YYYY')}</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Auto-renew</span>
                      <Switch size="small" checked={sub.autoRenew} disabled={!receptionist} onChange={(v) => { update('subscriptions', sub.id, { autoRenew: v }); log(v ? 'ENABLE_AUTO_RENEW' : 'DISABLE_AUTO_RENEW', 'Membership', sub.id, `${v ? 'Bật' : 'Tắt'} auto-renew cho ${u.fullName}`); }} />
                    </div>
                  </>
                ) : <div style={{ color: '#9a968c' }}>Chưa có gói còn hiệu lực</div>}
              </Card>
            </Col>
            <Col xs={12} xl={6}><StatCard title="Số dư ví" value={fmtMoney(u.walletBalance ?? 0)} icon={<WalletOutlined />} color="#0f4d34" hint={`${wallet.length} giao dịch`} /></Col>
            <Col xs={12} xl={6}><StatCard title="Tổng chi tiêu" value={fmtMoney(totalPaid)} icon={<DollarOutlined />} color="#c94a1e" hint={`${orders.length} hóa đơn · chuyên cần ${attRate}%`} /></Col>
            <Col xs={24}>
              <Card title="Lớp đang học">
                {enrolls.filter((e) => e.status === 'ENROLLED').length === 0 && <span style={{ color: '#9a968c' }}>Chưa đăng ký lớp nào</span>}
                <Space wrap>
                  {enrolls.filter((e) => e.status === 'ENROLLED').map((e) => { const c = data.classes.find((x) => x.id === e.classId)!; return (
                    <div key={e.id} style={{ border: '1px solid #ece8df', borderRadius: 12, padding: '10px 14px', minWidth: 220 }}>
                      <b>{c.name}</b>
                      <div style={{ fontSize: 12, color: '#7a776f' }}>HLV {nameOf(c.coachId)} · {data.schedules.filter((s) => s.classId === c.id).map((s) => DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T')).join(', ')}</div>
                    </div>
                  ); })}
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'orders', label: <span><DollarOutlined /> Hóa đơn ({orders.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={orders} columns={[{ title: 'Số HĐ', dataIndex: 'orderNumber', render: (v, r) => <a onClick={() => navigate(`${base}/orders/${r.id}`)} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</a> }, { title: 'Dòng', render: (_, o) => <Space size={4} wrap>{data.orderItems.filter((it) => it.orderId === o.id).map((it) => <StatusTag key={it.id} value={it.type} />)}</Space> }, { title: 'Tổng', dataIndex: 'total', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> }, { title: 'PT', dataIndex: 'paymentMethod', render: (v) => <StatusTag value={v} /> }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }, { title: 'Ngày', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> }]} /> },
          { key: 'wallet', label: <span><WalletOutlined /> Ví ({wallet.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={wallet} columns={[{ title: 'Thời gian', dataIndex: 'createdAt', render: (v) => <span className="sc-nowrap">{v}</span> }, { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> }, { title: 'Nội dung', dataIndex: 'note' }, { title: 'Số tiền', align: 'right', render: (_, w) => <b style={{ color: w.type === 'PAYMENT' ? '#dc2626' : '#16a34a' }} className="sc-nowrap">{w.type === 'PAYMENT' ? '−' : '+'}{fmtMoney(w.amount)}</b> }, { title: 'Số dư sau', dataIndex: 'balanceAfter', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> }]} /> },
          { key: 'bookings', label: `Đặt sân (${bookings.length})`, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={bookings} columns={[{ title: 'Facility', render: (_, b) => data.rooms.find((r) => r.id === b.roomId)?.name }, { title: 'Thời gian', render: (_, b) => <span className="sc-nowrap">{dayjs(b.date).format('DD/MM/YYYY')} {b.startTime}–{b.endTime}</span> }, { title: 'Giá', dataIndex: 'price', align: 'right', render: (v, b) => <span className="sc-nowrap">{fmtMoney(v)} {b.benefitKind && <StatusTag value={b.benefitKind} />}</span> }, { title: 'Gói', render: (_, b) => b.packageId ? <Tag>Định kỳ</Tag> : '—' }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /> },
          { key: 'subs', label: 'Lịch sử gói', children: <><Table size="small" rowKey="id" pagination={false} dataSource={subs} columns={[{ title: 'Gói', render: (_, r) => data.plans.find((p) => p.id === r.planId)?.name }, { title: 'Bắt đầu', dataIndex: 'startDate', render: (v) => dayjs(v).format('DD/MM/YYYY') }, { title: 'Kết thúc', dataIndex: 'endDate', render: (v) => dayjs(v).format('DD/MM/YYYY') }, { title: 'Auto-renew', dataIndex: 'autoRenew', render: (v) => v ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag> }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /><div style={{ fontWeight: 600, margin: '12px 0 6px' }}>Các kỳ đã mua (membership_orders)</div><Table size="small" rowKey="id" pagination={false} dataSource={periods} columns={[{ title: 'Gói', dataIndex: 'name' }, { title: 'Kỳ', dataIndex: 'detail' }, { title: 'Thanh toán', render: (_, p) => <span className="sc-nowrap">{p.order.paidAt} · {fmtMoney(p.total)}</span> }]} /></> },
          { key: 'att', label: <span><CalendarOutlined /> Điểm danh ({att.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={att} columns={[{ title: 'Ngày', render: (_, r) => dayjs(r.session.date).format('DD/MM/YYYY') }, { title: 'Lớp', render: (_, r) => data.classes.find((c) => c.id === r.session.classId)?.name }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /> },
          { key: 'progress', label: <span><TrophyOutlined /> Tiến độ</span>, children: (
            <Row gutter={16}>
              <Col xs={24} lg={14}><BodyMetricsChart memberId={u.id} /></Col>
              <Col xs={24} lg={10}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Kết quả buổi tập gần đây</div>
                <Table size="small" rowKey="id" pagination={false} dataSource={results.slice(0, 5)} columns={[{ title: 'Ngày', render: (_, r) => dayjs(r.session.date).format('DD/MM') }, { title: 'Chỉ số', dataIndex: 'metrics' }, { title: 'HLV', render: (_, r) => nameOf(r.coachId) }]} />
                {reviews.length > 0 && <div style={{ marginTop: 12, fontSize: 13, color: '#3d3b35' }}><b>Nhận xét mới nhất:</b> {reviews[reviews.length - 1].comment}</div>}
              </Col>
            </Row>
          ) },
          { key: 'checkins', label: <span><LoginOutlined /> Check-in ({checkIns.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={checkIns} columns={[{ title: 'Thời gian', dataIndex: 'time' }, { title: 'Căn cứ', dataIndex: 'basis', render: (v) => v ? <Tag>{v === 'MEMBERSHIP' ? 'Gói gym' : v === 'BOOKING' ? 'Booking' : 'Buổi học'}</Tag> : '—' }, { title: 'Nhân viên', render: (_, r) => nameOf(r.by) }]} /> },
          { key: 'timeline', label: 'Dòng thời gian', children: <Timeline items={timeline.map((t) => ({ color: t.color, children: <><Tag style={{ background: '#f3f1ec', color: '#3d3b35' }}>{dayjs(t.t).format('DD/MM/YYYY')}</Tag> {t.text}</> }))} style={{ marginTop: 12 }} /> },
        ]} />
      </Card>
    </Page>
  );
}
