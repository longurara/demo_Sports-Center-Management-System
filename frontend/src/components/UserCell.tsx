import { Avatar } from 'antd';
import { useApp } from '../store/AppContext';
import type { User } from '../types';

const ROLE_COLOR: Record<string, string> = { MANAGER: '#c94a1e', COACH: '#0f4d34', MEMBER: '#0891b2', RECEPTIONIST: '#d9a400' };

export const avatarColor = (u?: User) => ROLE_COLOR[u?.role ?? ''] ?? '#7a776f';
export const initialsOf = (name?: string) => (name ?? '?').split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

/** Avatar + tên + dòng phụ, dùng thống nhất trong các bảng. Truyền sub="" để ẩn dòng phụ. */
export default function UserCell({ id, user, sub, size = 34 }: { id?: string; user?: User; sub?: string; size?: number }) {
  const { userById } = useApp();
  const u = user ?? userById(id);
  if (!u) return <span style={{ color: '#9a968c' }}>—</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <Avatar size={size} style={{ background: `${avatarColor(u)}1a`, color: avatarColor(u), fontWeight: 600, fontSize: size * 0.36, flexShrink: 0 }}>{initialsOf(u.fullName)}</Avatar>
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.fullName}</div>
        {sub !== '' && <div style={{ fontSize: 12, color: '#7a776f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub ?? u.email}</div>}
      </div>
    </div>
  );
}
