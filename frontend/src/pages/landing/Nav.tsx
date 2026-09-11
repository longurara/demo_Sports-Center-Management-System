import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { CloseOutlined, MenuOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { EASE } from './ui';

const LINKS = [
  { href: '#sports', label: 'Bộ môn' },
  { href: '#features', label: 'Đặt sân & lớp học' },
  { href: '#benefits', label: 'Thành viên' },
  { href: '#pricing', label: 'Bảng giá' },
  { href: '#info', label: 'Giờ mở cửa' },
];

export default function Nav() {
  const { currentUser } = useApp();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // Header trong suốt ở đầu trang → nền tối khi cuộn; ẩn khi cuộn xuống, hiện lại khi cuộn lên.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev && !open);
  });

  const dashboard = currentUser ? `/${currentUser.role.toLowerCase()}` : null;

  return (
    <>
      <motion.header className={`lp-nav ${scrolled ? 'scrolled' : ''}`} animate={{ y: hidden ? -90 : 0 }} transition={{ duration: 0.4, ease: EASE }}>
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand"><span className="lp-brand-logo"><ThunderboltFilled /></span>Sports Center</Link>
          <nav className="lp-nav-links">
            {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="lp-nav-cta">
            {dashboard
              ? <Link to={dashboard} className="lp-btn lp-btn-primary sm">Vào hệ thống →</Link>
              : <>
                <Link to="/login" className="lp-link">Đăng nhập</Link>
                <Link to="/login" className="lp-btn lp-btn-primary sm">Đặt sân</Link>
              </>}
          </div>
          <button className="lp-burger" onClick={() => setOpen(true)} aria-label="Mở menu"><MenuOutlined /></button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div className="lp-mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <button className="lp-burger close" onClick={() => setOpen(false)} aria-label="Đóng menu"><CloseOutlined /></button>
            <motion.nav initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}>
              {LINKS.map((l) => (
                <motion.a key={l.href} href={l.href} onClick={() => setOpen(false)} variants={{ hidden: { y: 30, opacity: 0 }, show: { y: 0, opacity: 1 } }}>{l.label}</motion.a>
              ))}
              <motion.div variants={{ hidden: { y: 30, opacity: 0 }, show: { y: 0, opacity: 1 } }} style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                {dashboard
                  ? <Link to={dashboard} className="lp-btn lp-btn-primary">Vào hệ thống →</Link>
                  : <><Link to="/login" className="lp-btn lp-btn-ghost light">Đăng nhập</Link><Link to="/register" className="lp-btn lp-btn-primary">Đăng ký</Link></>}
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
