import type { ReactNode } from 'react';
import { Card } from 'antd';

interface Props {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  color?: string; // hex
  hint?: string;
  onClick?: () => void;
}

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export default function StatCard({ title, value, icon, color = '#0f4d34', hint, onClick }: Props) {
  return (
    <Card hoverable={!!onClick} onClick={onClick} style={{ height: '100%' }} styles={{ body: { padding: 20, display: 'flex', alignItems: 'center', height: '100%' } }}>
      <div className="sc-stat" style={{ width: '100%' }}>
        <div className="sc-stat-icon" style={{ background: hexToRgba(color, 0.12), color }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div className="sc-stat-title">{title}</div>
          {/* Số tiền dài: cho phép co chữ theo bề rộng ô, không bao giờ cắt */}
          <div className="sc-stat-value" style={{ fontSize: typeof value === 'string' ? (value.length > 13 ? 'clamp(15px, 1.4vw, 18px)' : value.length > 10 ? 'clamp(16px, 1.6vw, 20px)' : value.length > 7 ? 24 : 28) : 28, whiteSpace: 'nowrap' }}>{value}</div>
          {hint ? <div className="sc-stat-hint" title={hint}>{hint}</div> : <div className="sc-stat-hint">&nbsp;</div>}
        </div>
      </div>
    </Card>
  );
}
