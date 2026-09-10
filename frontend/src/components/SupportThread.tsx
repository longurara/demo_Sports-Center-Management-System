import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Drawer, Input, Popconfirm, Space, Tag, Tooltip, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import StatusTag from './StatusTag';
import { avatarColor, initialsOf } from './UserCell';
import { useApp } from '../store/AppContext';

/**
 * Hộp thoại trao đổi 2 chiều cho một yêu cầu hỗ trợ.
 * Member ↔ Lễ tân/Quản lý đều dùng chung; quyền đóng/mở lại và đổi trạng thái tùy vai trò.
 */
export default function SupportThread({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const { data, currentUser, add, update, notify, nameOf, userById, log } = useApp();
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const req = data.supportRequests.find((r) => r.id === requestId);
  const msgs = data.supportMessages.filter((m) => m.requestId === requestId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const me = currentUser!;
  const isStaff = me.role !== 'MEMBER';

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, requestId]);
  useEffect(() => { setText(''); }, [requestId]);

  if (!req) return <Drawer open={!!requestId} onClose={onClose} />;
  const member = userById(req.memberId);
  const staffIds = data.users.filter((u) => u.role === 'RECEPTIONIST' && u.status === 'ACTIVE').map((u) => u.id);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    add('supportMessages', { requestId: req.id, senderId: me.id, content, createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    if (isStaff) {
      // Nhân viên trả lời: nhận xử lý nếu đang mở, thông báo cho member
      const patch: Partial<typeof req> = { handledBy: req.handledBy ?? me.id };
      if (req.status === 'OPEN') patch.status = 'IN_PROGRESS';
      update('supportRequests', req.id, patch);
      notify(req.memberId, `Phản hồi yêu cầu: ${req.title}`, content.length > 80 ? content.slice(0, 80) + '…' : content);
    } else {
      // Member trả lời: mở lại nếu đã đóng, thông báo cho người xử lý (hoặc toàn bộ lễ tân)
      if (req.status === 'RESOLVED') update('supportRequests', req.id, { status: 'IN_PROGRESS' });
      const targets = req.handledBy ? [req.handledBy] : staffIds;
      targets.forEach((t) => notify(t, `Thành viên trả lời: ${req.title}`, `${me.fullName}: ${content.length > 80 ? content.slice(0, 80) + '…' : content}`));
    }
    setText('');
  };

  const setStatus = (st: 'IN_PROGRESS' | 'RESOLVED' | 'OPEN') => {
    update('supportRequests', req.id, { status: st, handledBy: st === 'OPEN' ? req.handledBy : (req.handledBy ?? me.id) });
    if (st === 'RESOLVED') {
      add('supportMessages', { requestId: req.id, senderId: me.id, content: '✅ Yêu cầu đã được đánh dấu hoàn tất. Nếu cần thêm hỗ trợ, bạn chỉ cần trả lời tại đây.', createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
      notify(req.memberId, `Đã xử lý xong: ${req.title}`, 'Yêu cầu của bạn đã được hoàn tất. Cảm ơn bạn!');
      log('RESOLVE_SUPPORT', 'SupportRequest', req.id, `Hoàn tất yêu cầu "${req.title}" của ${nameOf(req.memberId)}`);
    }
    if (st === 'OPEN') { staffIds.forEach((t) => notify(t, `Mở lại yêu cầu: ${req.title}`, `${me.fullName} đã mở lại yêu cầu.`)); }
    message.success('Đã cập nhật trạng thái');
  };

  return (
    <Drawer open={!!requestId} onClose={onClose} width={520} styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 } }}
      title={<div><div style={{ fontWeight: 700 }}>{req.title}</div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>#{req.id.toUpperCase()} · {member?.fullName} · {dayjs(req.createdAt).fromNow()}</div></div>}
      extra={<StatusTag value={req.status} />}
    >
      <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #eef1f6', fontSize: 13 }}>
        <div style={{ color: '#64748b', fontSize: 11, letterSpacing: '.06em', marginBottom: 4 }}>NỘI DUNG YÊU CẦU</div>
        <div>{req.content}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tag style={{ background: '#fff' }}>Người xử lý: <b>{req.handledBy ? nameOf(req.handledBy) : 'Chưa tiếp nhận'}</b></Tag>
          {isStaff && req.status === 'OPEN' && <Button size="small" onClick={() => setStatus('IN_PROGRESS')}>Tiếp nhận xử lý</Button>}
          {isStaff && req.status !== 'RESOLVED' && <Popconfirm title="Đánh dấu đã xử lý xong?" onConfirm={() => setStatus('RESOLVED')}><Button size="small" type="primary" icon={<CheckCircleOutlined />}>Hoàn tất</Button></Popconfirm>}
          {req.status === 'RESOLVED' && <Button size="small" icon={<ReloadOutlined />} onClick={() => setStatus('OPEN')}>Mở lại</Button>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {msgs.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>{isStaff ? 'Chưa có phản hồi. Hãy trả lời thành viên.' : 'Lễ tân sẽ phản hồi sớm. Bạn có thể bổ sung thông tin bên dưới.'}</div>}
        {msgs.map((m) => {
          const mine = m.senderId === me.id;
          const sender = userById(m.senderId);
          return (
            <div key={m.id} style={{ display: 'flex', gap: 10, marginBottom: 14, flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              <Tooltip title={sender?.fullName}><Avatar size={30} style={{ background: `${avatarColor(sender)}1a`, color: avatarColor(sender), fontWeight: 600, fontSize: 11, flexShrink: 0 }}>{initialsOf(sender?.fullName)}</Avatar></Tooltip>
              <div style={{ maxWidth: '78%' }}>
                {!mine && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{sender?.fullName} · <StatusTag value={sender?.role} /></div>}
                <div style={{ background: mine ? '#2563eb' : '#f1f5f9', color: mine ? '#fff' : '#0f172a', padding: '9px 13px', borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{m.content}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{dayjs(m.createdAt).format('HH:mm DD/MM')}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #eef1f6', background: '#fff' }}>
        {req.status === 'RESOLVED' && !isStaff && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Yêu cầu đã hoàn tất — trả lời sẽ tự động mở lại yêu cầu.</div>}
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={isStaff ? 'Trả lời thành viên…' : 'Nhập phản hồi…'}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button type="primary" icon={<SendOutlined />} onClick={send} disabled={!text.trim()}>Gửi</Button>
        </Space.Compact>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Enter để gửi · Shift+Enter xuống dòng</div>
      </div>
    </Drawer>
  );
}
