import { useState } from 'react';
import { Button, Input, Space, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';

export default function MemberLookup() {
  const { data, membershipStatus, activeSubscription } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const rows = data.users.filter((u) => u.role === 'MEMBER').filter((u) => !q || u.fullName.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q) || u.id.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));

  return (
    <Page title="Tra cứu thành viên" subtitle="Tìm theo tên, số điện thoại, mã thành viên hoặc email">
      <Input.Search size="large" placeholder="Nhập tên / SĐT / mã TV..." allowClear autoFocus style={{ marginBottom: 16 }} onChange={(e) => setQ(e.target.value)} />
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }} columns={[
        { title: 'Thành viên', dataIndex: 'fullName', render: (_, r) => <UserCell user={r} sub={`${r.id.toUpperCase()} · ${r.phone}`} /> },
        { title: 'Gói', render: (_, r) => { const s = activeSubscription(r.id); return s ? `${data.plans.find((p) => p.id === s.planId)?.name} (đến ${s.endDate})` : '—'; } },
        { title: 'Trạng thái gói', render: (_, r) => <StatusTag value={membershipStatus(r.id)} /> },
        { title: 'Tài khoản', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => <Space><Button size="small" type="primary" onClick={() => navigate(`/receptionist/members/${r.id}`)}>Xem</Button></Space> },
      ]} />
    </Page>
  );
}
