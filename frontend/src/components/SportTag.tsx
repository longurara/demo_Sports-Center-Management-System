import { Tag } from 'antd';
import { useApp } from '../store/AppContext';

/** Nhãn bộ môn: icon + tên, màu theo bộ môn. */
export default function SportTag({ id, size = 'default' }: { id?: string; size?: 'small' | 'default' }) {
  const { data } = useApp();
  const s = data.sports.find((x) => x.id === id);
  if (!s) return <Tag style={{ margin: 0 }}>—</Tag>;
  return (
    <Tag style={{ margin: 0, background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}33`, fontWeight: 600, fontSize: size === 'small' ? 11 : 12, padding: size === 'small' ? '0 6px' : '1px 8px' }}>
      <span style={{ marginRight: 4 }}>{s.icon}</span>{s.name}
    </Tag>
  );
}
