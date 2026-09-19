import { Avatar, Tooltip } from 'antd';
import { CloseOutlined, LogoutOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { navByRole, type Badge } from '../routes';
import { useApp } from '../store/AppContext';
import { labelOf } from './StatusTag';
import { initialsOf } from './UserCell';
import { coachSportIds } from '../utils/classes';

const ROLE_COLOR: Record<string, string> = { MANAGER: '#e07a4f', COACH: '#5cbf8a', MEMBER: '#38bdf8', RECEPTIONIST: '#eab308' };

export default function SideNav({ collapsed, onToggle, mobile, onNavigate }: { collapsed: boolean; onToggle: () => void; mobile?: boolean; onNavigate?: () => void }) {
  const { data, currentUser, logout, membershipStatus, cart } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (!currentUser) return null;
  const role = currentUser.role;
  const sections = navByRole[role];
  const roleColor = ROLE_COLOR[role];

  // Số liệu cho badge — tính nhẹ, chỉ khi cần
  const badgeValue = (b?: Badge): number => {
    if (!b) return 0;
    if (b === 'support') return data.supportRequests.filter((r) => { if (r.status === 'RESOLVED' || r.status === 'CLOSED') return false; const m = data.supportMessages.filter((x) => x.requestId === r.id).sort((a, c) => a.createdAt.localeCompare(c.createdAt)); const last = m[m.length - 1]; return !last || last.senderId === r.memberId; }).length;
    if (b === 'supportReply') return data.supportRequests.filter((r) => r.memberId === currentUser.id && r.status !== 'RESOLVED' && r.status !== 'CLOSED').filter((r) => { const m = data.supportMessages.filter((x) => x.requestId === r.id).sort((a, c) => a.createdAt.localeCompare(c.createdAt)); const last = m[m.length - 1]; return last && last.senderId !== currentUser.id; }).length;
    if (b === 'expiring') return data.users.filter((u) => u.role === 'MEMBER' && membershipStatus(u.id) === 'EXPIRING').length;
    if (b === 'courtsToday') return data.bookings.filter((x) => x.date === dayjs().format('YYYY-MM-DD') && x.status === 'CONFIRMED' && data.rooms.find((r) => r.id === x.roomId)?.type !== 'GYM').length;
    if (b === 'todaySessions') return data.sessions.filter((s) => s.date === dayjs().format('YYYY-MM-DD') && s.status === 'SCHEDULED' && data.classes.some((c) => c.id === s.classId && c.coachId === currentUser.id && c.status === 'OPEN')).length;
    if (b === 'pendingClasses') return data.classes.filter((c) => c.status === 'PENDING_APPROVAL').length;
    if (b === 'pendingSpecs') return data.coachSpecializations.filter((s) => s.status === 'PENDING').length;
    if (b === 'openForCoach') { const mine = coachSportIds(data, currentUser.id); return data.classes.filter((c) => !c.coachId && (c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL') && mine.includes(c.sportId) && !data.coachRegistrations.some((r) => r.classId === c.id && r.coachId === currentUser.id && r.status === 'PENDING')).length; }
    if (b === 'cart') return cart.lines.length;
    return 0;
  };
  const isActive = (key: string) => { const base = `/${role.toLowerCase()}`; return key === base ? pathname === base : pathname === key || pathname.startsWith(key + '/'); };

  return (
    <div className={`sc-nav${collapsed ? ' collapsed' : ''}${mobile ? ' mobile' : ''}`}>
      {/* Brand */}
      <div className="sc-nav-brand">
        <div className="sc-nav-logo"><ThunderboltFilled /></div>
        {!collapsed && <div className="sc-nav-brand-text"><div className="t">Sports Center</div><div className="s">Management System</div></div>}
        {mobile && <button className="sc-nav-close" onClick={onToggle}><CloseOutlined /></button>}
      </div>

      {/* Role chip */}
      {!collapsed && (
        <div className="sc-nav-role">
          <span className="dot" style={{ background: roleColor, boxShadow: `0 0 0 3px ${roleColor}33` }} />
          {labelOf(role)}
          <span className="date">{dayjs().format('ddd, DD/MM')}</span>
        </div>
      )}

      {/* Sections */}
      <nav className="sc-nav-scroll">
        {sections.map((sec, i) => (
          <div key={i} className="sc-nav-section">
            {sec.title && !collapsed && <div className="sc-nav-section-title">{sec.title}</div>}
            {sec.title && collapsed && <div className="sc-nav-section-line" />}
            {sec.items.map((it) => {
              const active = isActive(it.key);
              const n = badgeValue(it.badge);
              const node = (
                <Link key={it.key} to={it.key} onClick={onNavigate} className={`sc-nav-item${active ? ' active' : ''}`}>
                  <span className="ico">{it.icon}</span>
                  {!collapsed && <span className="lbl">{it.label}</span>}
                  {n > 0 && <span className={`bdg${collapsed ? ' mini' : ''}`}>{collapsed ? '' : n}</span>}
                </Link>
              );
              return collapsed ? <Tooltip key={it.key} title={n > 0 ? `${it.label} (${n})` : it.label} placement="right">{node}</Tooltip> : node;
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sc-nav-user" onClick={() => { onNavigate?.(); navigate(`/${role.toLowerCase()}/profile`); }}>
        <Avatar size={collapsed ? 34 : 38} style={{ background: `${roleColor}26`, color: roleColor, fontWeight: 700, fontSize: 13, flexShrink: 0, border: `1px solid ${roleColor}55` }}>{initialsOf(currentUser.fullName)}</Avatar>
        {!collapsed && (
          <>
            <div className="meta">
              <div className="n">{currentUser.fullName}</div>
              <div className="e">{currentUser.email}</div>
            </div>
            <Tooltip title="Đăng xuất"><button className="sc-nav-logout" onClick={(e) => { e.stopPropagation(); logout(); navigate('/login'); }}><LogoutOutlined /></button></Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
