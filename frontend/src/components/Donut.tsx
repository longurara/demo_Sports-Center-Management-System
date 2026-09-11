import type { ReactNode } from 'react';

interface Item { label: string; value: number; color: string; hint?: string }

/** Donut chart thuần CSS (conic-gradient) — nhẹ, ổn định trong mọi kích thước container. */
export default function Donut({ items, size = 150, thickness = 22, center, format }: { items: Item[]; size?: number; thickness?: number; center?: ReactNode; format?: (v: number) => string }) {
  const total = Math.max(1, items.reduce((s, i) => s + i.value, 0));
  let acc = 0;
  const stops = items.map((i) => { const from = acc; acc += (i.value / total) * 100; return `${i.color} ${from}% ${acc}%`; }).join(', ');
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${stops})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: size - thickness * 2, height: size - thickness * 2, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{center}</div>
      </div>
      <div style={{ flex: 1, minWidth: 160, display: 'grid', gap: 8 }}>
        {items.map((i) => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: i.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: '#3d3b35' }}>{i.label}{i.hint && <span style={{ color: '#9a968c', fontSize: 12 }}> · {i.hint}</span>}</span>
            <b>{format ? format(i.value) : i.value}</b>
            <span style={{ color: '#9a968c', width: 38, textAlign: 'right' }}>{Math.round((i.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
