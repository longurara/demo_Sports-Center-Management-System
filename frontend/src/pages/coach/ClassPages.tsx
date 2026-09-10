import { Button, Card, Col, Descriptions, List, Progress, Rate, Row, Space, Table, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import BodyMetricsChart from '../../components/BodyMetricsChart';
import { useState } from 'react';
import { Form, InputNumber, Modal, message } from 'antd';
import dayjs from 'dayjs';
import WeekTimetable from '../../components/WeekTimetable';
import { DAY_NAMES, useApp } from '../../store/AppContext';

export function CoachSchedule() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const ids = data.classes.filter((c) => c.coachId === currentUser!.id && c.status === 'OPEN').map((c) => c.id);
  return (
    <Page title="Lịch dạy" subtitle="Thời khóa biểu tuần của các lớp bạn phụ trách">
      <WeekTimetable schedules={data.schedules.filter((s) => ids.includes(s.classId))} onClick={(id) => navigate(`/coach/classes/${id}`)} />
    </Page>
  );
}

export function CoachClasses() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const mine = data.classes.filter((c) => c.coachId === currentUser!.id);
  return (
    <Page title="Lớp phụ trách">
      <Table rowKey="id" dataSource={mine} columns={[
        { title: 'Lớp', dataIndex: 'name', render: (v, r) => <a onClick={() => navigate(`/coach/classes/${r.id}`)}>{v}</a> },
        { title: 'Bộ môn', render: (_, r) => data.sports.find((s) => s.id === r.sportId)?.name },
        { title: 'Lịch', render: (_, r) => data.schedules.filter((s) => s.classId === r.id).map((s) => <Tag key={s.id}>{DAY_NAMES[s.dayOfWeek]} {s.startTime}</Tag>) },
        { title: 'Học viên', render: (_, r) => `${data.enrollments.filter((e) => e.classId === r.id && e.status === 'ACTIVE').length}/${r.capacity}` },
        { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => navigate(`/coach/classes/${r.id}`)}>Danh sách HV</Button><Button size="small" type="primary" onClick={() => navigate(`/coach/attendance?class=${r.id}`)}>Điểm danh</Button></Space> },
      ]} />
    </Page>
  );
}

