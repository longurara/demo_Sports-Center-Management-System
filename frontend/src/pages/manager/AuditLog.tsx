import { useState } from 'react';
import { DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';

export default function AuditLogPage() {
  const { data } = useApp();
  const [user, setUser] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const actions = Array.from(new Set(data.auditLogs.map((a) => a.action)));
  const rows = data.auditLogs.filter((a) =>
    (!user || a.userId === user) && (!action || a.action === action) && (!q || a.detail.toLowerCase().includes(q.toLowerCase())) &&
    (!range || (a.createdAt >= range[0].format('YYYY-MM-DD') && a.createdAt <= range[1].format('YYYY-MM-DD') + ' 23:59')),
  );

  return (
    <Page title="Lịch sử thao tác hệ thống" subtitle="Audit log các hành động quan trọng">
      <Space wrap style={{ marginBottom: 16 }}>
        <Select placeholder="Người thực hiện" allowClear style={{ width: 200 }} onChange={setUser} options={data.users.filter((u) => u.role !== 'MEMBER').map((u) => ({ value: u.id, label: u.fullName }))} />
        <Select placeholder="Hành động" allowClear style={{ width: 180 }} onChange={setAction} options={actions.map((a) => ({ value: a, label: a }))} />
        <DatePicker.RangePicker onChange={(v) => setRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Input.Search placeholder="Tìm nội dung" allowClear onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
      </Space>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 10 }} columns={[
        { title: 'Thời gian', dataIndex: 'createdAt', width: 150 },
        { title: 'Người thực hiện', render: (_, r) => <UserCell id={r.userId} /> },
        { title: 'Hành động', dataIndex: 'action', render: (v) => <Tag>{v}</Tag> },
        { title: 'Đối tượng', render: (_, r) => `${r.entity} #${r.entityId}` },
        { title: 'Chi tiết', dataIndex: 'detail' },
      ]} />
    </Page>
  );
}
