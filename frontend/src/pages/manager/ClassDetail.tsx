import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Modal, Popconfirm, Progress, Row, Select, Space, Table, Tabs, Tag, TimePicker, message } from 'antd';
import { CalendarOutlined, DollarOutlined, PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import StatCard from '../../components/StatCard';
import UserCell from '../../components/UserCell';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { coachConflict, roomConflict } from '../../utils/conflicts';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, add, remove, update, log, notify, nameOf, userById } = useApp();
  const [scOpen, setScOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [scForm] = Form.useForm();
  const [coachForm] = Form.useForm();
  const [warn, setWarn] = useState<string | null>(null);
  const [allCoaches, setAllCoaches] = useState(false);

  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;

  const schedules = data.schedules.filter((s) => s.classId === c.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const students = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ACTIVE');
  const cancelled = data.enrollments.filter((e) => e.classId === c.id && e.status === 'CANCELLED');
  const room = data.rooms.find((r) => r.id === c.roomId);
  const coach = userById(c.coachId);
  const sessions = data.sessions.filter((s) => s.classId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const attOf = (sid: string) => data.attendances.filter((a) => a.sessionId === sid);
  const revenue = data.payments.filter((p) => p.type === 'CLASS' && p.refName === c.name);
  const fillRate = Math.round((students.length / c.capacity) * 100);
  const avgAtt = sessions.length ? Math.round(sessions.reduce((s, ss) => { const a = attOf(ss.id); return s + (a.length ? a.filter((x) => x.status !== 'ABSENT').length / a.length : 0); }, 0) / sessions.length * 100) : 0;
  const weeksLeft = Math.max(0, dayjs(c.endDate).diff(dayjs(), 'week'));
  const progress = Math.min(100, Math.max(0, Math.round(dayjs().diff(dayjs(c.startDate), 'day') / dayjs(c.endDate).diff(dayjs(c.startDate), 'day') * 100)));

  const addSchedule = (v: { dayOfWeek: number; time: [dayjs.Dayjs, dayjs.Dayjs] }) => {
    const sc = { id: 'tmp', classId: c.id, dayOfWeek: v.dayOfWeek, startTime: v.time[0].format('HH:mm'), endTime: v.time[1].format('HH:mm') };
    const conflict = roomConflict(data, sc, c.roomId);
    if (conflict) {
      const other = data.classes.find((x) => x.id === conflict.classId);
      setWarn(`Trùng phòng ${room?.name}: lớp "${other?.name}" đã dùng ${DAY_NAMES[conflict.dayOfWeek]} ${conflict.startTime}-${conflict.endTime}`);
      return;
    }
    if (c.coachId) {
      const cc = coachConflict({ ...data, schedules: [...data.schedules, sc] }, c.coachId, c.id);
      if (cc) { setWarn(`HLV ${nameOf(c.coachId)} đã dạy lớp "${cc.cls.name}" vào ${DAY_NAMES[cc.sc.dayOfWeek]} ${cc.sc.startTime}-${cc.sc.endTime}`); return; }
    }
    add('schedules', { classId: c.id, dayOfWeek: sc.dayOfWeek, startTime: sc.startTime, endTime: sc.endTime });
    log('ADD_SCHEDULE', 'Class', c.id, `Thêm lịch ${DAY_NAMES[sc.dayOfWeek]} ${sc.startTime}-${sc.endTime} cho ${c.name}`);
    students.forEach((e) => notify(e.memberId, 'Cập nhật lịch học', `Lớp ${c.name} có lịch mới: ${DAY_NAMES[sc.dayOfWeek]} ${sc.startTime}-${sc.endTime}`));
    message.success('Đã thêm lịch và thông báo cho học viên'); setWarn(null); setScOpen(false);
  };

  const assignCoach = (v: { coachId: string }) => {
    const cc = coachConflict(data, v.coachId, c.id);
    if (cc) { setWarn(`HLV ${nameOf(v.coachId)} đã dạy lớp "${cc.cls.name}" trùng giờ (${DAY_NAMES[cc.sc.dayOfWeek]} ${cc.sc.startTime}-${cc.sc.endTime})`); return; }
    update('classes', c.id, { coachId: v.coachId });
    log('ASSIGN_COACH', 'Class', c.id, `Phân công ${nameOf(v.coachId)} phụ trách ${c.name}`);
    notify(v.coachId, 'Phân công lớp mới', `Bạn được phân công phụ trách lớp ${c.name}.`);
    message.success('Đã phân công huấn luyện viên'); setWarn(null); setCoachOpen(false);
  };

  const attSeries = [...sessions].reverse().slice(-12).map((s) => { const a = attOf(s.id); return { date: dayjs(s.date).format('DD/MM'), rate: a.length ? Math.round(a.filter((x) => x.status !== 'ABSENT').length / a.length * 100) : 0 }; });

  return (
    <Page title={c.name} subtitle={`${data.sports.find((s) => s.id === c.sportId)?.name} · ${room?.name} (${room?.location}) · ${dayjs(c.startDate).format('DD/MM/YYYY')} → ${dayjs(c.endDate).format('DD/MM/YYYY')}`}
      extra={<Space><StatusTag value={c.status} /><Button onClick={() => navigate('/manager/classes')}>Quay lại</Button></Space>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Sĩ số" value={`${students.length}/${c.capacity}`} icon={<TeamOutlined />} color="#2563eb" hint={`Lấp đầy ${fillRate}%`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Buổi đã dạy" value={sessions.length} icon={<CalendarOutlined />} color="#9333ea" hint={`còn ${weeksLeft} tuần`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Chuyên cần TB" value={`${avgAtt}%`} icon={<UserOutlined />} color="#16a34a" /></Col>
        <Col xs={12} xl={6}><StatCard title="Doanh thu lớp" value={fmtMoney(revenue.reduce((s, p) => s + p.amount, 0))} icon={<DollarOutlined />} color="#f97316" hint={`${revenue.length} giao dịch`} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="Huấn luyện viên" extra={<Button size="small" type="link" onClick={() => { coachForm.setFieldsValue({ coachId: c.coachId }); setWarn(null); setCoachOpen(true); }}>Phân công</Button>} style={{ height: '100%' }}>
            {coach ? (
              <>
                <UserCell user={coach} sub={`${(coach.sportIds ?? []).map((id) => data.sports.find((s) => s.id === id)?.name).filter(Boolean).join(' · ')}${coach.specialty ? ` — ${coach.specialty}` : ''}`} size={44} />
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 10 }}>{coach.bio}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>Đang dạy {data.classes.filter((x) => x.coachId === coach.id && x.status === 'OPEN').length} lớp</div>
              </>
            ) : <Alert type="warning" showIcon title="Chưa phân công huấn luyện viên" />}
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card title="Tiến độ khóa học" style={{ height: '100%' }}>
            <Progress percent={progress} strokeColor="#2563eb" />
            <Descriptions column={{ xs: 1, md: 3 }} size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="Học phí">{fmtMoney(c.price)}</Descriptions.Item>
              <Descriptions.Item label="Lịch">{schedules.map((s) => <Tag key={s.id} color="blue">{DAY_NAMES[s.dayOfWeek]} {s.startTime}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="Đã hủy">{cancelled.length} lượt</Descriptions.Item>
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
              { title: 'Mục tiêu', render: (_, r) => userById(r.memberId)?.goal },
              { title: 'Gói', render: (_, r) => <StatusTag value={(() => { const s = data.subscriptions.find((x) => x.memberId === r.memberId && x.status === 'ACTIVE'); return s ? (dayjs(s.endDate).diff(dayjs(), 'day') <= 7 ? 'EXPIRING' : 'ACTIVE') : 'EXPIRED'; })()} /> },
              { title: 'Ngày đăng ký', dataIndex: 'enrolledAt', render: (v) => dayjs(v).format('DD/MM/YYYY') },
              { title: 'Chuyên cần', width: 200, render: (_, r) => { const ids = sessions.map((s) => s.id); const at = data.attendances.filter((a) => ids.includes(a.sessionId) && a.memberId === r.memberId); const p = at.filter((a) => a.status !== 'ABSENT').length; return at.length ? <Progress percent={Math.round(p / at.length * 100)} size="small" format={() => `${p}/${at.length}`} /> : '—'; } },
            ]} />
          ) },
          { key: 'schedule', label: `Lịch học (${schedules.length})`, children: (
            <>
              <div style={{ textAlign: 'right', marginBottom: 12 }}><Button icon={<PlusOutlined />} onClick={() => { scForm.resetFields(); setWarn(null); setScOpen(true); }}>Thêm lịch</Button></div>
              <Table size="middle" rowKey="id" pagination={false} dataSource={schedules} columns={[
                { title: 'Thứ', dataIndex: 'dayOfWeek', render: (v) => <b>{DAY_NAMES[v]}</b> },
                { title: 'Giờ', render: (_, r) => `${r.startTime} – ${r.endTime}` },
                { title: 'Phòng', render: () => room?.name },
                { title: 'Thời lượng', render: (_, r) => `${dayjs(`2000-01-01 ${r.endTime}`).diff(dayjs(`2000-01-01 ${r.startTime}`), 'minute')} phút` },
                { title: '', render: (_, r) => <Popconfirm title="Xóa lịch này?" onConfirm={() => { remove('schedules', r.id); log('REMOVE_SCHEDULE', 'Class', c.id, `Xóa lịch ${DAY_NAMES[r.dayOfWeek]} của ${c.name}`); }}><Button size="small" danger>Xóa</Button></Popconfirm> },
              ]} />
            </>
          ) },
          { key: 'sessions', label: `Buổi học (${sessions.length})`, children: (
            <Row gutter={16}>
              <Col xs={24} lg={10}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Tỷ lệ có mặt 12 buổi gần nhất</div>
                <Column data={attSeries} xField="date" yField="rate" height={240} style={{ fill: '#16a34a', radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 24 }} axis={{ y: { labelFormatter: (v: number) => v + '%' } }} />
              </Col>
              <Col xs={24} lg={14}>
                <Table size="small" rowKey="id" pagination={{ pageSize: 6 }} dataSource={sessions} columns={[
                  { title: 'Ngày', dataIndex: 'date', render: (v) => <b>{dayjs(v).format('DD/MM/YYYY')}</b> },
                  { title: 'Thứ', dataIndex: 'date', render: (v) => DAY_NAMES[((dayjs(v).day() + 6) % 7) + 1] },
                  { title: 'Có mặt', render: (_, r) => { const a = attOf(r.id); return `${a.filter((x) => x.status === 'PRESENT').length}`; } },
                  { title: 'Muộn', render: (_, r) => attOf(r.id).filter((x) => x.status === 'LATE').length },
                  { title: 'Vắng', render: (_, r) => { const n = attOf(r.id).filter((x) => x.status === 'ABSENT').length; return n ? <span style={{ color: '#dc2626', fontWeight: 600 }}>{n}</span> : 0; } },
                  { title: 'Kết quả ghi nhận', render: (_, r) => data.trainingResults.filter((t) => t.sessionId === r.id).length },
                ]} />
              </Col>
            </Row>
          ) },
          { key: 'revenue', label: `Doanh thu (${revenue.length})`, children: (
            <Table size="middle" rowKey="id" pagination={{ pageSize: 8 }} dataSource={[...revenue].sort((a, b) => b.paidAt.localeCompare(a.paidAt))} columns={[
              { title: 'Hóa đơn', dataIndex: 'invoiceNo', render: (v) => <span className="sc-nowrap" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</span> },
              { title: 'Học viên', render: (_, r) => <UserCell id={r.memberId} /> },
              { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> },
              { title: 'Phương thức', dataIndex: 'method', render: (v) => <StatusTag value={v} /> },
              { title: 'Ngày', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> },
            ]} />
          ) },
        ]} />
      </Card>

      <Modal title="Thêm lịch học" open={scOpen} onCancel={() => setScOpen(false)} onOk={() => scForm.submit()} okText="Thêm">
        {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
        <Form form={scForm} layout="vertical" onFinish={addSchedule}>
          <Form.Item name="dayOfWeek" label="Thứ" rules={[{ required: true }]}><Select options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: DAY_NAMES[d] }))} /></Form.Item>
          <Form.Item name="time" label="Giờ" rules={[{ required: true }]}><TimePicker.RangePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Hệ thống kiểm tra trùng phòng và trùng giờ dạy của HLV trước khi lưu.</div>
      </Modal>
      <Modal title="Phân công huấn luyện viên" open={coachOpen} onCancel={() => setCoachOpen(false)} onOk={() => coachForm.submit()} okText="Phân công">
        {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
        <Form form={coachForm} layout="vertical" onFinish={assignCoach}>
          <Form.Item name="coachId" label={<span>Huấn luyện viên <SportTag id={c.sportId} size="small" /></span>} rules={[{ required: true }]}>
            <Select
              options={(() => {
                const coaches = data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE');
                const opt = (u: typeof coaches[number]) => ({ value: u.id, label: `${u.fullName} — ${u.specialty ?? ''} (${data.classes.filter((x) => x.coachId === u.id && x.status === 'OPEN').length} lớp)` });
                const match = coaches.filter((u) => u.sportIds?.includes(c.sportId));
                const other = coaches.filter((u) => !u.sportIds?.includes(c.sportId));
                return [
                  { label: `HLV bộ môn ${data.sports.find((s) => s.id === c.sportId)?.name}`, options: match.map(opt) },
                  ...(allCoaches ? [{ label: 'HLV bộ môn khác', options: other.map(opt) }] : []),
                ];
              })()} />
          </Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Hệ thống kiểm tra HLV không bị trùng giờ với lớp khác đang mở.</span>
          <a onClick={() => setAllCoaches((v) => !v)}>{allCoaches ? 'Chỉ HLV đúng bộ môn' : 'Hiện tất cả HLV'}</a>
        </div>
      </Modal>
    </Page>
  );
}
