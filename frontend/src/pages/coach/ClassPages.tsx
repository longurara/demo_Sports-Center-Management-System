import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, InputNumber, List, Modal, Popconfirm, Progress, Rate, Row, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import SportTag from '../../components/SportTag';
import BodyMetricsChart from '../../components/BodyMetricsChart';
import WeekTimetable from '../../components/WeekTimetable';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { activeCoachClasses, classPhase, coachConflict, coachSportIds, enrolledCount } from '../../utils/classes';
import type { Session } from '../../types';

export function CoachSchedule() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const ids = data.classes.filter((c) => c.coachId === currentUser!.id && c.status !== 'CANCELLED').map((c) => c.id);
  return (
    <Page title="Lịch dạy" subtitle="Buổi học thật của các lớp bạn phụ trách (đã tính dời / đổi phòng / hủy buổi)">
      <WeekTimetable sessions={data.sessions.filter((s) => ids.includes(s.classId))} onClick={(id) => navigate(`/coach/classes/${id}`)} />
    </Page>
  );
}

export function CoachClasses() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const mine = data.classes.filter((c) => c.coachId === currentUser!.id).map((c) => ({ ...c, phase: classPhase(c) })).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return (
    <Page title="Lớp phụ trách" subtitle="Lớp bạn đang là HLV hiện tại (classes.coach_id)">
      <Table rowKey="id" dataSource={mine} columns={[
        { title: 'Lớp', dataIndex: 'name', render: (v, r) => <a onClick={() => navigate(`/coach/classes/${r.id}`)}>{v}</a> },
        { title: 'Bộ môn', render: (_, r) => <SportTag id={r.sportId} /> },
        { title: 'Lịch', render: (_, r) => data.schedules.filter((s) => s.classId === r.id).map((s) => <Tag key={s.id}>{DAY_NAMES[s.dayOfWeek]} {s.startTime}</Tag>) },
        { title: 'Thời gian', render: (_, r) => <span className="sc-nowrap">{dayjs(r.startDate).format('DD/MM')} → {dayjs(r.endDate).format('DD/MM/YY')}</span> },
        { title: 'Học viên', render: (_, r) => `${enrolledCount(data, r.id)}/${r.capacity}` },
        { title: 'Trạng thái', dataIndex: 'phase', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => navigate(`/coach/classes/${r.id}`)}>Chi tiết</Button>{(r.phase === 'ONGOING' || r.phase === 'OPEN') && <Button size="small" type="primary" onClick={() => navigate(`/coach/attendance?class=${r.id}`)}>Điểm danh</Button>}</Space> },
      ]} />
    </Page>
  );
}

