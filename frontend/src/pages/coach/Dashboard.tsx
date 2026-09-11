import { Button, Card, Col, List, Progress, Row, Table, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, CheckSquareOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import { DAY_NAMES, useApp } from '../../store/AppContext';

export default function CoachDashboard() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const myClasses = data.classes.filter((c) => c.coachId === me.id && c.status === 'OPEN');
  const ids = myClasses.map((c) => c.id);
  const students = new Set(data.enrollments.filter((e) => ids.includes(e.classId) && e.status === 'ACTIVE').map((e) => e.memberId));
  const dow = ((dayjs().day() + 6) % 7) + 1;
  const today = data.schedules.filter((s) => ids.includes(s.classId) && s.dayOfWeek === dow).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const sessionsThisWeek = data.sessions.filter((s) => ids.includes(s.classId) && dayjs(s.date).isAfter(dayjs().subtract(7, 'day')));

  return (
    <Page title={`Chào HLV ${me.fullName.split(' ').pop()} 💪`} subtitle={`${DAY_NAMES[dow]}, ${dayjs().format('DD/MM/YYYY')}`} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Lớp phụ trách" value={myClasses.length} icon={<BookOutlined />} color="#0f4d34" onClick={() => navigate('/coach/classes')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Học viên" value={students.size} icon={<TeamOutlined />} color="#16a34a" /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi dạy hôm nay" value={today.length} icon={<CalendarOutlined />} color="#c94a1e" onClick={() => navigate('/coach/schedule')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi đã điểm danh" value={sessionsThisWeek.length} icon={<CheckSquareOutlined />} color="#9333ea" hint="7 ngày qua" onClick={() => navigate('/coach/attendance')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Lịch dạy hôm nay" extra={<a onClick={() => navigate('/coach/schedule')}>Cả tuần</a>}>
            <Table size="middle" pagination={false} rowKey="id" dataSource={today} columns={[
              { title: 'Giờ', render: (_, r) => <b>{r.startTime} – {r.endTime}</b> },
              { title: 'Lớp', render: (_, r) => myClasses.find((c) => c.id === r.classId)?.name },
              { title: 'Phòng', render: (_, r) => <Tag>{data.rooms.find((x) => x.id === myClasses.find((c) => c.id === r.classId)?.roomId)?.name}</Tag> },
              { title: '', render: (_, r) => <Button size="small" type="primary" onClick={() => navigate(`/coach/attendance?class=${r.classId}`)}>Điểm danh</Button> },
            ]} locale={{ emptyText: 'Hôm nay không có lịch dạy' }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Lớp phụ trách">
            <List dataSource={myClasses} renderItem={(c) => {
              const n = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ACTIVE').length;
              return (
                <List.Item actions={[<a onClick={() => navigate(`/coach/classes/${c.id}`)}>Xem</a>]}>
                  <List.Item.Meta title={<b>{c.name}</b>} description={<div><div style={{ fontSize: 12, marginBottom: 4 }}>{data.schedules.filter((s) => s.classId === c.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(' · ')}</div><Progress percent={Math.round((n / c.capacity) * 100)} size="small" format={() => `${n}/${c.capacity}`} style={{ maxWidth: 260 }} /></div>} />
                </List.Item>
              );
            }} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
