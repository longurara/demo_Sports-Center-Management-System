import { Button, Empty, Segmented, Tooltip } from 'antd';
import { BellOutlined, CalendarOutlined, CheckOutlined, DollarOutlined, FileTextOutlined, WarningOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { useApp } from '../../store/AppContext';

const kindOf = (title: string) => {
  const t = title.toLowerCase();
  if (/hết hạn|khóa/.test(t)) return { icon: <WarningOutlined />, color: '#f59e0b' };
  if (/lịch|lớp|phân công/.test(t)) return { icon: <CalendarOutlined />, color: '#2563eb' };
  if (/thanh toán|gia hạn|kích hoạt|hóa đơn/.test(t)) return { icon: <DollarOutlined />, color: '#16a34a' };
  if (/bài tập|kế hoạch|kết quả|nhận xét/.test(t)) return { icon: <FileTextOutlined />, color: '#9333ea' };
  return { icon: <BellOutlined />, color: '#64748b' };
};

export default function Notifications() {
  const { myNotifications, update } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const all = myNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = filter === 'unread' ? all.filter((n) => !n.read) : all;
  const unread = all.filter((n) => !n.read).length;

  return (
    <Page title="Thông báo" subtitle={unread ? `${unread} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'} extra={
      <div style={{ display: 'flex', gap: 8 }}>
        <Segmented value={filter} onChange={(v) => setFilter(v as 'all' | 'unread')} options={[{ value: 'all', label: `Tất cả (${all.length})` }, { value: 'unread', label: `Chưa đọc (${unread})` }]} />
        <Button icon={<CheckOutlined />} disabled={!unread} onClick={() => all.forEach((n) => !n.read && update('notifications', n.id, { read: true }))}>Đọc tất cả</Button>
      </div>
    }>
      {list.length === 0 ? <Empty description="Không có thông báo" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((n) => {
            const k = kindOf(n.title);
            return (
              <div key={n.id} onClick={() => !n.read && update('notifications', n.id, { read: true })}
                style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, cursor: n.read ? 'default' : 'pointer', background: n.read ? '#fff' : '#f5f8ff', border: `1px solid ${n.read ? '#f1f4f9' : '#dbe6ff'}`, transition: 'background .15s' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.color}1a`, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{k.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                    <Tooltip title={n.createdAt}><span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{dayjs(n.createdAt).fromNow()}</span></Tooltip>
                  </div>
                  <div style={{ color: '#475569', fontSize: 13.5, marginTop: 2 }}>{n.content}</div>
                </div>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2563eb', marginTop: 6, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
