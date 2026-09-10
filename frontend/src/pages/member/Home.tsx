import { Alert, Button, Card, Col, List, Progress, Row, Tag } from 'antd';
import { BellOutlined, BookOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, useApp } from '../../store/AppContext';

export default function MemberHome() {
  const { data, currentUser, activeSubscription, membershipStatus, nameOf } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const sub = activeSubscription(me.id);
  const st = membershipStatus(me.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const pct = sub && plan ? Math.round((daysLeft / plan.durationDays) * 100) : 0;

  const myClasses = data.enrollments.filter((e) => e.memberId === me.id && e.status === 'ACTIVE').map((e) => data.classes.find((c) => c.id === e.classId)!).filter(Boolean);
  const upcoming = data.schedules.filter((s) => myClasses.some((c) => c.id === s.classId)).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).slice(0, 5);
  const unread = data.notifications.filter((n) => n.userId === me.id && !n.read);
  const att = data.attendances.filter((a) => a.memberId === me.id);
  const attendanceRate = att.length ? Math.round((att.filter((a) => a.status !== 'ABSENT').length / att.length) * 100) : 0;

  return (
    <Page title={`Xin chào, ${me.fullName.split(' ').pop()} 👋`} subtitle={me.goal ? `Mục tiêu: ${me.goal}` : undefined} noCard>
      {(st === 'EXPIRING' || st === 'EXPIRED' || st === 'NONE') && (
        <Alert type={st === 'EXPIRING' ? 'warning' : 'error'} showIcon
          title={st === 'EXPIRING' ? `Gói ${plan?.name} sẽ hết hạn sau ${daysLeft} ngày` : 'Bạn chưa có gói thành viên còn hiệu lực'}
          action={<Button size="small" type="primary" onClick={() => navigate('/member/plans')}>{st === 'EXPIRING' ? 'Gia hạn ngay' : 'Xem gói'}</Button>} />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={9}>
          <Card style={{ height: '100%', background: 'linear-gradient(135deg,#0b1220 0%,#1d4ed8 120%)', border: 'none', color: '#fff' }} styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ opacity: .7, fontSize: 13 }}>Gói thành viên</span><StatusTag value={st} />
            </div>
            {sub && plan ? (
              <>
                <div style={{ fontSize: 34, fontWeight: 700, marginTop: 10, letterSpacing: -1 }}>{daysLeft} <span style={{ fontSize: 14, fontWeight: 500, opacity: .8 }}>ngày còn lại</span></div>
                <Progress percent={pct} showInfo={false} strokeColor="#fb923c" railColor="rgba(255,255,255,.15)" style={{ margin: '6px 0' }} />
                <div style={{ opacity: .85, fontSize: 13 }}>{plan.name} · hết hạn {dayjs(sub.endDate).format('DD/MM/YYYY')}</div>
              </>
            ) : <Button style={{ marginTop: 16 }} onClick={() => navigate('/member/plans')}>Đăng ký gói ngay</Button>}
          </Card>
        </Col>
        <Col xs={24} md={5}><StatCard title="Lớp đang học" value={myClasses.length} icon={<BookOutlined />} color="#9333ea" onClick={() => navigate('/member/classes')} /></Col>
        <Col xs={24} md={5}><StatCard title="Chuyên cần" value={`${attendanceRate}%`} icon={<CalendarOutlined />} color="#16a34a" hint={`${att.length} buổi đã điểm danh`} onClick={() => navigate('/member/attendance')} /></Col>
        <Col xs={24} md={5}><StatCard title="Thông báo mới" value={unread.length} icon={<BellOutlined />} color="#f97316" onClick={() => navigate('/member/notifications')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Lịch tập tuần này" extra={<a onClick={() => navigate('/member/schedule')}>Xem lịch đầy đủ <RightOutlined style={{ fontSize: 10 }} /></a>}>
            <List dataSource={upcoming} renderItem={(s) => { const c = myClasses.find((x) => x.id === s.classId)!; return (
              <List.Item actions={[<Tag>{data.rooms.find((r) => r.id === c.roomId)?.name}</Tag>]}>
                <List.Item.Meta
                  avatar={<div style={{ width: 52, textAlign: 'center', background: '#eff6ff', borderRadius: 10, padding: '6px 0', color: '#2563eb', fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T')}<br /><span style={{ fontWeight: 500 }}>{s.startTime}</span></div>}
                  title={<b>{c.name}</b>} description={`${s.startTime} – ${s.endTime} · HLV ${nameOf(c.coachId)}`} />
              </List.Item>
            ); }} locale={{ emptyText: 'Bạn chưa đăng ký lớp nào' }} />
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
