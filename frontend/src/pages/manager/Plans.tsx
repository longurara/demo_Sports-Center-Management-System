import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Space, Switch, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Plan } from '../../types';

export default function Plans() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form] = Form.useForm();

  const openModal = (p?: Plan) => { setEditing(p ?? null); form.resetFields(); if (p) form.setFieldsValue(p); setOpen(true); };
  const save = (v: Omit<Plan, 'id' | 'active'>) => {
    if (editing) { update('plans', editing.id, v); log('UPDATE_PLAN', 'Plan', editing.id, `Cập nhật gói ${v.name}`); }
    else { const p = add('plans', { ...v, active: true }); log('CREATE_PLAN', 'Plan', p.id, `Tạo gói ${p.name}`); }
    message.success('Đã lưu gói');
    setOpen(false);
  };

  return (
    <Page title="Gói thành viên" subtitle="Quản lý gói, học phí và thời hạn sử dụng" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo gói</Button>}>
      <Table
        rowKey="id"
        dataSource={data.plans}
        pagination={false}
        columns={[
          { title: 'Tên gói', dataIndex: 'name' },
          { title: 'Giá', dataIndex: 'price', render: fmtMoney },
          { title: 'Thời hạn', dataIndex: 'durationDays', render: (v) => `${v} ngày` },
          { title: 'Quyền lợi', dataIndex: 'benefits' },
          { title: 'Đang bán', render: (_, r) => data.subscriptions.filter((s) => s.planId === r.id && s.status === 'ACTIVE').length + ' TV' },
          { title: 'Trạng thái', dataIndex: 'active', render: (v, r) => <Switch checked={v} checkedChildren="Bật" unCheckedChildren="Tắt" onChange={(c) => { update('plans', r.id, { active: c }); log(c ? 'ENABLE_PLAN' : 'DISABLE_PLAN', 'Plan', r.id, `${c ? 'Bật' : 'Ngừng bán'} gói ${r.name}`); }} /> },
          { title: '', render: (_, r) => <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button></Space> },
        ]}
      />
      <Modal title={editing ? 'Cập nhật gói' : 'Tạo gói thành viên'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên gói" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="price" label="Giá (₫)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={50000} /></Form.Item>
          <Form.Item name="durationDays" label="Thời hạn (ngày)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="benefits" label="Quyền lợi"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
