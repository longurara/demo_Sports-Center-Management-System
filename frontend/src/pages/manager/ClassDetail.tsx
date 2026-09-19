import { useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Form, Modal, Popconfirm, Progress, Row, Select, Space, Switch, Table, Tabs, Tag, TimePicker, message } from 'antd';
import { CalendarOutlined, DollarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import StatCard from '../../components/StatCard';
import UserCell from '../../components/UserCell';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { activeCoachClasses, classPhase, coachConflict, coachSportIds, courseOf, sessionSlotConflict } from '../../utils/classes';
import { bookableRooms, coachTimeConflict } from '../../utils/slots';
import type { Session } from '../../types';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, add, update, log, notify, nameOf, userById, cancelClass, cancelSession, recomputeClass } = useApp();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [assignForm] = Form.useForm();
  const [sessForm] = Form.useForm();
  const [warn, setWarn] = useState<string | null>(null);
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const phase = classPhase(c);
  const course = courseOf(data, c);
  const schedules = data.schedules.filter((s) => s.classId === c.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const students = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED');
  const cancelled = data.enrollments.filter((e) => e.classId === c.id && e.status === 'CANCELLED');
  const room = data.rooms.find((r) => r.id === c.roomId);
  const coach = userById(c.coachId);
  const sessions = data.sessions.filter((s) => s.classId === c.id).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const done = sessions.filter((s) => s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < now);
  const attOf = (sid: string) => data.attendances.filter((a) => a.sessionId === sid);
  const items = data.orderItems.filter((it) => it.type === 'COURSE_ENROLLMENT' && data.enrollments.some((e) => e.id === it.refId && e.classId === c.id)).map((it) => ({ ...it, order: data.orders.find((o) => o.id === it.orderId)! }));
  const revenue = items.reduce((s, it) => s + it.total - it.refundedAmount, 0);
  const regs = data.coachRegistrations.filter((r) => r.classId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fillRate = Math.round((students.length / c.capacity) * 100);

  /** Phân công / chọn 1 HLV: reject các PENDING còn lại, cập nhật classes.coach_id, kiểm tra chuyên môn + trùng lịch (UC_2.14, BR_2.15) */
  const assign = (coachId: string, fromRegistration?: string) => {
    if (!coachSportIds(data, coachId).includes(c.sportId)) { setWarn(`${nameOf(coachId)} chưa được duyệt chuyên môn ${data.sports.find((s) => s.id === c.sportId)?.name}`); return; }
    const cc = coachConflict(data, coachId, c.id);
    if (cc) { setWarn(`HLV ${nameOf(coachId)} trùng giờ với lớp "${cc.other.name}" (${dayjs(cc.session.date).format('DD/MM')} ${cc.session.startTime})`); return; }
    regs.filter((r) => r.status === 'PENDING').forEach((r) => update('coachRegistrations', r.id, { status: r.id === fromRegistration ? 'APPROVED' : 'REJECTED', reviewedAt: now }));
    if (!fromRegistration) add('coachRegistrations', { classId: c.id, coachId, status: 'MANAGER_ASSIGNED', createdAt: now, reviewedAt: now });
    update('classes', c.id, { coachId, status: c.status === 'DRAFT' ? 'PENDING_APPROVAL' : c.status });
    log('ASSIGN_COACH', 'Class', c.id, `${fromRegistration ? 'Chọn' : 'Phân công trực tiếp'} ${nameOf(coachId)} cho lớp ${c.name}`);
    notify(coachId, 'Được phân công lớp', `Bạn phụ trách lớp ${c.name} (${dayjs(c.startDate).format('DD/MM')} → ${dayjs(c.endDate).format('DD/MM')}).`);
    regs.filter((r) => r.status === 'PENDING' && r.coachId !== coachId).forEach((r) => notify(r.coachId, 'Đăng ký dạy lớp không được chọn', `Lớp ${c.name} đã có HLV khác.`));
    message.success('Đã phân công HLV'); setWarn(null); setAssignOpen(false);
  };
  const approve = () => { if (!c.coachId) { message.error('Cần đúng 1 HLV trước khi duyệt'); return; } update('classes', c.id, { status: 'OPEN' }); log('APPROVE_CLASS', 'Class', c.id, `Duyệt mở lớp ${c.name}`); notify(c.coachId, 'Lớp đã được duyệt mở', `Lớp ${c.name} đã OPEN.`); message.success('Lớp đã OPEN'); };
  const reject = () => { update('classes', c.id, { status: 'DRAFT' }); log('REJECT_CLASS', 'Class', c.id, `Từ chối mở lớp ${c.name} → DRAFT`); if (c.coachId) notify(c.coachId, 'Lớp bị từ chối mở', `Lớp ${c.name} chưa được duyệt.`); };

  /** Đổi facility / dời buổi (UC_2.5) — kiểm tra facility, HLV, và thông báo */
  const saveSession = (v: { roomId: string; date: dayjs.Dayjs; time: [dayjs.Dayjs, dayjs.Dayjs] }) => {
    if (!editSession) return;
    const next = { id: editSession.id, roomId: v.roomId, date: v.date.format('YYYY-MM-DD'), startTime: v.time[0].format('HH:mm'), endTime: v.time[1].format('HH:mm') };
    const cf = sessionSlotConflict(data, next);
    if (cf) { setWarn(cf); return; }
    if (c.coachId && coachTimeConflict(data, c.coachId, next.date, next.startTime, next.endTime, undefined, editSession.id)) { setWarn('HLV trùng giờ buổi khác'); return; }
    const moved = next.date !== editSession.date || next.startTime !== editSession.startTime;
    update('sessions', editSession.id, { ...next, note: moved ? `Dời từ ${dayjs(editSession.date).format('DD/MM')} ${editSession.startTime}` : `Đổi sang ${data.rooms.find((r) => r.id === v.roomId)?.name}` });
    recomputeClass(c.id);
    [...students.map((e) => e.memberId), c.coachId].filter(Boolean).forEach((uid) => notify(uid!, moved ? 'Buổi học dời lịch' : 'Buổi học đổi phòng', `${c.name}: buổi ${dayjs(editSession.date).format('DD/MM')} ${editSession.startTime} → ${dayjs(next.date).format('DD/MM')} ${next.startTime}–${next.endTime} tại ${data.rooms.find((r) => r.id === v.roomId)?.name}.`));
    log(moved ? 'MOVE_SESSION' : 'CHANGE_SESSION_ROOM', 'ClassSession', editSession.id, `${c.name}: ${dayjs(editSession.date).format('DD/MM')} ${editSession.startTime} → ${dayjs(next.date).format('DD/MM')} ${next.startTime} ${data.rooms.find((r) => r.id === v.roomId)?.name}`);
    message.success('Đã cập nhật buổi học và thông báo'); setWarn(null); setEditSession(null);
  };

  const coachOptions = data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE' && coachSportIds(data, u.id).includes(c.sportId)).map((u) => ({ value: u.id, label: `${u.fullName} — ${u.specialty ?? ''} (${activeCoachClasses(data, u.id).length} lớp)` }));

  return (
    <Page title={c.name} subtitle={`${course?.name} · ${room?.name} · ${dayjs(c.startDate).format('DD/MM/YYYY')} → ${dayjs(c.endDate).format('DD/MM/YYYY')} · ${sessions.filter((s) => s.status === 'SCHEDULED').length}/${course?.totalSessions} buổi`}
      extra={<Space wrap>
        <StatusTag value={phase} />
        {c.status === 'PENDING_APPROVAL' && <><Button type="primary" onClick={approve}>Duyệt mở lớp</Button><Popconfirm title="Từ chối → DRAFT?" onConfirm={reject}><Button>Từ chối</Button></Popconfirm></>}
        {c.status !== 'CANCELLED' && phase !== 'COMPLETED' && <Popconfirm title="Hủy lớp? Hoàn tiền theo BR_2.7b và thông báo HLV + học viên." onConfirm={() => { const r = cancelClass(c.id, 'Manager hủy lớp'); message.success(`Đã hủy, hoàn ${fmtMoney(r.refunded)} cho ${r.members} HV`); }}><Button danger>Hủy lớp</Button></Popconfirm>}
        <Button onClick={() => navigate('/manager/classes')}>Quay lại</Button>
      </Space>} noCard>
      {phase === 'OPEN' && students.length < c.minStudents && !c.minStudentsOverride && <Alert type="warning" showIcon title={`Sĩ số ${students.length}/${c.minStudents} tối thiểu — trước buổi đầu (${dayjs(c.startDate).format('DD/MM')}) nếu vẫn thiếu, cron sẽ hủy lớp + hoàn tiền (BR_2.20). Bật override để vẫn mở.`} />}
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Sĩ số" value={`${students.length}/${c.capacity}`} icon={<TeamOutlined />} color="#0f4d34" hint={`Tối thiểu ${c.minStudents} · lấp đầy ${fillRate}%`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi đã dạy" value={`${done.length}/${sessions.filter((s) => s.status === 'SCHEDULED').length}`} icon={<CalendarOutlined />} color="#9333ea" hint={`${sessions.filter((s) => s.status === 'CANCELLED').length} buổi hủy`} /></Col>
        <Col xs={12} xl={6}><StatCard title="HLV" value={coach ? coach.fullName.split(' ').slice(-2).join(' ') : '—'} icon={<UserOutlined />} color="#16a34a" hint={`${regs.filter((r) => r.status === 'PENDING').length} đăng ký chờ`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Doanh thu lớp" value={fmtMoney(revenue)} icon={<DollarOutlined />} color="#c94a1e" hint={`${items.length} dòng · học phí ${fmtMoney(course?.price ?? 0)}`} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="Huấn luyện viên hiện tại" extra={c.status !== 'CANCELLED' && phase !== 'COMPLETED' && <Button size="small" type="link" onClick={() => { assignForm.setFieldsValue({ coachId: c.coachId }); setWarn(null); setAssignOpen(true); }}>{coach ? 'Thay HLV' : 'Phân công'}</Button>} style={{ height: '100%' }}>
            {coach ? (
              <>
                <UserCell user={coach} sub={`${coachSportIds(data, coach.id).map((sid) => data.sports.find((s) => s.id === sid)?.name).filter(Boolean).join(' · ')}${coach.specialty ? ` — ${coach.specialty}` : ''}`} size={44} />
                <div style={{ color: '#7a776f', fontSize: 13, marginTop: 10 }}>{coach.bio}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#9a968c' }}>Đang dạy {activeCoachClasses(data, coach.id).length} lớp</div>
              </>
            ) : <Alert type="warning" showIcon title="Chưa có HLV — lớp chỉ OPEN khi có đúng 1 HLV" description={regs.filter((r) => r.status === 'PENDING').length ? 'Có HLV đăng ký, xem tab HLV để chọn.' : 'HLV đúng bộ môn có thể tự đăng ký, hoặc Manager phân công trực tiếp.'} />}
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card title="Thông tin lớp" style={{ height: '100%' }}>
            <Progress percent={Math.min(100, Math.round(done.length / Math.max(1, sessions.filter((s) => s.status === 'SCHEDULED').length) * 100))} strokeColor="#0f4d34" />
            <Descriptions column={{ xs: 1, md: 2 }} size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="Khóa học">{course?.name} · <SportTag id={c.sportId} size="small" /></Descriptions.Item>
              <Descriptions.Item label="Học phí">{fmtMoney(course?.price ?? 0)}</Descriptions.Item>
              <Descriptions.Item label="Lịch tuần">{schedules.map((s) => <Tag key={s.id} color="blue">{DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="Đã hủy đăng ký">{cancelled.length} lượt</Descriptions.Item>
              <Descriptions.Item label="Sĩ số">{c.minStudents} – {c.capacity}</Descriptions.Item>
              <Descriptions.Item label="Override sĩ số tối thiểu"><Switch size="small" checked={c.minStudentsOverride} disabled={phase !== 'OPEN' && c.status !== 'PENDING_APPROVAL' && c.status !== 'DRAFT'} onChange={(v) => { update('classes', c.id, { minStudentsOverride: v }); log(v ? 'ENABLE_MIN_OVERRIDE' : 'DISABLE_MIN_OVERRIDE', 'Class', c.id, `${v ? 'Bật' : 'Tắt'} override sĩ số tối thiểu lớp ${c.name}`); }} /> <small style={{ color: '#9a968c' }}>có audit, không sửa ngưỡng gốc</small></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'students', label: `Học viên (${students.length})`, children: (
            <Table size="middle" rowKey="id" pagination={{ pageSize: 8 }} dataSource={students} columns={[
              { title: 'Học viên', render: (_, r) => <a onClick={() => navigate(`/manager/members/${r.memberId}`)}><UserCell id={r.memberId} /></a> },
              { title: 'SĐT', render: (_, r) => userById(r.memberId)?.phone },
              { title: 'Ngày đăng ký', dataIndex: 'enrolledAt', render: (v) => dayjs(v).format('DD/MM/YYYY') },
              { title: 'Đã trả', render: (_, r) => { const it = data.orderItems.find((x) => x.id === r.orderItemId); return it ? <span className="sc-nowrap">{fmtMoney(it.total)}{it.membershipDiscount ? <small style={{ color: '#16a34a' }}> (−{fmtMoney(it.membershipDiscount)} gói)</small> : null}</span> : '—'; } },
              { title: 'Chuyên cần', width: 200, render: (_, r) => { const ids = done.map((s) => s.id); const at = data.attendances.filter((a) => ids.includes(a.sessionId) && a.memberId === r.memberId); const p = at.filter((a) => a.status !== 'ABSENT').length; return at.length ? <Progress percent={Math.round(p / at.length * 100)} size="small" format={() => `${p}/${at.length}`} /> : '—'; } },
            ]} />
          ) },
          { key: 'sessions', label: `Buổi học (${sessions.length})`, children: (
            <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={sessions} columns={[
              { title: '#', width: 40, render: (_, __, i) => i + 1 },
              { title: 'Ngày', render: (_, s) => <span className="sc-nowrap"><b>{dayjs(s.date).format('DD/MM/YYYY')}</b> <small>{DAY_NAMES[((dayjs(s.date).day() + 6) % 7) + 1]}</small></span> },
              { title: 'Giờ', render: (_, s) => <span className="sc-nowrap">{s.startTime}–{s.endTime}</span> },
              { title: 'Facility', render: (_, s) => data.rooms.find((r) => r.id === s.roomId)?.name },
              { title: 'Trạng thái', render: (_, s) => s.status === 'CANCELLED' ? <StatusTag value="CANCELLED" /> : `${s.date} ${s.endTime}` < now ? <Tag>Đã diễn ra</Tag> : <StatusTag value="SCHEDULED" /> },
              { title: 'Điểm danh', render: (_, s) => { const a = attOf(s.id); return a.length ? `${a.filter((x) => x.status !== 'ABSENT').length}/${a.length}` : '—'; } },
              { title: 'Ghi chú', dataIndex: 'note', render: (v) => v ? <span style={{ fontSize: 12, color: '#7a776f' }}>{v}</span> : '' },
              { title: '', render: (_, s) => s.status === 'SCHEDULED' && `${s.date} ${s.startTime}` > now && c.status !== 'CANCELLED' && (
                <Space>
                  <Button size="small" onClick={() => { sessForm.setFieldsValue({ roomId: s.roomId, date: dayjs(s.date), time: [dayjs(s.startTime, 'HH:mm'), dayjs(s.endTime, 'HH:mm')] }); setWarn(null); setEditSession(s); }}>Đổi phòng / dời</Button>
                  <Popconfirm title="Hủy buổi này? Hoàn allocation buổi cho học viên (D05)." onConfirm={() => { const r = cancelSession(s.id, 'Manager hủy buổi'); message.success(`Đã hủy buổi, hoàn ${fmtMoney(r.refunded)}`); }}><Button size="small" danger>Hủy buổi</Button></Popconfirm>
                </Space>
              ) },
            ]} />
          ) },
          { key: 'coach', label: `HLV đăng ký (${regs.length})`, children: (
            <>
              {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
              <Table size="small" rowKey="id" pagination={false} dataSource={regs} locale={{ emptyText: 'Chưa có HLV đăng ký dạy lớp này' }} columns={[
                { title: 'HLV', render: (_, r) => <UserCell id={r.coachId} sub={coachSportIds(data, r.coachId).map((sid) => data.sports.find((s) => s.id === sid)?.name).join(' · ')} /> },
                { title: 'Đăng ký lúc', dataIndex: 'createdAt' },
                { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
                { title: 'Lớp đang dạy', render: (_, r) => activeCoachClasses(data, r.coachId).length },
                { title: '', render: (_, r) => r.status === 'PENDING' && <Space><Button size="small" type="primary" onClick={() => assign(r.coachId, r.id)}>Chọn HLV này</Button><Button size="small" onClick={() => { update('coachRegistrations', r.id, { status: 'REJECTED', reviewedAt: now }); notify(r.coachId, 'Đăng ký dạy bị từ chối', `Lớp ${c.name}.`); log('REJECT_COACH_REGISTRATION', 'ClassCoachRegistration', r.id, `Từ chối ${nameOf(r.coachId)} dạy ${c.name}`); }}>Từ chối</Button></Space> },
              ]} />
            </>
          ) },
          { key: 'revenue', label: `Doanh thu (${items.length})`, children: (
            <Table size="middle" rowKey="id" pagination={{ pageSize: 8 }} dataSource={[...items].sort((a, b) => b.order.paidAt.localeCompare(a.order.paidAt))} columns={[
              { title: 'Hóa đơn', render: (_, it) => <a onClick={() => navigate(`/manager/orders/${it.orderId}`)} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{it.order.orderNumber}</a> },
              { title: 'Học viên', render: (_, it) => <UserCell id={it.order.buyerId} /> },
              { title: 'Giá gốc', dataIndex: 'unitPrice', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
              { title: 'Ưu đãi', align: 'right', render: (_, it) => <span className="sc-nowrap" style={{ color: '#16a34a' }}>−{fmtMoney(it.membershipDiscount + it.couponDiscount)}</span> },
              { title: 'Thực thu', dataIndex: 'total', align: 'right', render: (v, it) => <b className="sc-nowrap">{fmtMoney(v - it.refundedAmount)}</b> },
              { title: 'PT', render: (_, it) => <StatusTag value={it.order.paymentMethod} /> },
              { title: 'Ngày', render: (_, it) => <span className="sc-nowrap">{it.order.paidAt}</span> },
            ]} />
          ) },
        ]} />
      </Card>

      <Modal title="Phân công huấn luyện viên" open={assignOpen} onCancel={() => setAssignOpen(false)} onOk={() => assignForm.submit()} okText="Phân công">
        {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
        <Form form={assignForm} layout="vertical" onFinish={(v: { coachId: string }) => assign(v.coachId)}>
          <Form.Item name="coachId" label={<span>HLV đã duyệt chuyên môn <SportTag id={c.sportId} size="small" /></span>} rules={[{ required: true }]}><Select options={coachOptions} /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Chỉ HLV có chuyên môn APPROVED; kiểm tra trùng giờ với mọi buổi của lớp. Các đăng ký PENDING khác sẽ bị từ chối, tạo registration MANAGER_ASSIGNED (BR_2.15).</div>
      </Modal>
      <Modal title={`Buổi ${editSession ? dayjs(editSession.date).format('DD/MM') + ' ' + editSession.startTime : ''}`} open={!!editSession} onCancel={() => setEditSession(null)} onOk={() => sessForm.submit()} okText="Lưu & thông báo">
        {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
        <Form form={sessForm} layout="vertical" onFinish={saveSession}>
          <Form.Item name="roomId" label="Facility (hỗ trợ bộ môn)" rules={[{ required: true }]}><Select options={bookableRooms(data).filter((r) => r.sportIds.includes(c.sportId)).map((r) => ({ value: r.id, label: `${r.name} · ${r.location}` }))} /></Form.Item>
          <Space>
            <Form.Item name="date" label="Ngày" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" /></Form.Item>
            <Form.Item name="time" label="Giờ" rules={[{ required: true }]}><TimePicker.RangePicker format="HH:mm" minuteStep={data.settings.slotMinutes as 30} /></Form.Item>
          </Space>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Kiểm tra facility (buổi khác, booking lẻ, bảo trì) và trùng giờ HLV; allocation tiền buổi không đổi khi dời.</div>
      </Modal>
    </Page>
  );
}
