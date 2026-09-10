import type { ReactNode } from 'react';
import { CalendarOutlined, RobotOutlined, SafetyCertificateOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: <CalendarOutlined />, title: 'Lớp học & lịch tập', desc: 'Quản lý bộ môn, phòng tập, phân công HLV, kiểm tra trùng lịch tự động.' },
  { icon: <SafetyCertificateOutlined />, title: 'Gói thành viên & thanh toán', desc: 'Đăng ký, gia hạn, hóa đơn và báo cáo doanh thu theo thời gian thực.' },
  { icon: <RobotOutlined />, title: 'AI đồng hành', desc: 'Gợi ý bài tập theo mục tiêu và trợ lý trả lời 24/7 cho học viên.' },
];

export default function AuthShell({ children, width = 400 }: { children: ReactNode; width?: number }) {
  return (
    <div className="sc-login">
      <div className="sc-login-hero">
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 8px 20px rgba(37,99,235,.4)' }}><ThunderboltFilled /></div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Sports Center</div>
        </Link>
        <div>
          <h1 style={{ fontSize: 40, lineHeight: 1.15, fontWeight: 700, letterSpacing: -1, margin: '0 0 16px', maxWidth: 520 }}>Vận hành trung tâm thể thao <span style={{ color: '#fb923c' }}>trong một nền tảng</span></h1>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, maxWidth: 480, margin: '0 0 40px' }}>Thành viên, lớp học, huấn luyện viên, thanh toán và AI hỗ trợ tập luyện — tất cả ở một nơi.</p>
          <div style={{ display: 'grid', gap: 18, maxWidth: 520 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="sc-fade" style={{ display: 'flex', gap: 14, animationDelay: `${0.15 + i * 0.1}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div><div style={{ fontWeight: 600 }}>{f.title}</div><div style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>{f.desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 44 }}>
            {[['1.200+', 'thành viên'], ['48', 'lớp học / tuần'], ['12', 'huấn luyện viên']].map(([n, l]) => (
              <div key={l}><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{n}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>SWP391 · FA26 · Sports Center Management System</div>
      </div>
      <div className="sc-login-form">
        <div className="sc-fade" style={{ width: '100%', maxWidth: width }}>{children}</div>
      </div>
    </div>
  );
}
