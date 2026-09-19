import { Alert, Button, Card, Col, List, Progress, Row, Table, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, CheckSquareOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, useApp } from '../../store/AppContext';
import { activeCoachClasses, classPhase, coachSportIds, enrolledCount } from '../../utils/classes';

export default function CoachDashboard() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const myClasses = activeCoachClasses(data, me.id);
  const ids = myClasses.map((c) => c.id);
  const today = dayjs().format('YYYY-MM-DD');
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const students = new Set(data.enrollments.filter((e) => ids.includes(e.classId) && e.status === 'ENROLLED').map((e) => e.memberId));
  const dow = ((dayjs().day() + 6) % 7) + 1;
  const todaySessions = data.sessions.filter((s) => ids.includes(s.classId) && s.date === today && s.status === 'SCHEDULED').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const pendingAtt = data.sessions.filter((s) => ids.includes(s.classId) && s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < now && !data.attendances.some((a) => a.sessionId === s.id)).length;
  const mySports = coachSportIds(data, me.id);
  const openForMe = data.classes.filter((c) => !c.coachId && (c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL') && mySports.includes(c.sportId) && !data.coachRegistrations.some((r) => r.classId === c.id && r.coachId === me.id && r.status === 'PENDING')).length;
  const pendingSpecs = data.coachSpecializations.filter((s) => s.coachId === me.id && s.status === 'PENDING').length;

  return (
    <Page title={`Chào HLV ${me.fullName.split(' ').pop()} 💪`} subtitle={`${DAY_NAMES[dow]}, ${dayjs().format('DD/MM/YYYY')} · chuyên môn: ${mySports.map((id) => data.sports.find((s) => s.id === id)?.name).join(', ') || 'chưa duyệt'}`} noCard>
      {openForMe > 0 && <Alert type="info" showIcon title={`${openForMe} lớp thuộc bộ môn của bạn đang cần HLV`} action={<Button size="small" onClick={() => navigate('/coach/open-classes')}>Xem & đăng ký</Button>} />}
      {pendingSpecs > 0 && <Alert type="warning" showIcon title={`${pendingSpecs} yêu cầu chuyên môn đang chờ Manager duyệt`} />}
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Lớp phụ trách" value={myClasses.length} icon={<BookOutlined />} color="#0f4d34" hint={`${myClasses.filter((c) => classPhase(c) === 'ONGOING').length} đang học`} onClick={() => navigate('/coach/classes')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Học viên" value={students.size} icon={<TeamOutlined />} color="#16a34a" /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi dạy hôm nay" value={todaySessions.length} icon={<CalendarOutlined />} color="#c94a1e" onClick={() => navigate('/coach/schedule')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi chưa điểm danh" value={pendingAtt} icon={<CheckSquareOutlined />} color="#9333ea" hint="đã diễn ra, chưa có bản ghi" onClick={() => navigate('/coach/attendance')} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Lịch dạy hôm nay" extra={<a onClick={() => navigate('/coach/schedule')}>Cả tuần</a>}>
            <Table size="middle" pagination={false} rowKey="id" dataSource={todaySessions} columns={[
              { title: 'Giờ', render: (_, r) => <b className="sc-nowrap">{r.startTime} – {r.endTime}</b> },
              { title: 'Lớp', render: (_, r) => myClasses.find((c) => c.id === r.classId)?.name },
              { title: 'Facility', render: (_, r) => <Tag>{data.rooms.find((x) => x.id === r.roomId)?.name}</Tag> },
              { title: '', render: (_, r) => <Button size="small" type="primary" onClick={() => navigate(`/coach/attendance?class=${r.classId}`)}>Điểm danh</Button> },
            ]} locale={{ emptyText: 'Hôm nay không có lịch dạy' }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Lớp phụ trách">
            <List dataSource={myClasses} renderItem={(c) => {
              const n = enrolledCount(data, c.id);
              return (
                <List.Item actions={[<StatusTag value={classPhase(c)} />, <a onClick={() => navigate(`/coach/classes/${c.id}`)}>Xem</a>]}>
                  <List.Item.Meta title={<b>{c.name}</b>} description={<div><div style={{ fontSize: 12, marginBottom: 4 }}>{data.schedules.filter((s) => s.classId === c.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(' · ')}</div><Progress percent={Math.round((n / c.capacity) * 100)} size="small" format={() => `${n}/${c.capacity}`} style={{ maxWidth: 260 }} /></div>} />
                </List.Item>
              );
            }} locale={{ emptyText: 'Chưa phụ trách lớp nào' }} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
