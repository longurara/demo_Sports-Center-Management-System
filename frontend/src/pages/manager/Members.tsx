import { useState } from 'react';
import { Button, Dropdown, Input, Select, Space, Table, message } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Manager xem/sửa/vô hiệu hóa Member (UC_1.7). Trạng thái account: ACTIVE / INACTIVE / BANNED (không xóa). */
export default function Members() {
  const { data, membershipStatus, activeSubscription, update, log } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [acc, setAcc] = useState<string | undefined>();

  const rows = data.users
    .filter((u) => u.role === 'MEMBER')
    .filter((u) => !q || u.fullName.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q) || u.email.includes(q))
    .map((u) => ({ ...u, ms: membershipStatus(u.id), sub: activeSubscription(u.id) }))
    .filter((u) => (!status || u.ms === status) && (!acc || u.status === acc));

  const setAccount = (id: string, name: string, next: 'ACTIVE' | 'INACTIVE' | 'BANNED') => {
    update('users', id, { status: next });
    log(next === 'ACTIVE' ? 'ENABLE_USER' : next === 'BANNED' ? 'BAN_USER' : 'DISABLE_USER', 'Account', id, `${next === 'ACTIVE' ? 'Kích hoạt' : next === 'BANNED' ? 'Cấm' : 'Vô hiệu hóa'} tài khoản ${name}`);
    message.success('Đã cập nhật trạng thái tài khoản');
  };

  return (
    <Page title="Quản lý thành viên" subtitle={`${rows.length} thành viên`}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="Tìm theo tên, SĐT, email" allowClear style={{ width: 280 }} onChange={(e) => setQ(e.target.value)} />
        <Select placeholder="Trạng thái gói" allowClear style={{ width: 180 }} onChange={setStatus}
          options={[{ value: 'ACTIVE', label: 'Còn hạn' }, { value: 'EXPIRING', label: 'Sắp hết hạn' }, { value: 'EXPIRED', label: 'Hết hạn' }, { value: 'NONE', label: 'Chưa có gói' }]} />
        <Select placeholder="Tài khoản" allowClear style={{ width: 160 }} onChange={setAcc} options={['ACTIVE', 'INACTIVE', 'BANNED'].map((s) => ({ value: s, label: <StatusTag value={s} /> }))} />
      </Space>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 8 }} columns={[
        { title: 'Thành viên', dataIndex: 'fullName', sorter: (a, b) => a.fullName.localeCompare(b.fullName), render: (_, r) => <UserCell user={r} /> },
        { title: 'SĐT', dataIndex: 'phone' },
        { title: 'Ví', dataIndex: 'walletBalance', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v ?? 0)}</span> },
        { title: 'Gói hiện tại', render: (_, r) => <span style={{ whiteSpace: 'nowrap' }}>{r.sub ? data.plans.find((p) => p.id === r.sub!.planId)?.name : '—'}</span> },
        { title: 'Hết hạn', render: (_, r) => <span style={{ whiteSpace: 'nowrap' }}>{r.sub ? dayjs(r.sub.endDate).format('DD/MM/YYYY') : '—'}{r.sub?.autoRenew && <small style={{ color: '#16a34a' }}> · auto</small>}</span> },
        { title: 'Trạng thái gói', dataIndex: 'ms', render: (v) => <StatusTag value={v} /> },
        { title: 'Tài khoản', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/manager/members/${r.id}`)}>Chi tiết</Button>
            <Dropdown menu={{ items: [
              ...(r.status !== 'ACTIVE' ? [{ key: 'a', label: 'Kích hoạt', onClick: () => setAccount(r.id, r.fullName, 'ACTIVE') }] : []),
              ...(r.status === 'ACTIVE' ? [{ key: 'i', label: 'Vô hiệu hóa', onClick: () => setAccount(r.id, r.fullName, 'INACTIVE') }] : []),
              ...(r.status !== 'BANNED' ? [{ key: 'b', label: 'Cấm (BANNED)', danger: true, onClick: () => setAccount(r.id, r.fullName, 'BANNED') }] : []),
            ] }}><Button size="small" icon={<MoreOutlined />} /></Dropdown>
          </Space>
        ) },
      ]} />
    </Page>
  );
}
