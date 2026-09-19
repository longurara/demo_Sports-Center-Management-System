import { useState } from 'react';
import { Button, Card, Col, Form, Input, List, Row, Select, Space, Statistic, Table, Tabs, Tag, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import SupportThread from '../../components/SupportThread';
import { useApp } from '../../store/AppContext';
import { activeCoachClasses, coachSportIds } from '../../utils/classes';
import type { SupportType } from '../../types';

export function Coaches() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [sport, setSport] = useState<string>('ALL');
  const coaches = data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE').filter((u) => sport === 'ALL' || coachSportIds(data, u.id).includes(sport));
  const sportName = (id: string) => data.sports.find((s) => s.id === id)?.name ?? '';
  return (
    <Page title="Huấn luyện viên" subtitle="Chứng chỉ đúng bộ môn, ghi kết quả từng buổi và theo bạn suốt lộ trình." noCard>
      {/* Bộ lọc dạng chữ, gạch chân — không icon */}
      <div className="sc-filter">
        {[{ id: 'ALL', name: 'Tất cả' }, ...data.sports].map((s) => (
          <button key={s.id} type="button" className={`sc-filter-btn ${sport === s.id ? 'on' : ''}`} onClick={() => setSport(s.id)}>{s.name}</button>
        ))}
      </div>
      {/* Danh sách kiểu "roster": số thứ tự, tên condensed, chuyên môn, lớp — không ảnh, không icon */}
      <div className="sc-roster">
        {coaches.map((c, i) => {
          const classes = activeCoachClasses(data, c.id);
          return (
            <article key={c.id} className="sc-roster-row">
              <div className="sc-roster-idx">{String(i + 1).padStart(2, '0')}</div>
              <div className="sc-roster-main">
                <h3>{c.fullName}</h3>
                <div className="sc-roster-meta"><span>{coachSportIds(data, c.id).map(sportName).join(' · ')}</span>{c.specialty && <><i /><span>{c.specialty}</span></>}</div>
                <p>{c.bio}</p>
              </div>
              <div className="sc-roster-side">
                <small>Lớp đang dạy</small>
                {classes.length ? classes.map((x) => <a key={x.id} onClick={() => navigate(`/member/classes/${x.id}`)}>{x.name}</a>) : <span className="sc-roster-none">Chưa mở lớp</span>}
              </div>
            </article>
          );
        })}
        {coaches.length === 0 && <div className="sc-roster-none" style={{ padding: '32px 0' }}>Chưa có HLV cho bộ môn này.</div>}
      </div>
    </Page>
  );
}

export function MyAttendance() {
  const { data, currentUser } = useApp();
  const me = currentUser!.id;
  const att = data.attendances.filter((a) => a.memberId === me).map((a) => ({ ...a, session: data.sessions.find((s) => s.id === a.sessionId)! })).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const present = att.filter((a) => a.status !== 'ABSENT').length;
  const checkIns = data.checkIns.filter((c) => c.memberId === me).sort((a, b) => b.time.localeCompare(a.time));
  return (
    <Page title="Lịch sử điểm danh" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card><Statistic title="Buổi học đã điểm danh" value={att.length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Tỷ lệ chuyên cần" value={att.length ? Math.round((present / att.length) * 100) : 0} suffix="%" /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Lần check-in trung tâm" value={checkIns.length} /></Card></Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'class', label: 'Điểm danh lớp học', children: <Table size="small" rowKey="id" dataSource={att} columns={[{ title: 'Ngày', render: (_, r) => r.session.date }, { title: 'Lớp', render: (_, r) => data.classes.find((c) => c.id === r.session.classId)?.name }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /> },
          { key: 'checkin', label: 'Check-in trung tâm', children: <Table size="small" rowKey="id" dataSource={checkIns} columns={[{ title: 'Thời gian', dataIndex: 'time' }]} /> },
        ]} />
      </Card>
    </Page>
  );
}

