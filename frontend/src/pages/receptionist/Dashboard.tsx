import { Avatar, Button, Card, Col, List, Row, Space, Table, Tag } from 'antd';
import { CustomerServiceOutlined, DollarOutlined, FieldTimeOutlined, LoginOutlined, ShopOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';

export default function ReceptionistDashboard() {
  const { data, nameOf, membershipStatus, activeSubscription } = useApp();
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const todayCheckIns = data.checkIns.filter((c) => c.time.startsWith(today));
  const todayOrders = data.orders.filter((o) => o.paidAt.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const counterRevenue = todayOrders.filter((o) => o.paymentMethod !== 'WALLET').reduce((s, o) => s + o.total, 0);
  const expiring = data.users.filter((u) => u.role === 'MEMBER' && membershipStatus(u.id) === 'EXPIRING');
  const openSupport = data.supportRequests.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
  const dow = ((dayjs().day() + 6) % 7) + 1;
  const todaySessions = data.sessions.filter((s) => s.date === today && s.status === 'SCHEDULED').map((s) => ({ ...s, cls: data.classes.find((c) => c.id === s.classId)! })).filter((s) => s.cls?.status === 'OPEN').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcomingBookings = data.bookings.filter((b) => b.date === today && b.status === 'CONFIRMED' && b.endTime >= dayjs().format('HH:mm')).sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 8);

  return (
    <Page title="Quầy lễ tân" subtitle={`${DAY_NAMES[dow]}, ${dayjs().format('DD/MM/YYYY')}`} extra={
      <Space>
        <Button onClick={() => navigate('/receptionist/register-member')}>Đăng ký thành viên</Button>
        <Button icon={<ShopOutlined />} onClick={() => navigate('/receptionist/counter')}>Đơn tại quầy</Button>
        <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/receptionist/check-in')}>Check-in</Button>
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Check-in hôm nay" value={todayCheckIns.length} icon={<LoginOutlined />} color="#0f4d34" onClick={() => navigate('/receptionist/check-in')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Thu tại quầy hôm nay" value={fmtMoney(counterRevenue)} icon={<DollarOutlined />} color="#16a34a" hint={`Tổng cả online ${fmtMoney(todayRevenue)} · ${todayOrders.length} HĐ`} onClick={() => navigate('/receptionist/orders')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Gói sắp hết hạn" value={expiring.length} icon={<WarningOutlined />} color="#f59e0b" hint="trong 7 ngày tới" onClick={() => navigate('/receptionist/subscriptions')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Yêu cầu chờ xử lý" value={openSupport.length} icon={<CustomerServiceOutlined />} color="#dc2626" onClick={() => navigate('/receptionist/support')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <Card title="Buổi học hôm nay">
            <Table size="middle" pagination={false} rowKey="id" dataSource={todaySessions} columns={[
              { title: 'Giờ', render: (_, r) => <b className="sc-nowrap">{r.startTime} – {r.endTime}</b> },
              { title: 'Lớp', render: (_, r) => r.cls.name },
              { title: 'Facility', render: (_, r) => <Tag>{data.rooms.find((x) => x.id === r.roomId)?.name}</Tag> },
              { title: 'HLV', render: (_, r) => nameOf(r.cls.coachId) },
            ]} locale={{ emptyText: 'Hôm nay không có lớp' }} />
          </Card>
          <Card title={<span><FieldTimeOutlined /> Booking sắp tới hôm nay</span>} style={{ marginTop: 16 }} extra={<a onClick={() => navigate('/receptionist/courts')}>Lưới sân</a>}>
            <Table size="small" pagination={false} rowKey="id" dataSource={upcomingBookings} columns={[
              { title: 'Giờ', render: (_, b) => <b className="sc-nowrap">{b.startTime}–{b.endTime}</b> },
              { title: 'Facility', render: (_, b) => data.rooms.find((r) => r.id === b.roomId)?.name },
              { title: 'Khách', render: (_, b) => b.memberId ? nameOf(b.memberId) : <span><Tag color="gold" style={{ margin: 0 }}>Guest</Tag> {b.guestName}</span> },
              { title: 'Giá', dataIndex: 'price', align: 'right', render: (v, b) => <span className="sc-nowrap">{fmtMoney(v)} {b.benefitKind && <StatusTag value={b.benefitKind} />}</span> },
            ]} locale={{ emptyText: 'Không còn booking hôm nay' }} />
          </Card>
        </Col>
        <Col xs={24} xl={11}>
          <Card title="Thành viên sắp hết hạn gói" extra={<a onClick={() => navigate('/receptionist/subscriptions')}>Gia hạn</a>}>
            <List dataSource={expiring} renderItem={(u) => { const s = activeSubscription(u.id); return (
              <List.Item actions={[s?.autoRenew ? <Tag color="green">auto-renew · ví {fmtMoney(u.walletBalance ?? 0)}</Tag> : <Button size="small" onClick={() => navigate(`/receptionist/subscriptions?member=${u.id}`)}>Gia hạn</Button>]}>
                <List.Item.Meta avatar={<Avatar style={{ background: '#f9e6dd', color: '#c94a1e', fontWeight: 600 }}>{u.fullName.split(' ').pop()?.[0]}</Avatar>} title={u.fullName} description={`${u.phone} · hết hạn ${dayjs(s?.endDate).format('DD/MM/YYYY')}`} />
              </List.Item>
            ); }} locale={{ emptyText: 'Không có gói sắp hết hạn' }} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
