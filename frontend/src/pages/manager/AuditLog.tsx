import { useState } from 'react';
import { Button, DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';

const PAGE = 15;

/** Audit log (UC_1.12): bắt buộc date range (mặc định 7 ngày), cursor pagination "tải thêm" (BR_G.7/G.8). */
export default function AuditLogPage() {
  const { data } = useApp();
  const [user, setUser] = useState<string | undefined>();
  const [entity, setEntity] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]);
  const [cursor, setCursor] = useState(PAGE);

  const entities = Array.from(new Set(data.auditLogs.map((a) => a.entity))).sort();
  const rows = data.auditLogs.filter((a) =>
    (!user || a.userId === user) && (!entity || a.entity === entity) && (!q || a.detail.toLowerCase().includes(q.toLowerCase()) || a.action.toLowerCase().includes(q.toLowerCase())) &&
    a.createdAt >= range[0].format('YYYY-MM-DD') && a.createdAt <= range[1].format('YYYY-MM-DD') + ' 23:59',
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Page title="Lịch sử thao tác hệ thống" subtitle={`Audit log ${range[0].format('DD/MM')} – ${range[1].format('DD/MM/YYYY')} · ${rows.length} bản ghi · không log Read/check-in/notification, không chứa mật khẩu/OTP/token`}>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} allowClear={false} onChange={(v) => { if (v && v[0] && v[1]) { setRange([v[0], v[1]]); setCursor(PAGE); } }} presets={[
          { label: '7 ngày', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
          { label: '30 ngày', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('day')] },
        ]} />
        <Select placeholder="Người thực hiện" allowClear style={{ width: 200 }} onChange={(v) => { setUser(v); setCursor(PAGE); }} options={[{ value: 'system', label: 'Hệ thống' }, ...data.users.filter((u) => u.role !== 'MEMBER').map((u) => ({ value: u.id, label: u.fullName }))]} />
        <Select placeholder="Đối tượng" allowClear style={{ width: 200 }} onChange={(v) => { setEntity(v); setCursor(PAGE); }} options={entities.map((a) => ({ value: a, label: a }))} />
        <Input.Search placeholder="Tìm hành động / nội dung" allowClear onChange={(e) => { setQ(e.target.value); setCursor(PAGE); }} style={{ width: 240 }} />
      </Space>
      <Table rowKey="id" dataSource={rows.slice(0, cursor)} pagination={false} columns={[
        { title: 'Thời gian', dataIndex: 'createdAt', width: 150, render: (v) => <span className="sc-nowrap">{v}</span> },
        { title: 'Người thực hiện', render: (_, r) => r.userId === 'system' ? <Tag>Hệ thống / cron</Tag> : <UserCell id={r.userId} /> },
        { title: 'Hành động', dataIndex: 'action', render: (v) => <Tag>{v}</Tag> },
        { title: 'Đối tượng', render: (_, r) => <span className="sc-nowrap">{r.entity} #{r.entityId}</span> },
        { title: 'Chi tiết', dataIndex: 'detail' },
      ]} />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {cursor < rows.length ? <Button onClick={() => setCursor((c) => c + PAGE)}>Tải thêm ({rows.length - cursor} còn lại)</Button> : <span style={{ fontSize: 12, color: '#9a968c' }}>Đã hiển thị hết trong khoảng ngày đã chọn</span>}
      </div>
    </Page>
  );
}
