import { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Input, Popconfirm, message } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';

const STATUS: Record<string, string> = { OPEN: 'Đang chờ', IN_PROGRESS: 'Đang xử lý', RESOLVED: 'Đã xong' };
const ROLE: Record<string, string> = { RECEPTIONIST: 'Lễ tân', MANAGER: 'Quản lý', COACH: 'HLV', MEMBER: 'Thành viên' };

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

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, requestId]);
  useEffect(() => { setText(''); }, [requestId]);

  if (!req) return <Drawer open={!!requestId} onClose={onClose} />;
  const member = userById(req.memberId);
  const staffIds = data.users.filter((u) => u.role === 'RECEPTIONIST' && u.status === 'ACTIVE').map((u) => u.id);
  const firstStaffReply = msgs.find((m) => m.senderId !== req.memberId);

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
      add('supportMessages', { requestId: req.id, senderId: me.id, content: 'Yêu cầu đã được xử lý xong. Nếu cần thêm hỗ trợ, bạn chỉ cần trả lời tại đây.', createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
      notify(req.memberId, `Đã xử lý xong: ${req.title}`, 'Yêu cầu của bạn đã được hoàn tất. Cảm ơn bạn!');
      log('RESOLVE_SUPPORT', 'SupportRequest', req.id, `Hoàn tất yêu cầu "${req.title}" của ${nameOf(req.memberId)}`);
    }
    if (st === 'OPEN') { staffIds.forEach((t) => notify(t, `Mở lại yêu cầu: ${req.title}`, `${me.fullName} đã mở lại yêu cầu.`)); }
    message.success('Đã cập nhật trạng thái');
  };

  // Tiến trình 3 bước: Đã gửi → Đã tiếp nhận → Đã xong
  const step = req.status === 'RESOLVED' ? 3 : req.status === 'IN_PROGRESS' || req.handledBy || firstStaffReply ? 2 : 1;
  const steps = [
    { label: 'Đã gửi', sub: dayjs(req.createdAt).format('HH:mm DD/MM') },
    { label: 'Đã tiếp nhận', sub: step >= 2 ? (req.handledBy ? nameOf(req.handledBy) : firstStaffReply ? nameOf(firstStaffReply.senderId) : '') : 'Lễ tân đang xem' },
    { label: 'Đã xong', sub: step === 3 && msgs.length ? dayjs(msgs[msgs.length - 1].createdAt).format('HH:mm DD/MM') : '' },
  ];

  return (
    <Drawer open={!!requestId} onClose={onClose} width={560} className="sc-thread" styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 }, header: { display: 'none' } }}>
      {/* Đầu hộp thoại */}
      <div className="sc-thread-head">
        <div className="sc-thread-head-row">
          <small>#{req.id.toUpperCase()} · {ROLE[member?.role ?? 'MEMBER']} {member?.fullName}</small>
          <span className={`sc-sup-status ${req.status.toLowerCase()}`}>{STATUS[req.status]}</span>
        </div>
        <h2>{req.title}</h2>
        <ol className="sc-thread-steps">
          {steps.map((s, i) => <li key={s.label} className={i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''}><b>{s.label}</b><em>{s.sub}</em></li>)}
        </ol>
        {(isStaff || req.status === 'RESOLVED') && (
          <div className="sc-thread-actions">
            {isStaff && req.status === 'OPEN' && <Button size="small" onClick={() => setStatus('IN_PROGRESS')}>Tiếp nhận xử lý</Button>}
            {isStaff && req.status !== 'RESOLVED' && <Popconfirm title="Đánh dấu đã xử lý xong?" onConfirm={() => setStatus('RESOLVED')}><Button size="small" type="primary">Hoàn tất</Button></Popconfirm>}
            {req.status === 'RESOLVED' && <Button size="small" onClick={() => setStatus('OPEN')}>Mở lại yêu cầu</Button>}
          </div>
        )}
        <button type="button" className="sc-thread-close" onClick={onClose} aria-label="Đóng">×</button>
      </div>

      {/* Luồng trao đổi: nội dung yêu cầu là tin đầu tiên */}
      <div className="sc-thread-body">
        <div className="sc-thread-msg">
          <div className="sc-thread-meta"><b>{member?.fullName}</b><span>{ROLE.MEMBER}</span><time>{dayjs(req.createdAt).format('HH:mm DD/MM')}</time></div>
          <div className="sc-thread-text request">{req.content}</div>
        </div>
        {msgs.map((m) => {
          const sender = userById(m.senderId);
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={`sc-thread-msg ${mine ? 'mine' : ''}`}>
              <div className="sc-thread-meta"><b>{mine ? 'Bạn' : sender?.fullName}</b><span>{ROLE[sender?.role ?? 'MEMBER']}</span><time>{dayjs(m.createdAt).format('HH:mm DD/MM')}</time></div>
              <div className="sc-thread-text">{m.content}</div>
            </div>
          );
        })}
        {msgs.length === 0 && <div className="sc-thread-wait">{isStaff ? 'Chưa có phản hồi — hãy trả lời thành viên.' : 'Lễ tân sẽ trả lời trong vòng 24 giờ. Bạn có thể bổ sung thông tin bên dưới.'}</div>}
        <div ref={bottom} />
      </div>

      {/* Ô nhập */}
      <div className="sc-thread-composer">
        {req.status === 'RESOLVED' && !isStaff && <div className="sc-thread-resolved-note">Yêu cầu đã xong — trả lời sẽ tự động mở lại.</div>}
        <div className="sc-chat-composer">
          <Input.TextArea variant="borderless" autoSize={{ minRows: 1, maxRows: 5 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={isStaff ? 'Trả lời thành viên…' : 'Viết cho lễ tân…'}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }} />
          <button type="button" className="sc-chat-send" onClick={send} disabled={!text.trim()} aria-label="Gửi"><ArrowUpOutlined /></button>
        </div>
        <div className="sc-chat-hint" style={{ textAlign: 'left' }}>Enter để gửi · Shift + Enter xuống dòng</div>
      </div>
    </Drawer>
  );
}