export function MyTrainingPlan() {
  const { data, currentUser, nameOf } = useApp();
  const me = currentUser!.id;
  const myClassIds = data.enrollments.filter((e) => e.memberId === me && e.status === 'ENROLLED').map((e) => e.classId);
  const plans = data.trainingPlans.filter((p) => p.memberId === me || (p.classId && myClassIds.includes(p.classId)));
  const hws = data.homeworks.filter((h) => myClassIds.includes(h.classId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Page title="Kế hoạch tập luyện & bài tập về nhà" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Kế hoạch tập luyện">
            <List dataSource={plans} renderItem={(p) => (
              <List.Item>
                <List.Item.Meta title={<Space>{p.title}<Tag color={p.memberId ? 'purple' : 'blue'}>{p.memberId ? 'Cá nhân' : data.classes.find((c) => c.id === p.classId)?.name}</Tag><StatusTag value={p.source} /></Space>} description={<><div style={{ whiteSpace: 'pre-line' }}>{p.content}</div><div style={{ fontSize: 12 }}>HLV {nameOf(p.coachId)} · {p.createdAt}</div></>} />
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Bài tập về nhà">
            <List dataSource={hws} renderItem={(h) => (
              <List.Item><List.Item.Meta title={h.title} description={<><div>{h.content}</div><div style={{ fontSize: 12 }}>{data.classes.find((c) => c.id === h.classId)?.name} · HLV {nameOf(h.coachId)} · {h.createdAt}</div></>} /></List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}

export function MySupport() {
  const { data, currentUser, add, notify, nameOf } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const [form] = Form.useForm();
  const me = currentUser!;
  const rows = data.supportRequests.filter((r) => r.memberId === me.id).map((r) => {
    const msgs = data.supportMessages.filter((m) => m.requestId === r.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1];
    return { ...r, msgs, last, lastAt: last?.createdAt ?? r.createdAt, hasReply: !!last && last.senderId !== me.id };
  }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const openCount = rows.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;

  const send = (v: { title: string; content: string; type: SupportType }) => {
    const r = add('supportRequests', { ...v, type: v.type ?? 'OTHER', memberId: me.id, status: 'OPEN', createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    data.users.filter((u) => u.role === 'RECEPTIONIST' && u.status === 'ACTIVE').forEach((u) => notify(u.id, `Yêu cầu hỗ trợ mới: ${v.title}`, `${me.fullName}: ${v.content}`));
    message.success('Đã gửi yêu cầu, lễ tân sẽ phản hồi sớm'); form.resetFields();
    setActive(r.id);
  };

  const STATUS: Record<string, string> = { OPEN: 'Đang chờ', IN_PROGRESS: 'Đang xử lý', RESOLVED: 'Đã xong', CLOSED: 'Đã đóng' };
  const TOPICS: [string, SupportType][] = [['Đổi lịch lớp', 'SCHEDULE'], ['Gói & thanh toán', 'PAYMENT'], ['Sân & thiết bị', 'FACILITY'], ['Tài khoản', 'ACCOUNT'], ['Hóa đơn VAT', 'PAYMENT'], ['Khác', 'OTHER']];

  return (
    <Page title="Yêu cầu hỗ trợ" subtitle={openCount ? `${openCount} yêu cầu đang chờ lễ tân · phản hồi trong vòng 24 giờ` : 'Gửi yêu cầu và trao đổi trực tiếp với lễ tân · phản hồi trong vòng 24 giờ'} noCard>
      <div className="sc-sup">
        {/* Danh sách yêu cầu */}
        <div className="sc-sup-list">
          <div className="sc-sup-list-head"><small>Yêu cầu của bạn</small><span>{rows.length} yêu cầu</span></div>
          {rows.length === 0 && <div className="sc-sup-empty">Bạn chưa gửi yêu cầu nào.<br />Điền vào ô bên phải — lễ tân trả lời trong vòng 24 giờ.</div>}
          {rows.map((r, i) => (
            <button type="button" key={r.id} className={`sc-sup-row ${r.status === 'RESOLVED' || r.status === 'CLOSED' ? 'done' : ''}`} onClick={() => setActive(r.id)}>
              <span className="sc-sup-idx">{String(rows.length - i).padStart(2, '0')}</span>
              <span className="sc-sup-main">
                <span className="sc-sup-title">{r.title}</span>
                <span className="sc-sup-last">{r.last ? <><b>{r.last.senderId === me.id ? 'Bạn' : nameOf(r.last.senderId).split(' ').slice(-1)[0]}:</b> {r.last.content}</> : r.content}</span>
                <span className="sc-sup-meta">#{r.id.toUpperCase()} · {r.msgs.length ? `${r.msgs.length} trao đổi` : 'Chưa có phản hồi'} · {dayjs(r.lastAt).fromNow()}{r.handledBy ? ` · ${nameOf(r.handledBy)}` : ''}</span>
              </span>
              <span className={`sc-sup-status ${r.status.toLowerCase()} ${r.hasReply && r.status !== 'RESOLVED' && r.status !== 'CLOSED' ? 'new' : ''}`}>{r.hasReply && r.status !== 'RESOLVED' && r.status !== 'CLOSED' ? 'Có phản hồi' : STATUS[r.status]}</span>
            </button>
          ))}
        </div>

        {/* Cột phải: gửi yêu cầu mới + liên hệ */}
        <aside className="sc-sup-side">
          <div className="sc-sup-panel">
            <small>Gửi yêu cầu mới</small>
            <div className="sc-sup-topics">{TOPICS.map(([t, ty]) => <button type="button" key={t} onClick={() => form.setFieldsValue({ title: t === 'Khác' ? '' : t, type: ty })}>{t}</button>)}</div>
            <Form form={form} layout="vertical" onFinish={send} requiredMark={false} initialValues={{ type: 'OTHER' }}>
              <Form.Item name="type" label="Loại"><Select options={[{ value: 'SCHEDULE', label: 'Lịch học / sân' }, { value: 'PAYMENT', label: 'Thanh toán' }, { value: 'FACILITY', label: 'Cơ sở vật chất' }, { value: 'ACCOUNT', label: 'Tài khoản / gói' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input placeholder="VD: Đổi lịch lớp Yoga sang ca chiều" /></Form.Item>
              <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Mô tả yêu cầu của bạn' }]}><Input.TextArea rows={4} placeholder="Bạn cần gì, khi nào, ở lớp/sân nào…" /></Form.Item>
              <Button type="primary" htmlType="submit" block size="large">Gửi cho lễ tân</Button>
            </Form>
            <p className="sc-sup-note">Bạn sẽ nhận thông báo ngay khi lễ tân trả lời.</p>
          </div>
          <div className="sc-sup-panel">
            <small>Cần gấp?</small>
            <div className="sc-sup-contact"><span>Quầy lễ tân</span><a href="tel:02838123456">028 3812 3456</a><em>06:00 – 22:00, 7 ngày/tuần</em></div>
            <div className="sc-sup-contact"><span>Email</span><a href="mailto:support@sportscenter.vn">support@sportscenter.vn</a><em>Trả lời trong 1 ngày làm việc</em></div>
          </div>
          <div className="sc-sup-panel">
            <small>Tự làm nhanh hơn</small>
            <div className="sc-sup-links">
              <Link to="/member/schedule">Xem lịch tập tuần này</Link>
              <Link to="/member/plans">Gia hạn hoặc nâng gói</Link>
              <Link to="/member/courts">Đặt hoặc hủy sân</Link>
              <Link to="/member/orders">Tải hóa đơn đã thanh toán</Link>
            </div>
          </div>
        </aside>
      </div>
      <SupportThread requestId={active} onClose={() => setActive(null)} />
    </Page>
  );
}