export function CoachClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById } = useApp();
  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const sessions = data.sessions.filter((s) => s.classId === c.id);
  const students = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ACTIVE').map((e) => {
    const u = userById(e.memberId)!;
    const att = data.attendances.filter((a) => a.memberId === u.id && sessions.some((s) => s.id === a.sessionId));
    const present = att.filter((a) => a.status !== 'ABSENT').length;
    return { ...u, present, total: sessions.length, rate: sessions.length ? Math.round((present / sessions.length) * 100) : 0 };
  });
  const avg = students.length ? Math.round(students.reduce((s, x) => s + x.rate, 0) / students.length) : 0;

  return (
    <Page title={c.name} subtitle={`${data.sports.find((s) => s.id === c.sportId)?.name} · ${data.rooms.find((r) => r.id === c.roomId)?.name}`} extra={<Space><Button onClick={() => navigate('/coach/classes')}>Quay lại</Button><Button type="primary" onClick={() => navigate(`/coach/attendance?class=${c.id}`)}>Điểm danh buổi mới</Button></Space>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Descriptions column={1} size="small" title="Thống kê chuyên cần">
          <Descriptions.Item label="Số buổi đã dạy">{sessions.length}</Descriptions.Item>
          <Descriptions.Item label="Học viên">{students.length}/{c.capacity}</Descriptions.Item>
          <Descriptions.Item label="Chuyên cần TB"><Progress percent={avg} size="small" /></Descriptions.Item>
        </Descriptions></Card></Col>
        <Col xs={24} md={16}><Card title="Lịch học">{data.schedules.filter((s) => s.classId === c.id).map((s) => <Tag key={s.id} color="blue">{DAY_NAMES[s.dayOfWeek]} {s.startTime}-{s.endTime}</Tag>)}</Card></Col>
      </Row>
      <Card title="Danh sách học viên">
        <Table rowKey="id" pagination={false} dataSource={students} columns={[
          { title: 'Học viên', dataIndex: 'fullName', render: (_, r) => <a onClick={() => navigate(`/coach/students/${r.id}`)}><UserCell user={r} sub={r.phone} /></a> },
          { title: 'Mục tiêu', dataIndex: 'goal' },
          { title: 'Trình độ', dataIndex: 'level', render: (v) => <StatusTag value={v} /> },
          { title: 'Chuyên cần', render: (_, r) => <span>{r.present}/{r.total} <Progress percent={r.rate} size="small" style={{ width: 100 }} /></span> },
          { title: '', render: (_, r) => <Button size="small" onClick={() => navigate(`/coach/students/${r.id}`)}>Hồ sơ</Button> },
        ]} />
      </Card>
    </Page>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, add } = useApp();
  const [bmOpen, setBmOpen] = useState(false);
  const [bmForm] = Form.useForm();
  const u = userById(id);
  if (!u) return <Page title="Không tìm thấy học viên"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, session: data.sessions.find((s) => s.id === r.sessionId)! })).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const reviews = data.progressReviews.filter((r) => r.memberId === u.id);
  const plans = data.trainingPlans.filter((p) => p.memberId === u.id);
  const att = data.attendances.filter((a) => a.memberId === u.id);

  return (
    <Page title={u.fullName} subtitle="Hồ sơ học viên" extra={<Space><Button onClick={() => navigate(-1)}>Quay lại</Button><Button onClick={() => navigate(`/coach/training-plans?member=${u.id}`)}>Tạo kế hoạch</Button><Button type="primary" onClick={() => navigate(`/coach/ai-suggest?member=${u.id}`)}>AI gợi ý bài tập</Button></Space>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="Thông tin & mục tiêu">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="SĐT">{u.phone}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{u.dob}</Descriptions.Item>
              <Descriptions.Item label="Giới tính"><StatusTag value={u.gender} /></Descriptions.Item>
              <Descriptions.Item label="Mục tiêu"><b>{u.goal}</b></Descriptions.Item>
              <Descriptions.Item label="Trình độ"><StatusTag value={u.level} /></Descriptions.Item>
              <Descriptions.Item label="Sức khỏe">{u.healthNote ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Chuyên cần">{att.filter((a) => a.status !== 'ABSENT').length}/{att.length} buổi</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Kế hoạch cá nhân" style={{ marginTop: 16 }}>
            <List dataSource={plans} renderItem={(p) => <List.Item><List.Item.Meta title={<Space>{p.title}<StatusTag value={p.source} /></Space>} description={<div style={{ whiteSpace: 'pre-line' }}>{p.content}</div>} /></List.Item>} locale={{ emptyText: 'Chưa có kế hoạch cá nhân' }} />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="Chỉ số cơ thể" extra={<Button size="small" onClick={() => setBmOpen(true)}>Ghi chỉ số mới</Button>} style={{ marginBottom: 16 }}>
            <BodyMetricsChart memberId={u.id} height={200} />
          </Card>
          <Card title="Lịch sử kết quả tập luyện">
            <Table size="small" rowKey="id" pagination={false} dataSource={results} columns={[{ title: 'Ngày', render: (_, r) => r.session.date }, { title: 'Chỉ số', dataIndex: 'metrics' }, { title: 'Nhận xét', dataIndex: 'note' }]} />
          </Card>
          <Card title="Đánh giá tiến độ" style={{ marginTop: 16 }}>
            <List dataSource={reviews} renderItem={(r) => <List.Item><List.Item.Meta title={<Rate disabled value={r.rating} />} description={`${r.comment} — ${nameOf(r.coachId)}, ${r.createdAt}`} /></List.Item>} />
          </Card>
        </Col>
      </Row>
      <Modal title="Ghi nhận chỉ số cơ thể" open={bmOpen} onCancel={() => setBmOpen(false)} onOk={() => bmForm.submit()} okText="Lưu">
        <Form form={bmForm} layout="vertical" onFinish={(v: { weight: number; bodyFat?: number }) => { add('bodyMetrics', { memberId: u.id, date: dayjs().format('YYYY-MM-DD'), weight: v.weight, bodyFat: v.bodyFat }); message.success('Đã lưu chỉ số'); setBmOpen(false); bmForm.resetFields(); }}>
          <Form.Item name="weight" label="Cân nặng (kg)" rules={[{ required: true }]}><InputNumber min={20} max={250} step={0.1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bodyFat" label="Tỷ lệ mỡ (%)"><InputNumber min={3} max={60} step={0.1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
