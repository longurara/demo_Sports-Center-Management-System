import { Empty, Segmented } from 'antd';
import { Line } from '@ant-design/plots';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';

export default function BodyMetricsChart({ memberId, height = 240 }: { memberId: string; height?: number }) {
  const { data } = useApp();
  const [field, setField] = useState<'weight' | 'bodyFat'>('weight');
  const rows = data.bodyMetrics.filter((m) => m.memberId === memberId).sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chỉ số cơ thể" />;
  const first = rows[0][field] ?? 0;
  const last = rows[rows.length - 1][field] ?? 0;
  const diff = Math.round((last - first) * 10) / 10;
  const unit = field === 'weight' ? 'kg' : '%';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{last}{unit}</span>
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: diff <= 0 ? '#16a34a' : '#c94a1e' }}>{diff > 0 ? '▲' : '▼'} {Math.abs(diff)}{unit} <span style={{ color: '#9a968c', fontWeight: 400 }}>/ {rows.length} tuần</span></span>
        </div>
        <Segmented size="small" value={field} onChange={(v) => setField(v as 'weight' | 'bodyFat')} options={[{ value: 'weight', label: 'Cân nặng' }, { value: 'bodyFat', label: '% Mỡ' }]} />
      </div>
      <Line
        data={rows.map((r) => ({ date: dayjs(r.date).format('DD/MM'), value: r[field] }))}
        xField="date" yField="value" height={height} smooth
        style={{ stroke: '#0f4d34', lineWidth: 2.5 }}
        point={{ size: 4, style: { fill: '#fff', stroke: '#0f4d34', lineWidth: 2 } }}
        area={{ style: { fill: 'linear-gradient(-90deg, rgba(15,77,52,0.02) 0%, rgba(15,77,52,0.25) 100%)' } }}
        axis={{ y: { grid: true, gridLineDash: [4, 4], labelFormatter: (v: number) => `${v}${unit}` }, x: { grid: false } }}
        tooltip={{ items: [{ channel: 'y', valueFormatter: (v: number) => `${v}${unit}` }] }}
      />
    </div>
  );
}
