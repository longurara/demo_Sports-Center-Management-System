import { Avatar } from 'antd';
import { useApp } from '../store/AppContext';
import type { User } from '../types';

const ROLE_COLOR: Record<string, string> = { MANAGER: '#f97316', COACH: '#2563eb', MEMBER: '#16a34a', RECEPTIONIST: '#eab308' };

export const avatarColor = (u?: User) => ROLE_COLOR[u?.role ?? ''] ?? '#64748b';
export const initialsOf = (name?: string) => (name ?? '?').split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

/** Avatar + tên + dòng phụ, dùng thống nhất trong các bảng. Truyền sub="" để ẩn dòng phụ. */
export default function UserCell({ id, user, sub, size = 34 }: { id?: string; user?: User; sub?: string; size?: number }) {
  const { userById } = useApp();
  const u = user ?? userById(id);
  if (!u) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <Avatar size={size} style={{ background: `${avatarColor(u)}1a`, color: avatarColor(u), fontWeight: 600, fontSize: size * 0.36, flexShrink: 0 }}>{initialsOf(u.fullName)}</Avatar>
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.fullName}</div>
        {sub !== '' && <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub ?? u.email}</div>}
      </div>
    </div>
  );
}
