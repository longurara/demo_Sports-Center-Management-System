import { useEffect, useMemo, useState } from 'react';
import { Empty, Input, Modal, Tag } from 'antd';
import { BookOutlined, FileTextOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fmtMoney, useApp } from '../store/AppContext';
import { flatNav } from '../routes';
import UserCell from './UserCell';

interface Hit { key: string; kind: 'member' | 'class' | 'page' | 'invoice'; title: string; sub?: string; to: string; node?: React.ReactNode }

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, currentUser, nameOf } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  useEffect(() => { if (open) { setQ(''); setActive(0); } }, [open]);

  const hits = useMemo<Hit[]>(() => {
    if (!currentUser) return [];
    const role = currentUser.role;
    const base = `/${role.toLowerCase()}`;
    const s = q.trim().toLowerCase();
    const out: Hit[] = [];
    // Trang
    for (const it of flatNav(role)) if (!s || it.label.toLowerCase().includes(s)) out.push({ key: it.key, kind: 'page', title: it.label, sub: it.section ?? 'Trang', to: it.key });
    if (!s) return out.slice(0, 8);
    // Thành viên (manager / receptionist / coach)
    if (role !== 'MEMBER') {
      for (const u of data.users.filter((u) => u.role === 'MEMBER' && (u.fullName.toLowerCase().includes(s) || u.phone.includes(s) || u.email.includes(s) || u.id.toLowerCase() === s))) {
        const to = role === 'COACH' ? `/coach/students/${u.id}` : `${base}/members/${u.id}`;
        out.push({ key: u.id, kind: 'member', title: u.fullName, to, node: <UserCell user={u} sub={`${u.phone} · ${u.email}`} size={30} /> });
      }
    }
    // Lớp học
    for (const c of data.classes.filter((c) => c.name.toLowerCase().includes(s))) {
      const to = role === 'MANAGER' ? `/manager/classes/${c.id}` : role === 'MEMBER' ? `/member/classes/${c.id}` : role === 'COACH' ? `/coach/classes/${c.id}` : '/receptionist/enrollments';
      out.push({ key: c.id, kind: 'class', title: c.name, sub: `HLV ${nameOf(c.coachId)} · ${data.rooms.find((r) => r.id === c.roomId)?.name}`, to });
    }
    // Hóa đơn
    if (role === 'RECEPTIONIST' || role === 'MANAGER' || role === 'MEMBER') {
      for (const p of data.orders.filter((p) => p.orderNumber.toLowerCase().includes(s) && (role !== 'MEMBER' || p.buyerId === currentUser.id)).slice(0, 5)) {
        out.push({ key: p.id, kind: 'invoice', title: p.orderNumber, sub: `${p.buyerId ? nameOf(p.buyerId) : p.guestName} · ${fmtMoney(p.total)}`, to: `${base}/orders/${p.id}` });
      }
    }
    return out.slice(0, 12);
  }, [q, data, currentUser, nameOf]);

  const go = (h: Hit) => { onClose(); navigate(h.to); };
  const ICON = { member: <UserOutlined />, class: <BookOutlined />, page: <SearchOutlined />, invoice: <FileTextOutlined /> };
  const LABEL = { member: 'Thành viên', class: 'Lớp học', page: 'Trang', invoice: 'Hóa đơn' };

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={640} styles={{ body: { padding: 0 }, container: { padding: 0, overflow: 'hidden' } }} style={{ top: 80 }}>
      <Input
        autoFocus size="large" variant="borderless" prefix={<SearchOutlined style={{ color: '#9a968c' }} />} placeholder="Tìm thành viên, lớp học, hóa đơn, trang..."
        value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} style={{ padding: '14px 18px', borderBottom: '1px solid #ece8df', borderRadius: 0 }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && hits[active]) go(hits[active]);
          if (e.key === 'Escape') onClose();
        }}
      />
      <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
        {hits.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có kết quả" style={{ padding: 24 }} />}
        {hits.map((h, i) => (
          <div key={h.kind + h.key} onMouseEnter={() => setActive(i)} onClick={() => go(h)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: i === active ? '#f5f8ff' : undefined }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f1ec', color: '#3d3b35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ICON[h.kind]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {h.node ?? <><div style={{ fontWeight: 600 }}>{h.title}</div>{h.sub && <div style={{ fontSize: 12, color: '#7a776f' }}>{h.sub}</div>}</>}
            </div>
            <Tag style={{ margin: 0, background: '#f3f1ec', color: '#7a776f' }}>{LABEL[h.kind]}</Tag>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid #ece8df', fontSize: 12, color: '#9a968c', display: 'flex', gap: 16 }}>
        <span><kbd>↑↓</kbd> di chuyển</span><span><kbd>Enter</kbd> mở</span><span><kbd>Esc</kbd> đóng</span>
      </div>
    </Modal>
  );
}
