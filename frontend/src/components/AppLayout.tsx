import { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Layout, Popover, Space, Tooltip } from 'antd';
import { AppstoreOutlined, BellOutlined, LogoutOutlined, MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined, ReloadOutlined, SearchOutlined, ThunderboltFilled, UserOutlined } from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { flatNav, mobileTabs } from '../routes';
import dayjs from 'dayjs';
import GlobalSearch from './GlobalSearch';
import SideNav from './SideNav';
import { useApp } from '../store/AppContext';
import { labelOf } from './StatusTag';
import { initialsOf } from './UserCell';

const { Header, Content } = Layout;
const ROLE_COLOR: Record<string, string> = { MANAGER: '#c94a1e', COACH: '#0f4d34', MEMBER: '#0891b2', RECEPTIONIST: '#d9a400' };

export default function AppLayout() {
  const { currentUser, logout, myNotifications, resetData, update } = useApp();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sc_nav_collapsed') === '1'; } catch { return false; } });
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // < 768px

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

  // Thanh tab dưới cùng trên mobile: 4 mục đầu của vai trò + nút Menu mở drawer
  const tabItems = mobileTabs[currentUser.role].map((t) => ({ ...flatNav(currentUser.role).find((i) => i.key === t.key)!, label: t.label })).filter((t) => t.key);
  const isActive = (key: string) => (key === base ? pathname === base : pathname === key || pathname.startsWith(key + '/'));

  return (
    <Layout style={{ minHeight: '100vh' }} hasSider={!isMobile}>
      {!isMobile && <SideNav collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />}
      {isMobile && (
        <Drawer placement="left" open={navOpen} onClose={() => setNavOpen(false)} closable={false} width={288} className="sc-nav-drawer" styles={{ body: { padding: 0 } }}>
          <SideNav collapsed={false} mobile onToggle={() => setNavOpen(false)} onNavigate={() => setNavOpen(false)} />
        </Drawer>
      )}
      <Layout>
        <Header className="sc-header" style={{ padding: isMobile ? '0 12px' : '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Button type="text" icon={<MenuOutlined style={{ fontSize: 18 }} />} onClick={() => setNavOpen(true)} />
              <Link to={base} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#14130f', textDecoration: 'none', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d6f24b', color: '#14130f', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}><ThunderboltFilled /></span>
                <b style={{ fontSize: 14, whiteSpace: 'nowrap' }}>Sports Center</b>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Tooltip title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} placement="bottom">
                <button className="sc-collapse-btn" onClick={() => setCollapsed((c) => !c)}>{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</button>
              </Tooltip>
              <button className="sc-search-trigger" onClick={() => setSearchOpen(true)}>
                <SearchOutlined className="ico" />
                <span className="ph">Tìm thành viên, lớp học, hóa đơn…</span>
                <span className="keys"><kbd>Ctrl</kbd><kbd>K</kbd></span>
              </button>
            </div>
          )}
          <Space size={isMobile ? 0 : 4}>
            {isMobile && <Button type="text" icon={<SearchOutlined style={{ fontSize: 17 }} />} onClick={() => setSearchOpen(true)} />}
            {!isMobile && <Tooltip title="Reset dữ liệu demo"><Button type="text" icon={<ReloadOutlined />} onClick={resetData} /></Tooltip>}
            {isMobile ? (
              <Badge count={unread} size="small" offset={[-4, 4]}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 17 }} />} onClick={() => navigate(`${base}/notifications`)} />
              </Badge>
            ) : (
            <Popover placement="bottomRight" trigger="click" arrow={false} styles={{ container: { width: 360, padding: 0 } }} content={
              <div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #ece8df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Thông báo</b>
                  {unread > 0 && <a style={{ fontSize: 12 }} onClick={() => notis.forEach((n) => !n.read && update('notifications', n.id, { read: true }))}>Đọc tất cả</a>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notis.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9a968c' }}>Không có thông báo</div>}
                  {notis.slice(0, 6).map((n) => (
                    <div key={n.id} onClick={() => { update('notifications', n.id, { read: true }); navigate(`${base}/notifications`); }} style={{ display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer', background: n.read ? undefined : '#f5f8ff', borderBottom: '1px solid #f4f6fb' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: n.read ? '#e2ddd2' : '#0f4d34', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: n.read ? 500 : 600, fontSize: 13 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#7a776f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.content}</div>
                        <div style={{ fontSize: 11, color: '#9a968c' }}>{dayjs(n.createdAt).fromNow()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #ece8df' }}><a onClick={() => navigate(`${base}/notifications`)}>Xem tất cả thông báo</a></div>
              </div>
            }>
              <Badge count={unread} size="small" offset={[-4, 4]}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 17 }} />} />
              </Badge>
            </Popover>
            )}
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân', onClick: () => navigate(`${base}/profile`) },
                  ...(isMobile ? [{ key: 'reset', icon: <ReloadOutlined />, label: 'Reset dữ liệu demo', onClick: resetData }] : []),
                  { type: 'divider' as const },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: () => { logout(); navigate('/login'); } },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginLeft: isMobile ? 4 : 8, padding: isMobile ? 2 : '4px 10px 4px 4px', borderRadius: 999, border: '1px solid #ece8df', background: '#fff' }}>
                <Avatar size={30} style={{ background: `${roleColor}22`, color: roleColor, fontWeight: 700, fontSize: 12 }}>{initialsOf(currentUser.fullName)}</Avatar>
                {!isMobile && (
                  <div style={{ lineHeight: 1.15 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.fullName}</div>
                    <div style={{ fontSize: 11, color: roleColor, fontWeight: 600 }}>{labelOf(currentUser.role)}</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: isMobile ? '14px 12px 84px' : '24px 28px 40px', maxWidth: 1440, width: '100%', margin: '0 auto', minWidth: 0 }}>
          <Outlet />
        </Content>
        {isMobile && (
          <nav className="sc-tabbar">
            {tabItems.map((it) => (
              <Link key={it.key} to={it.key} className={`sc-tabbar-item${isActive(it.key) ? ' active' : ''}`}>
                <span className="ico">{it.icon}</span><span className="lbl">{it.label}</span>
              </Link>
            ))}
            <a className="sc-tabbar-item" onClick={() => setNavOpen(true)}><span className="ico"><AppstoreOutlined /></span><span className="lbl">Menu</span></a>
          </nav>
        )}
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Layout>
    </Layout>
  );
}
