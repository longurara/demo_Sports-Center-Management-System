import { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Layout, Popover, Space, Tooltip } from 'antd';
import { BellOutlined, LogoutOutlined, ReloadOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import GlobalSearch from './GlobalSearch';
import SideNav from './SideNav';
import { useApp } from '../store/AppContext';
import { labelOf } from './StatusTag';
import { initialsOf } from './UserCell';

const { Header, Content } = Layout;
const ROLE_COLOR: Record<string, string> = { MANAGER: '#f97316', COACH: '#2563eb', MEMBER: '#16a34a', RECEPTIONIST: '#eab308' };

export default function AppLayout() {
  const { currentUser, logout, myNotifications, resetData, update } = useApp();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sc_nav_collapsed') === '1'; } catch { return false; } });
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { try { localStorage.setItem('sc_nav_collapsed', collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);

  if (!currentUser) return null;
  const notis = myNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = notis.filter((n) => !n.read).length;
  const base = `/${currentUser.role.toLowerCase()}`;
  const roleColor = ROLE_COLOR[currentUser.role];

  return (
    <Layout style={{ minHeight: '100vh' }} hasSider>
      <SideNav collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Layout>
        <Header className="sc-header" style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => setSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f6fb', borderRadius: 10, padding: '7px 12px', width: 320, color: '#94a3b8', fontSize: 13, cursor: 'pointer', border: '1px solid transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#dbe6ff')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}>
            <SearchOutlined /> Tìm thành viên, lớp, hóa đơn… <span style={{ marginLeft: 'auto', fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 6px', background: '#fff' }}>Ctrl K</span>
          </div>
          <Space size={4}>
            <Tooltip title="Reset dữ liệu demo"><Button type="text" icon={<ReloadOutlined />} onClick={resetData} /></Tooltip>
            <Popover placement="bottomRight" trigger="click" arrow={false} styles={{ container: { width: 360, padding: 0 } }} content={
              <div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef1f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Thông báo</b>
                  {unread > 0 && <a style={{ fontSize: 12 }} onClick={() => notis.forEach((n) => !n.read && update('notifications', n.id, { read: true }))}>Đọc tất cả</a>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notis.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Không có thông báo</div>}
                  {notis.slice(0, 6).map((n) => (
                    <div key={n.id} onClick={() => { update('notifications', n.id, { read: true }); navigate(`${base}/notifications`); }} style={{ display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer', background: n.read ? undefined : '#f5f8ff', borderBottom: '1px solid #f4f6fb' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: n.read ? '#e2e8f0' : '#2563eb', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: n.read ? 500 : 600, fontSize: 13 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.content}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{dayjs(n.createdAt).fromNow()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #eef1f6' }}><a onClick={() => navigate(`${base}/notifications`)}>Xem tất cả thông báo</a></div>
              </div>
            }>
              <Badge count={unread} size="small" offset={[-4, 4]}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 17 }} />} />
              </Badge>
            </Popover>
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân', onClick: () => navigate(`${base}/profile`) },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: () => { logout(); navigate('/login'); } },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginLeft: 8, padding: '4px 10px 4px 4px', borderRadius: 999, border: '1px solid #eef1f6', background: '#fff' }}>
                <Avatar size={30} style={{ background: `${roleColor}22`, color: roleColor, fontWeight: 700, fontSize: 12 }}>{initialsOf(currentUser.fullName)}</Avatar>
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.fullName}</div>
                  <div style={{ fontSize: 11, color: roleColor, fontWeight: 600 }}>{labelOf(currentUser.role)}</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: '24px 28px 40px', maxWidth: 1440, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </Content>
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Layout>
    </Layout>
  );
}
