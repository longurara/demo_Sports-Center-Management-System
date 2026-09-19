import { Alert, Button, Card, Col, List, Progress, Row, Tag } from 'antd';
import { BellOutlined, BookOutlined, RightOutlined, ShoppingCartOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';

export default function MemberHome() {
  const { data, currentUser, activeSubscription, membershipStatus, nameOf, cart } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const sub = activeSubscription(me.id);
  const st = membershipStatus(me.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const pct = sub && plan ? Math.round((daysLeft / plan.durationDays) * 100) : 0;
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  const myClasses = data.enrollments.filter((e) => e.memberId === me.id && e.status === 'ENROLLED').map((e) => data.classes.find((c) => c.id === e.classId)!).filter((c) => c && c.status === 'OPEN');
  const upcomingSessions = data.sessions.filter((s) => myClasses.some((c) => c.id === s.classId) && s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` >= now).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)).slice(0, 4);
  const upcomingBookings = data.bookings.filter((b) => b.memberId === me.id && b.status === 'CONFIRMED' && `${b.date} ${b.endTime}` >= now).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)).slice(0, 3);
  const unread = data.notifications.filter((n) => n.userId === me.id && !n.read);
  const att = data.attendances.filter((a) => a.memberId === me.id);
  const attendanceRate = att.length ? Math.round((att.filter((a) => a.status !== 'ABSENT').length / att.length) * 100) : 0;

  return (
    <Page title={`Xin chào, ${me.fullName.split(' ').pop()} 👋`} subtitle={me.goal ? `Mục tiêu: ${me.goal}` : undefined} noCard>
      {st === 'EXPIRING' && <Alert type="warning" showIcon title={`Gói ${plan?.name} sẽ hết hạn sau ${daysLeft} ngày${sub?.autoRenew ? ' — auto-renew đang bật, hãy đảm bảo ví đủ tiền' : ''}`} action={<Button size="small" type="primary" onClick={() => navigate('/member/membership')}>Gói của tôi</Button>} />}
      {cart.lines.length > 0 && <Alert type="info" showIcon icon={<ShoppingCartOutlined />} title={`Bạn có ${cart.lines.length} dòng trong đơn đang soạn chưa thanh toán — giỏ chưa giữ chỗ.`} action={<Button size="small" type="primary" onClick={() => navigate('/member/checkout')}>Thanh toán</Button>} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={9}>
          <Card style={{ height: '100%', background: 'linear-gradient(135deg,#14130f 0%,#0f4d34 120%)', border: 'none', color: '#fff' }} styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ opacity: .7, fontSize: 13 }}>Gói thành viên</span><StatusTag value={st} />
            </div>
            {sub && plan ? (
              <>
                <div style={{ fontSize: 34, fontWeight: 700, marginTop: 10, letterSpacing: -1 }}>{daysLeft} <span style={{ fontSize: 14, fontWeight: 500, opacity: .8 }}>ngày còn lại</span></div>
                <Progress percent={pct} showInfo={false} strokeColor="#e07a4f" railColor="rgba(255,255,255,.15)" style={{ margin: '6px 0' }} />
                <div style={{ opacity: .85, fontSize: 13 }}>{plan.name} · hết hạn {dayjs(sub.endDate).format('DD/MM/YYYY')}</div>
              </>
            ) : <div style={{ marginTop: 10, fontSize: 13, opacity: .85 }}>Không cần gói vẫn đặt sân / đăng ký lớp được.<br /><Button style={{ marginTop: 12 }} onClick={() => navigate('/member/plans')}>Xem gói</Button></div>}
          </Card>
        </Col>
        <Col xs={12} md={5}><StatCard title="Ví của tôi" value={fmtMoney(me.walletBalance ?? 0)} icon={<WalletOutlined />} color="#0f4d34" onClick={() => navigate('/member/wallet')} hint="Nạp / xem lịch sử" /></Col>
        <Col xs={12} md={5}><StatCard title="Lớp đang học" value={myClasses.length} icon={<BookOutlined />} color="#9333ea" onClick={() => navigate('/member/classes')} hint={`chuyên cần ${attendanceRate}%`} /></Col>
        <Col xs={12} md={5}><StatCard title="Thông báo mới" value={unread.length} icon={<BellOutlined />} color="#c94a1e" onClick={() => navigate('/member/notifications')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Sắp tới" extra={<a onClick={() => navigate('/member/schedule')}>Lịch đầy đủ <RightOutlined style={{ fontSize: 10 }} /></a>}>
            <List dataSource={[...upcomingSessions.map((s) => ({ key: s.id, date: s.date, start: s.startTime, end: s.endTime, title: data.classes.find((c) => c.id === s.classId)?.name ?? '', sub: `${data.rooms.find((r) => r.id === s.roomId)?.name} · HLV ${nameOf(data.classes.find((c) => c.id === s.classId)?.coachId)}`, kind: 'Buổi học' })), ...upcomingBookings.map((b) => ({ key: b.id, date: b.date, start: b.startTime, end: b.endTime, title: data.rooms.find((r) => r.id === b.roomId)?.name ?? '', sub: b.packageId ? 'Gói định kỳ' : 'Đặt lẻ', kind: 'Booking' }))].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 6)}
              renderItem={(it) => (
                <List.Item actions={[<Tag>{it.kind}</Tag>]}>
                  <List.Item.Meta
                    avatar={<div style={{ width: 56, textAlign: 'center', background: '#e3efe8', borderRadius: 10, padding: '6px 0', color: '#0f4d34', fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{DAY_NAMES[((dayjs(it.date).day() + 6) % 7) + 1].replace('Thứ ', 'T')} {dayjs(it.date).format('DD/MM')}<br /><span style={{ fontWeight: 500 }}>{it.start}</span></div>}
                    title={<b>{it.title}</b>} description={`${it.start} – ${it.end} · ${it.sub}`} />
                </List.Item>
              )} locale={{ emptyText: 'Chưa có lịch sắp tới' }} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Thông báo mới" extra={<a onClick={() => navigate('/member/notifications')}>Tất cả</a>}>
            <List size="small" dataSource={unread.slice(0, 4)} renderItem={(n) => <List.Item><List.Item.Meta title={n.title} description={n.content} /></List.Item>} locale={{ emptyText: 'Không có thông báo mới' }} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
