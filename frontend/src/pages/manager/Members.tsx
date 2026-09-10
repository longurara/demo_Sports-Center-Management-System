import { useState } from 'react';
import { Button, Input, Popconfirm, Select, Space, Table, message } from 'antd';
import { EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';

export default function Members() {
  const { data, membershipStatus, activeSubscription, update, log } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();

  const rows = data.users
    .filter((u) => u.role === 'MEMBER')
    .filter((u) => !q || u.fullName.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q) || u.email.includes(q))
    .map((u) => ({ ...u, ms: membershipStatus(u.id), sub: activeSubscription(u.id) }))
    .filter((u) => !status || u.ms === status);

  const toggleLock = (id: string, cur: string, name: string) => {
    const next = cur === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    update('users', id, { status: next });
    log(next === 'LOCKED' ? 'LOCK_USER' : 'UNLOCK_USER', 'User', id, `${next === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản ${name}`);
    message.success('Đã cập nhật trạng thái tài khoản');
  };

  return (
    <Page title="Quản lý thành viên" subtitle={`${rows.length} thành viên`}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="Tìm theo tên, SĐT, email" allowClear style={{ width: 280 }} onChange={(e) => setQ(e.target.value)} />
        <Select placeholder="Trạng thái gói" allowClear style={{ width: 180 }} onChange={setStatus}
          options={[{ value: 'ACTIVE', label: 'Còn hạn' }, { value: 'EXPIRING', label: 'Sắp hết hạn' }, { value: 'EXPIRED', label: 'Hết hạn' }, { value: 'NONE', label: 'Chưa có gói' }]} />
      </Space>
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Thành viên', dataIndex: 'fullName', sorter: (a, b) => a.fullName.localeCompare(b.fullName), render: (_, r) => <UserCell user={r} /> },
          { title: 'SĐT', dataIndex: 'phone' },
          { title: 'Gói hiện tại', render: (_, r) => <span style={{ whiteSpace: 'nowrap' }}>{r.sub ? data.plans.find((p) => p.id === r.sub!.planId)?.name : '—'}</span> },
          { title: 'Hết hạn', render: (_, r) => <span style={{ whiteSpace: 'nowrap' }}>{r.sub ? dayjs(r.sub.endDate).format('DD/MM/YYYY') : '—'}</span> },
          { title: 'Trạng thái gói', dataIndex: 'ms', render: (v) => <StatusTag value={v} /> },
          { title: 'Tài khoản', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          {
            title: '', render: (_, r) => (
              <Space>
                <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/manager/members/${r.id}`)}>Chi tiết</Button>
                <Popconfirm title={r.status === 'ACTIVE' ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'} onConfirm={() => toggleLock(r.id, r.status, r.fullName)}>
                  <Button size="small" danger={r.status === 'ACTIVE'} icon={r.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Page>
  );
}