/** Lớp cần HLV (UC_2.13, BR_2.14): chỉ bộ môn đã duyệt, không trùng lịch; đăng ký → PENDING, Manager chọn. */
export function OpenClasses() {
  const { data, currentUser, add, update, notify, log, nameOf } = useApp();
  const me = currentUser!;
  const mySports = coachSportIds(data, me.id);
  const list = data.classes.filter((c) => (c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL') && (!c.coachId || c.coachId === me.id)).map((c) => ({ ...c, reg: data.coachRegistrations.find((r) => r.classId === c.id && r.coachId === me.id && (r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'MANAGER_ASSIGNED')), eligible: mySports.includes(c.sportId), conflict: coachConflict(data, me.id, c.id) }));

  const register = (classId: string) => {
    const c = data.classes.find((x) => x.id === classId)!;
    const r = add('coachRegistrations', { classId, coachId: me.id, status: 'PENDING', createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    if (c.status === 'DRAFT') update('classes', classId, { status: 'PENDING_APPROVAL' });
    data.users.filter((u) => u.role === 'MANAGER').forEach((u) => notify(u.id, 'HLV đăng ký dạy lớp', `${me.fullName} đăng ký dạy lớp ${c.name}.`));
    log('REGISTER_TEACH', 'ClassCoachRegistration', r.id, `${me.fullName} đăng ký dạy ${c.name}`);
    message.success('Đã đăng ký, chờ Manager chọn');
  };
  const withdrawReg = (regId: string) => { update('coachRegistrations', regId, { status: 'WITHDRAWN', reviewedAt: dayjs().format('YYYY-MM-DD HH:mm') }); message.success('Đã rút đăng ký'); };

  return (
    <Page title="Lớp cần HLV" subtitle={`Bộ môn đã duyệt: ${mySports.map((id) => data.sports.find((s) => s.id === id)?.name).join(', ') || 'chưa có'} — chỉ hiện lớp DRAFT / chờ duyệt chưa có HLV`}>
      {!mySports.length && <Alert type="warning" showIcon style={{ marginBottom: 12 }} title="Bạn chưa có chuyên môn được duyệt — đăng ký ở mục Chuyên môn trước." />}
      <Table rowKey="id" dataSource={list} pagination={false} columns={[
        { title: 'Lớp', render: (_, c) => <><b>{c.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{data.courses.find((x) => x.id === c.courseId)?.name} · {fmtMoney(data.courses.find((x) => x.id === c.courseId)?.price ?? 0)}</div></> },
        { title: 'Bộ môn', render: (_, c) => <SportTag id={c.sportId} /> },
        { title: 'Lịch', render: (_, c) => <><Space wrap size={[4, 4]}>{data.schedules.filter((s) => s.classId === c.id).map((s) => <Tag key={s.id} style={{ margin: 0 }}>{DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T')} {s.startTime}–{s.endTime}</Tag>)}</Space><div style={{ fontSize: 12, color: '#7a776f' }}>{dayjs(c.startDate).format('DD/MM')} → {dayjs(c.endDate).format('DD/MM/YY')} · {data.rooms.find((r) => r.id === c.roomId)?.name}</div></> },
        { title: 'Trạng thái lớp', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
        { title: 'HLV hiện tại', render: (_, c) => c.coachId ? nameOf(c.coachId) : <span style={{ color: '#fa8c16' }}>Chưa có · {data.coachRegistrations.filter((r) => r.classId === c.id && r.status === 'PENDING').length} đăng ký</span> },
        { title: '', render: (_, c) => c.reg ? <Space><StatusTag value={c.reg.status} />{c.reg.status === 'PENDING' && <Popconfirm title="Rút đăng ký?" onConfirm={() => withdrawReg(c.reg!.id)}><Button size="small">Rút</Button></Popconfirm>}</Space>
          : !c.eligible ? <span style={{ fontSize: 12, color: '#9a968c' }}>Chưa duyệt bộ môn này</span>
          : c.conflict ? <span style={{ fontSize: 12, color: '#dc2626' }}>Trùng giờ lớp "{c.conflict.other.name}"</span>
          : <Button size="small" type="primary" onClick={() => register(c.id)}>Đăng ký dạy</Button> },
      ]} />
    </Page>
  );
}

export function CoachClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, currentUser, userById, add, update, notify, log, nameOf } = useApp();
  const me = currentUser!;
  const [noteFor, setNoteFor] = useState<Session | null>(null);
  const [evalFor, setEvalFor] = useState<Session | null>(null);
  const [noteForm] = Form.useForm();
  const [evalForm] = Form.useForm();
  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const isMine = c.coachId === me.id;
  const phase = classPhase(c);
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const sessions = data.sessions.filter((s) => s.classId === c.id).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const done = sessions.filter((s) => s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < now);
  const students = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED').map((e) => {
    const u = userById(e.memberId)!;
    const att = data.attendances.filter((a) => a.memberId === u.id && done.some((s) => s.id === a.sessionId));
    const present = att.filter((a) => a.status !== 'ABSENT').length;
    return { ...u, present, total: done.length, rate: done.length ? Math.round((present / done.length) * 100) : 0 };
  });
  const avg = students.length ? Math.round(students.reduce((s, x) => s + x.rate, 0) / students.length) : 0;
  const noteOf = (sid: string) => data.sessionNotes.find((n) => n.sessionId === sid);

  /** Coach rút khỏi lớp OPEN → PENDING_APPROVAL không coach, notify member (BR_2.16). ONGOING: không tự rút. */
  const withdraw = () => {
    update('classes', c.id, { coachId: undefined, status: 'PENDING_APPROVAL' });
    const reg = data.coachRegistrations.find((r) => r.classId === c.id && r.coachId === me.id && (r.status === 'APPROVED' || r.status === 'MANAGER_ASSIGNED'));
    if (reg) update('coachRegistrations', reg.id, { status: 'WITHDRAWN', reviewedAt: now });
    students.forEach((u) => notify(u.id, 'Lớp đang tìm HLV thay thế', `Lớp ${c.name}: HLV ${me.fullName} không tiếp tục phụ trách. Trung tâm đang tìm HLV mới, lịch học giữ nguyên.`));
    data.users.filter((u) => u.role === 'MANAGER').forEach((u) => notify(u.id, 'HLV rút khỏi lớp', `${me.fullName} rút khỏi lớp ${c.name} — cần phân công HLV mới.`));
    log('COACH_WITHDRAW', 'Class', c.id, `${me.fullName} rút khỏi lớp ${c.name} → PENDING_APPROVAL`);
    message.success('Đã rút khỏi lớp, Manager sẽ phân công HLV mới'); navigate('/coach/classes');
  };

  const saveNote = (v: { title: string; content: string; attachments?: string }) => {
    if (!noteFor) return;
    const ex = noteOf(noteFor.id);
    const payload = { title: v.title, content: v.content, attachments: (v.attachments ?? '').split(',').map((x) => x.trim()).filter(Boolean) };
    if (ex) update('sessionNotes', ex.id, payload);
    else {
      const n = add('sessionNotes', { ...payload, sessionId: noteFor.id, coachId: me.id, createdAt: now });
      students.forEach((u) => notify(u.id, 'Nội dung buổi học mới', `${c.name} — ${dayjs(noteFor.date).format('DD/MM')}: ${v.title}`));
      log('CREATE_SESSION_NOTE', 'SessionNote', n.id, `Session note lớp ${c.name} buổi ${dayjs(noteFor.date).format('DD/MM')}`);
    }
    message.success('Đã lưu session note'); setNoteFor(null);
  };
  const saveEval = (v: { memberId: string; rating: number; comment: string }) => {
    if (!evalFor) return;
    const ex = data.progressReviews.find((r) => r.sessionId === evalFor.id && r.memberId === v.memberId && !r.deletedAt);
    if (ex) update('progressReviews', ex.id, { deletedAt: now }); // soft delete bản cũ, tạo bản mới (BR_4.5)
    add('progressReviews', { sessionId: evalFor.id, memberId: v.memberId, coachId: me.id, rating: v.rating, comment: v.comment, createdAt: now });
    notify(v.memberId, 'HLV gửi đánh giá', `${c.name} — buổi ${dayjs(evalFor.date).format('DD/MM')}: ${v.rating}★ · ${v.comment}`);
    message.success('Đã gửi đánh giá'); setEvalFor(null); evalForm.resetFields();
  };

  return (
    <Page title={c.name} subtitle={`${data.sports.find((s) => s.id === c.sportId)?.name} · ${data.rooms.find((r) => r.id === c.roomId)?.name} · ${dayjs(c.startDate).format('DD/MM')} → ${dayjs(c.endDate).format('DD/MM/YYYY')}`}
      extra={<Space wrap><StatusTag value={phase} /><Button onClick={() => navigate('/coach/classes')}>Quay lại</Button>
        {isMine && phase === 'OPEN' && <Popconfirm title="Rút khỏi lớp? Lớp về chờ duyệt không HLV, học viên được thông báo (không hoàn tự động)." onConfirm={withdraw}><Button danger>Rút khỏi lớp</Button></Popconfirm>}
        {isMine && phase === 'ONGOING' && <Button disabled title="Lớp đang học: chỉ Manager đổi HLV">Không thể rút (đang học)</Button>}
        {isMine && (phase === 'ONGOING' || phase === 'OPEN') && <Button type="primary" onClick={() => navigate(`/coach/attendance?class=${c.id}`)}>Điểm danh</Button>}</Space>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Descriptions column={1} size="small" title="Thống kê">
          <Descriptions.Item label="Buổi đã dạy">{done.length}/{sessions.filter((s) => s.status === 'SCHEDULED').length}</Descriptions.Item>
          <Descriptions.Item label="Học viên">{students.length}/{c.capacity} (min {c.minStudents})</Descriptions.Item>
          <Descriptions.Item label="Chuyên cần TB"><Progress percent={avg} size="small" /></Descriptions.Item>
        </Descriptions></Card></Col>
        <Col xs={24} md={16}><Card title="Lịch tuần">{data.schedules.filter((s) => s.classId === c.id).map((s) => <Tag key={s.id} color="blue">{DAY_NAMES[s.dayOfWeek]} {s.startTime}-{s.endTime}</Tag>)}<div style={{ fontSize: 12, color: '#9a968c', marginTop: 8 }}>Buổi có thể bị dời / đổi phòng — xem tab Buổi học.</div></Card></Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'students', label: `Học viên (${students.length})`, children: (
            <Table rowKey="id" pagination={false} dataSource={students} columns={[
              { title: 'Học viên', dataIndex: 'fullName', render: (_, r) => <a onClick={() => navigate(`/coach/students/${r.id}`)}><UserCell user={r} sub={r.phone} /></a> },
              { title: 'Mục tiêu', dataIndex: 'goal' },
              { title: 'Sức khỏe', dataIndex: 'healthNote', render: (v) => v ? <span style={{ color: '#b45309' }}>{v}</span> : '—' },
              { title: 'Chuyên cần', render: (_, r) => <span>{r.present}/{r.total} <Progress percent={r.rate} size="small" style={{ width: 100 }} /></span> },
              { title: '', render: (_, r) => <Button size="small" onClick={() => navigate(`/coach/students/${r.id}`)}>Hồ sơ</Button> },
            ]} />
          ) },
          { key: 'sessions', label: `Buổi học & session notes (${sessions.length})`, children: (
            <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={sessions} columns={[
              { title: '#', width: 40, render: (_, __, i) => i + 1 },
              { title: 'Ngày', render: (_, s) => <span className="sc-nowrap"><b>{dayjs(s.date).format('DD/MM/YYYY')}</b> {s.startTime}–{s.endTime}</span> },
              { title: 'Facility', render: (_, s) => data.rooms.find((r) => r.id === s.roomId)?.name },
              { title: 'Trạng thái', render: (_, s) => s.status === 'CANCELLED' ? <StatusTag value="CANCELLED" /> : `${s.date} ${s.endTime}` < now ? <Tag>Đã dạy</Tag> : <Tag color="blue">Sắp tới</Tag> },
              { title: 'Điểm danh', render: (_, s) => { const a = data.attendances.filter((x) => x.sessionId === s.id); return a.length ? `${a.filter((x) => x.status !== 'ABSENT').length}/${a.length}` : '—'; } },
              { title: 'Session note', render: (_, s) => { const n = noteOf(s.id); return n ? <span><b>{n.title}</b>{n.attachments.length > 0 && <Tag icon={<PaperClipOutlined />} style={{ marginLeft: 6 }}>{n.attachments.length}</Tag>}</span> : <span style={{ color: '#9a968c' }}>—</span>; } },
              { title: '', render: (_, s) => isMine && s.status === 'SCHEDULED' && (
                <Space>
                  <Button size="small" onClick={() => { const n = noteOf(s.id); noteForm.setFieldsValue({ title: n?.title ?? '', content: n?.content ?? '', attachments: n?.attachments.join(', ') ?? '' }); setNoteFor(s); }}>{noteOf(s.id) ? 'Sửa note' : 'Ghi note'}</Button>
                  {`${s.date} ${s.startTime}` <= now && <Button size="small" onClick={() => { evalForm.resetFields(); setEvalFor(s); }}>Đánh giá HV</Button>}
                </Space>
              ) },
            ]} />
          ) },
          { key: 'evals', label: 'Đánh giá đã gửi', children: (
            <List dataSource={data.progressReviews.filter((r) => !r.deletedAt && sessions.some((s) => s.id === r.sessionId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))} locale={{ emptyText: 'Chưa có đánh giá' }} renderItem={(r) => { const s = sessions.find((x) => x.id === r.sessionId)!; return (
              <List.Item><List.Item.Meta title={<Space><Tag color="blue">{dayjs(s.date).format('DD/MM')}</Tag><b>{nameOf(r.memberId)}</b><Rate disabled value={r.rating} /></Space>} description={`${r.comment} · ${r.createdAt}`} /></List.Item>
            ); }} />
          ) },
        ]} />
      </Card>
      <Modal title={`Session note — ${noteFor ? dayjs(noteFor.date).format('DD/MM') + ' ' + noteFor.startTime : ''}`} open={!!noteFor} onCancel={() => setNoteFor(null)} onOk={() => noteForm.submit()} okText="Lưu & thông báo học viên">
        <Form form={noteForm} layout="vertical" onFinish={saveNote}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="Nội dung buổi học / bài tập" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item>
          <Form.Item name="attachments" label="File đính kèm (tên file, cách nhau dấu phẩy — giả lập)"><Input placeholder="giao-an.pdf, video.mp4" /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Mỗi buổi tối đa 1 session note (BR_4.4), áp dụng cho cả lớp.</div>
      </Modal>
      <Modal title={`Đánh giá học viên — buổi ${evalFor ? dayjs(evalFor.date).format('DD/MM') : ''}`} open={!!evalFor} onCancel={() => setEvalFor(null)} onOk={() => evalForm.submit()} okText="Gửi đánh giá">
        <Form form={evalForm} layout="vertical" onFinish={saveEval} initialValues={{ rating: 4 }}>
          <Form.Item name="memberId" label="Học viên" rules={[{ required: true }]}><Select options={students.map((u) => ({ value: u.id, label: u.fullName }))} /></Form.Item>
          <Form.Item name="rating" label="Rating" rules={[{ required: true }]}><Rate /></Form.Item>
          <Form.Item name="comment" label="Nhận xét" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Mỗi (buổi, học viên) một đánh giá đang hoạt động; sửa = xóa mềm bản cũ và tạo bản mới (BR_4.5).</div>
      </Modal>
    </Page>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, add, currentUser } = useApp();
  const [bmOpen, setBmOpen] = useState(false);
  const [bmForm] = Form.useForm();
  const u = userById(id);
  if (!u) return <Page title="Không tìm thấy học viên"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  // Coach chỉ xem member trong lớp mình (UC_1.6)
  const myClassIds = activeCoachClasses(data, currentUser!.id).map((c) => c.id);
  const inMyClass = data.enrollments.some((e) => e.memberId === u.id && e.status === 'ENROLLED' && myClassIds.includes(e.classId));
  if (!inMyClass) return <Page title="Không có quyền xem"><Alert type="warning" showIcon title="Coach chỉ xem được học viên trong lớp mình phụ trách." /><Button style={{ marginTop: 12 }} onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, session: data.sessions.find((s) => s.id === r.sessionId)! })).filter((r) => r.session).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const reviews = data.progressReviews.filter((r) => r.memberId === u.id && !r.deletedAt);
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
              <Descriptions.Item label="Liên hệ khẩn cấp">{u.emergencyContact ?? '—'}</Descriptions.Item>
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
          <Card title="Đánh giá theo buổi" style={{ marginTop: 16 }}>
            <List dataSource={reviews} renderItem={(r) => <List.Item><List.Item.Meta title={<Space><Tag color="blue">{dayjs(data.sessions.find((s) => s.id === r.sessionId)?.date).format('DD/MM')}</Tag><Rate disabled value={r.rating} /></Space>} description={`${r.comment} — ${nameOf(r.coachId)}, ${r.createdAt}`} /></List.Item>} />
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
