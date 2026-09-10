import { useState } from 'react';
import { Badge, Button, Col, Form, Input, Modal, Row, Segmented, Select, Space, Table, Tooltip, message } from 'antd';
import { ClockCircleOutlined, CustomerServiceOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from './Page';
import StatCard from './StatCard';
import StatusTag from './StatusTag';
import UserCell from './UserCell';
import SupportThread from './SupportThread';
import { useApp } from '../store/AppContext';

export default function SupportRequests() {
  const { data, add, nameOf, currentUser, log, notify } = useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [status, setStatus] = useState<string>('ALL');
  const [active, setActive] = useState<string | null>(null);

  const withMeta = data.supportRequests.map((r) => {
    const msgs = data.supportMessages.filter((m) => m.requestId === r.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1];
    // Chờ nhân viên phản hồi nếu chưa có tin nào hoặc tin cuối là của member
    const waiting = r.status !== 'RESOLVED' && (!last || last.senderId === r.memberId);
    return { ...r, msgs, last, waiting, lastAt: last?.createdAt ?? r.createdAt };
  });
  const rows = withMeta.filter((r) => status === 'ALL' ? true : status === 'WAITING' ? r.waiting : r.status === status).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const counts = { open: withMeta.filter((r) => r.status === 'OPEN').length, prog: withMeta.filter((r) => r.status === 'IN_PROGRESS').length, waiting: withMeta.filter((r) => r.waiting).length, resolved: withMeta.filter((r) => r.status === 'RESOLVED').length };
  const avgHours = (() => { const done = withMeta.filter((r) => r.status === 'RESOLVED' && r.last); if (!done.length) return 0; return Math.round(done.reduce((s, r) => s + dayjs(r.last!.createdAt).diff(dayjs(r.createdAt), 'hour'), 0) / done.length); })();

  const create = (v: { memberId: string; title: string; content: string; reply?: string }) => {
    const r = add('supportRequests', { memberId: v.memberId, title: v.title, content: v.content, status: v.reply ? 'IN_PROGRESS' : 'OPEN', handledBy: currentUser!.id, createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    if (v.reply?.trim()) {
      add('supportMessages', { requestId: r.id, senderId: currentUser!.id, content: v.reply.trim(), createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
      notify(v.memberId, `Phản hồi yêu cầu: ${v.title}`, v.reply.trim());
    }
    log('CREATE_SUPPORT', 'SupportRequest', r.id, `Tiếp nhận yêu cầu "${v.title}" của ${nameOf(v.memberId)}`);
    message.success('Đã ghi nhận yêu cầu'); setOpen(false); form.resetFields();
    setActive(r.id);
  };

  return (
    <Page title="Yêu cầu hỗ trợ" subtitle="Tiếp nhận, trao đổi và xử lý yêu cầu từ thành viên" extra={
      <Space>
        <Segmented value={status} onChange={(v) => setStatus(v as string)} options={[
          { value: 'ALL', label: 'Tất cả' },
          { value: 'WAITING', label: <Badge count={counts.waiting} size="small" offset={[8, 0]}>Chờ phản hồi</Badge> },
          { value: 'OPEN', label: 'Mới' }, { value: 'IN_PROGRESS', label: 'Đang xử lý' }, { value: 'RESOLVED', label: 'Đã xử lý' },
        ]} />
        {currentUser?.role === 'RECEPTIONIST' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>Tiếp nhận tại quầy</Button>}
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Chờ phản hồi" value={counts.waiting} icon={<MessageOutlined />} color="#dc2626" hint="thành viên đang đợi nhân viên" onClick={() => setStatus('WAITING')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Mới tiếp nhận" value={counts.open} icon={<CustomerServiceOutlined />} color="#f59e0b" onClick={() => setStatus('OPEN')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Đang xử lý" value={counts.prog} icon={<ClockCircleOutlined />} color="#2563eb" onClick={() => setStatus('IN_PROGRESS')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Đã xử lý" value={counts.resolved} icon={<CustomerServiceOutlined />} color="#16a34a" hint={avgHours ? `TB ${avgHours} giờ / yêu cầu` : undefined} onClick={() => setStatus('RESOLVED')} /></Col>
      </Row>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }} onRow={(r) => ({ onClick: () => setActive(r.id), style: { cursor: 'pointer' } })} columns={[
        { title: 'Thành viên', width: 220, render: (_, r) => <UserCell id={r.memberId} sub={data.users.find((u) => u.id === r.memberId)?.phone} /> },
        { title: 'Yêu cầu', render: (_, r) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <b>{r.title}</b>
              {r.waiting && <Tooltip title="Thành viên đang chờ phản hồi"><Badge status="processing" color="#dc2626" /></Tooltip>}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>
              {r.last ? <><b style={{ color: r.last.senderId === r.memberId ? '#dc2626' : '#475569' }}>{r.last.senderId === r.memberId ? 'TV' : nameOf(r.last.senderId).split(' ').pop()}:</b> {r.last.content}</> : r.content}
            </div>
          </div>
        ) },
        { title: 'Trao đổi', dataIndex: 'msgs', align: 'center', render: (m) => <span style={{ color: m.length ? '#0f172a' : '#94a3b8' }}><MessageOutlined /> {m.length}</span> },
        { title: 'Người xử lý', render: (_, r) => r.handledBy ? nameOf(r.handledBy) : <span style={{ color: '#94a3b8' }}>—</span> },
        { title: 'Cập nhật', dataIndex: 'lastAt', render: (v) => <Tooltip title={v}>{dayjs(v).fromNow()}</Tooltip> },
        { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => <Button size="small" type={r.waiting ? 'primary' : 'default'} onClick={(e) => { e.stopPropagation(); setActive(r.id); }}>{r.waiting ? 'Trả lời' : 'Mở'}</Button> },
      ]} />

      <SupportThread requestId={active} onClose={() => setActive(null)} />

      <Modal title="Tiếp nhận yêu cầu tại quầy" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Ghi nhận">
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="memberId" label="Thành viên" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} /></Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input placeholder="VD: Đổi lịch lớp, hỏng tủ đồ, xuất hóa đơn…" /></Form.Item>
          <Form.Item name="content" label="Nội dung thành viên yêu cầu" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="reply" label="Phản hồi ban đầu (tùy chọn)"><Input.TextArea rows={2} placeholder="VD: Đã ghi nhận, sẽ phản hồi trong 24h" /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
