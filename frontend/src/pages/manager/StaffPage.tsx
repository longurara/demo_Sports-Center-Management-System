import { useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';
import type { Role, User } from '../../types';

export default function StaffPage({ role }: { role: Extract<Role, 'COACH' | 'RECEPTIONIST'> }) {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();
  const isCoach = role === 'COACH';
  const title = isCoach ? 'Huấn luyện viên' : 'Nhân viên lễ tân';
  const rows = data.users.filter((u) => u.role === role);

  const openModal = (u?: User) => { setEditing(u ?? null); form.resetFields(); if (u) form.setFieldsValue(u); setOpen(true); };

  const save = (v: Partial<User>) => {
    if (editing) {
      update('users', editing.id, v);
      log('UPDATE_USER', 'User', editing.id, `Cập nhật ${title.toLowerCase()} ${v.fullName}`);
    } else {
      const u = add('users', { ...(v as User), role, status: 'ACTIVE', createdAt: dayjs().format('YYYY-MM-DD') });
      log('CREATE_USER', 'User', u.id, `Tạo tài khoản ${title.toLowerCase()} ${u.fullName}`);
    }
    message.success('Đã lưu');
    setOpen(false);
  };

  const toggle = (u: User) => {
    const next = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    update('users', u.id, { status: next });
    log(next === 'LOCKED' ? 'DISABLE_USER' : 'ENABLE_USER', 'User', u.id, `${next === 'LOCKED' ? 'Vô hiệu hóa' : 'Kích hoạt'} ${u.fullName}`);
  };

  return (
    <Page title={`Quản lý ${title.toLowerCase()}`} subtitle={`${rows.length} tài khoản`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo tài khoản</Button>}>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: title, dataIndex: 'fullName', render: (_, r) => <UserCell user={r} /> },
          { title: 'SĐT', dataIndex: 'phone' },
          ...(isCoach ? [
            { title: 'Chuyên môn', dataIndex: 'specialty' },
            { title: 'Lớp phụ trách', render: (_: unknown, r: User) => data.classes.filter((c) => c.coachId === r.id && c.status === 'OPEN').length },
          ] : []),
          { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          {
            title: '', render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => openModal(r)}>Sửa</Button>
                <Popconfirm title={r.status === 'ACTIVE' ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt lại?'} onConfirm={() => toggle(r)}>
                  <Button size="small" danger={r.status === 'ACTIVE'}>{r.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? `Cập nhật ${title.toLowerCase()}` : `Tạo tài khoản ${title.toLowerCase()}`} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="phone" label="SĐT" rules={[{ required: true }]}><Input /></Form.Item>
          {!editing && <Form.Item name="password" label="Mật khẩu tạm" rules={[{ required: true }]}><Input.Password /></Form.Item>}
          {isCoach && <>
            <Form.Item name="specialty" label="Chuyên môn" rules={[{ required: true }]}><Input placeholder="VD: Gym / Yoga / Boxing" /></Form.Item>
            <Form.Item name="bio" label="Giới thiệu"><Input.TextArea rows={3} /></Form.Item>
          </>}
        </Form>
      </Modal>
    </Page>
  );
}
