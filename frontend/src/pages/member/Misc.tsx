import { useState } from 'react';
import { Avatar, Button, Card, Col, Form, Input, List, Modal, Row, Segmented, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import SportTag from '../../components/SportTag';
import { MessageOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import SupportThread from '../../components/SupportThread';
import { fmtMoney, useApp } from '../../store/AppContext';

export function Coaches() {
  const { data } = useApp();
  const [sport, setSport] = useState<string>('ALL');
  const coaches = data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE').filter((u) => sport === 'ALL' || u.sportIds?.includes(sport));
  return (
    <Page title="Huấn luyện viên" subtitle={`${coaches.length} HLV · ${data.sports.length} bộ môn`} noCard>
      <div style={{ overflowX: 'auto' }}>
        <Segmented value={sport} onChange={(v) => setSport(v as string)} options={[{ value: 'ALL', label: 'Tất cả' }, ...data.sports.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))]} />
      </div>
      <Row gutter={[16, 16]}>
        {coaches.map((c) => (
          <Col xs={24} md={12} xl={8} key={c.id}>
            <div className="sc-coach">
              <div className="sc-coach-cover" style={{ background: `linear-gradient(135deg, ${data.sports.find((s) => s.id === c.sportIds?.[0])?.color ?? '#0f4d34'}, #14130f)`, position: 'relative' }}>
                <div style={{ position: 'absolute', right: 16, top: 14, fontSize: 30, opacity: .9 }}>{(c.sportIds ?? []).map((id) => data.sports.find((s) => s.id === id)?.icon).join(' ')}</div>
              </div>
              <div style={{ padding: '0 20px 20px', marginTop: -32 }}>
                <Avatar size={64} style={{ background: '#fff', color: '#14130f', fontSize: 22, fontWeight: 700, border: '3px solid #fff', boxShadow: '0 6px 16px rgba(15,23,42,.15)' }}>{c.fullName.split(' ').slice(-2).map((w) => w[0]).join('')}</Avatar>
                <div style={{ marginTop: 10 }}>
                  <b style={{ fontSize: 16 }}>{c.fullName}</b>
                  <div style={{ fontSize: 12, color: '#7a776f' }}>{c.specialty}</div>
                </div>
                <Space wrap size={[4, 4]} style={{ marginTop: 8 }}>{(c.sportIds ?? []).map((id) => <SportTag key={id} id={id} size="small" />)}</Space>
                <Typography.Paragraph type="secondary" style={{ margin: '8px 0 12px', minHeight: 44 }}>{c.bio}</Typography.Paragraph>
                <div style={{ fontSize: 12, color: '#7a776f' }}>Lớp đang dạy</div>
                <Space wrap size={4} style={{ marginTop: 4 }}>{data.classes.filter((x) => x.coachId === c.id && x.status === 'OPEN').map((x) => <Tag key={x.id} style={{ background: '#f3f1ec', color: '#3d3b35' }}>{x.name}</Tag>)}</Space>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Page>
  );
}

export function PaymentHistory() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();
  const rows = data.payments.filter((p) => p.memberId === currentUser!.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return (
    <Page title="Lịch sử thanh toán" subtitle={`Tổng đã thanh toán: ${fmtMoney(rows.reduce((s, p) => s + p.amount, 0))}`}>
      <Table rowKey="id" dataSource={rows} columns={[
        { title: 'Số HĐ', dataIndex: 'invoiceNo', render: (v) => <span className="sc-nowrap" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</span> }, { title: 'Ngày', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> },
        { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> }, { title: 'Nội dung', dataIndex: 'refName' },
        { title: 'Số tiền', dataIndex: 'amount', render: fmtMoney }, { title: 'PT', dataIndex: 'method', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => <Button size="small" icon={<PrinterOutlined />} onClick={() => navigate(`/member/payments/${r.id}`)}>Hóa đơn</Button> },
      ]} />
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
  const myClassIds = data.enrollments.filter((e) => e.memberId === me && e.status === 'ACTIVE').map((e) => e.classId);
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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [form] = Form.useForm();
  const rows = data.supportRequests.filter((r) => r.memberId === currentUser!.id).map((r) => {
    const msgs = data.supportMessages.filter((m) => m.requestId === r.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1];
    return { ...r, msgs, last, lastAt: last?.createdAt ?? r.createdAt, hasReply: !!last && last.senderId !== currentUser!.id };
  }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const send = (v: { title: string; content: string }) => {
    const r = add('supportRequests', { ...v, memberId: currentUser!.id, status: 'OPEN', createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    data.users.filter((u) => u.role === 'RECEPTIONIST' && u.status === 'ACTIVE').forEach((u) => notify(u.id, `Yêu cầu hỗ trợ mới: ${v.title}`, `${currentUser!.fullName}: ${v.content}`));
    message.success('Đã gửi yêu cầu, lễ tân sẽ phản hồi sớm'); setOpen(false); form.resetFields();
    setActive(r.id);
  };

  return (
    <Page title="Yêu cầu hỗ trợ" subtitle="Gửi yêu cầu và trao đổi trực tiếp với lễ tân" extra={<Button type="primary" onClick={() => setOpen(true)}>Gửi yêu cầu mới</Button>}>
      <List dataSource={rows} locale={{ emptyText: 'Bạn chưa gửi yêu cầu nào' }} renderItem={(r) => (
        <List.Item onClick={() => setActive(r.id)} style={{ cursor: 'pointer', padding: '14px 8px', borderRadius: 10 }} className="sc-hover-row"
          actions={[<Button size="small" onClick={(e) => { e.stopPropagation(); setActive(r.id); }}>{r.hasReply ? 'Xem phản hồi' : 'Mở'}</Button>]}>
          <List.Item.Meta
            avatar={<div style={{ width: 40, height: 40, borderRadius: 12, background: r.status === 'RESOLVED' ? '#dcfce7' : r.hasReply ? '#e3efe8' : '#f9e6dd', color: r.status === 'RESOLVED' ? '#16a34a' : r.hasReply ? '#0f4d34' : '#c94a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><MessageOutlined /></div>}
            title={<Space><b>{r.title}</b><StatusTag value={r.status} />{r.hasReply && r.status !== 'RESOLVED' && <Tag color="blue">Có phản hồi</Tag>}</Space>}
            description={<>
              <div style={{ color: '#3d3b35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 560 }}>
                {r.last ? <><b>{r.last.senderId === currentUser!.id ? 'Bạn' : nameOf(r.last.senderId)}:</b> {r.last.content}</> : r.content}
              </div>
              <div style={{ fontSize: 12, color: '#9a968c' }}>{r.msgs.length} trao đổi · cập nhật {dayjs(r.lastAt).fromNow()}{r.handledBy ? ` · xử lý bởi ${nameOf(r.handledBy)}` : ''}</div>
            </>} />
        </List.Item>
      )} />
      <SupportThread requestId={active} onClose={() => setActive(null)} />
      <Modal title="Gửi yêu cầu hỗ trợ" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Gửi">
        <Form form={form} layout="vertical" onFinish={send}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input placeholder="VD: Đổi lịch lớp Yoga" /></Form.Item>
          <Form.Item name="content" label="Nội dung" rules={[{ required: true }]}><Input.TextArea rows={4} placeholder="Mô tả chi tiết yêu cầu của bạn…" /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Lễ tân sẽ phản hồi trong vòng 24h. Bạn sẽ nhận thông báo khi có trả lời.</div>
      </Modal>
    </Page>
  );
}
