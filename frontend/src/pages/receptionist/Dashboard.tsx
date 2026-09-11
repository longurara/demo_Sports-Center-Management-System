import { Avatar, Button, Card, Col, List, Row, Space, Table, Tag } from 'antd';
import { CustomerServiceOutlined, DollarOutlined, LoginOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';

export default function ReceptionistDashboard() {
  const { data, nameOf, membershipStatus, activeSubscription } = useApp();
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const todayCheckIns = data.checkIns.filter((c) => c.time.startsWith(today));
  const todayRevenue = data.payments.filter((p) => p.paidAt.startsWith(today)).reduce((s, p) => s + p.amount, 0);
  const expiring = data.users.filter((u) => u.role === 'MEMBER' && membershipStatus(u.id) === 'EXPIRING');
  const openSupport = data.supportRequests.filter((r) => r.status !== 'RESOLVED');
  const dow = ((dayjs().day() + 6) % 7) + 1;
  const todayClasses = data.schedules.filter((s) => s.dayOfWeek === dow).map((s) => ({ ...s, cls: data.classes.find((c) => c.id === s.classId)! })).filter((s) => s.cls?.status === 'OPEN').sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Page title="Quầy lễ tân" subtitle={`${DAY_NAMES[dow]}, ${dayjs().format('DD/MM/YYYY')}`} extra={
      <Space>
        <Button onClick={() => navigate('/receptionist/register-member')}>Đăng ký thành viên</Button>
        <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/receptionist/check-in')}>Check-in</Button>
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Check-in hôm nay" value={todayCheckIns.length} icon={<LoginOutlined />} color="#0f4d34" onClick={() => navigate('/receptionist/check-in')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Doanh thu hôm nay" value={fmtMoney(todayRevenue)} icon={<DollarOutlined />} color="#16a34a" onClick={() => navigate('/receptionist/payments')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Gói sắp hết hạn" value={expiring.length} icon={<WarningOutlined />} color="#f59e0b" hint="trong 7 ngày tới" onClick={() => navigate('/receptionist/subscriptions')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Yêu cầu chờ xử lý" value={openSupport.length} icon={<CustomerServiceOutlined />} color="#dc2626" onClick={() => navigate('/receptionist/support')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <Card title="Lớp học hôm nay">
            <Table size="middle" pagination={false} rowKey="id" dataSource={todayClasses} columns={[
              { title: 'Giờ', render: (_, r) => <b>{r.startTime} – {r.endTime}</b> },
              { title: 'Lớp', render: (_, r) => r.cls.name },
              { title: 'Phòng', render: (_, r) => <Tag>{data.rooms.find((x) => x.id === r.cls.roomId)?.name}</Tag> },
              { title: 'HLV', render: (_, r) => nameOf(r.cls.coachId) },
            ]} locale={{ emptyText: 'Hôm nay không có lớp' }} />
          </Card>
        </Col>
        <Col xs={24} xl={11}>
          <Card title="Thành viên sắp hết hạn gói" extra={<a onClick={() => navigate('/receptionist/subscriptions')}>Gia hạn</a>}>
            <List dataSource={expiring} renderItem={(u) => (
              <List.Item actions={[<Button size="small" onClick={() => navigate(`/receptionist/subscriptions?member=${u.id}`)}>Gia hạn</Button>]}>
                <List.Item.Meta avatar={<Avatar style={{ background: '#f9e6dd', color: '#c94a1e', fontWeight: 600 }}>{u.fullName.split(' ').pop()?.[0]}</Avatar>} title={u.fullName} description={`${u.phone} · hết hạn ${dayjs(activeSubscription(u.id)?.endDate).format('DD/MM/YYYY')}`} />
              </List.Item>
            )} locale={{ emptyText: 'Không có gói sắp hết hạn' }} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
