import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { motion } from 'motion/react';
import { ArrowLeftOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { theme } from '../theme';
import './auth.css';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface AuthVisual {
  image: string;
  imagePosition?: string;
  kicker: string;
  title: string;
  lead: string;
  /** Hàng số liệu nhanh (3 mục) hoặc danh sách bước — chọn một. */
  facts?: { v: string; l: string }[];
  steps?: string[];
}

/** Khung 2 cột cho các trang đăng nhập / đăng ký: ảnh + thông điệp bên trái, form bên phải. */
export default function AuthShell({ children, width = 420, visual }: { children: ReactNode; width?: number; visual: AuthVisual }) {
  return (
    <ConfigProvider theme={{ ...theme, token: { ...theme.token, colorPrimary: '#0f4d34', colorInfo: '#0f4d34', colorLink: '#0f4d34', borderRadius: 6, borderRadiusLG: 8, controlHeight: 44, fontFamily: "'Barlow', 'Inter', system-ui, sans-serif", fontSize: 15 } }}>
      <div className="au">
        <aside className="au-visual" style={{ '--pos': visual.imagePosition } as React.CSSProperties}>
          <motion.img src={visual.image} alt="" initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease: EASE }} />
          <Link to="/" className="au-brand"><i><ThunderboltFilled /></i>Sports Center</Link>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }}>
            <p className="au-kicker">{visual.kicker}</p>
            <h1 className="au-title">{visual.title}</h1>
            <p className="au-lead">{visual.lead}</p>
            {visual.facts && (
              <div className="au-facts">{visual.facts.map((f) => <div key={f.l}><b>{f.v}</b><small>{f.l}</small></div>)}</div>
            )}
            {visual.steps && (
              <ol className="au-steps">{visual.steps.map((s, i) => <li key={s}><b>{i + 1}</b>{s}</li>)}</ol>
            )}
          </motion.div>
          <div className="au-foot">SWP391 · FA26 · Prototype — dữ liệu giả lập trong trình duyệt</div>
        </aside>

        <main className="au-form">
          <div className="au-form-top"><Link to="/" className="au-back"><ArrowLeftOutlined /> Về trang chủ</Link></div>
          <motion.div className="au-card" style={{ maxWidth: width }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}>
            {children}
          </motion.div>
        </main>
      </div>
    </ConfigProvider>
  );
}
