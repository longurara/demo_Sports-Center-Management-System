import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Page from '../../components/Page';
import { useApp } from '../../store/AppContext';
import type { Room, Sport } from '../../types';

export function Sports() {
  const { data, add, update, remove, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sport | null>(null);
  const [form] = Form.useForm();
  const openModal = (s?: Sport) => { setEditing(s ?? null); form.resetFields(); if (s) form.setFieldsValue(s); setOpen(true); };
  const save = (v: Omit<Sport, 'id'>) => {
    if (editing) update('sports', editing.id, v); else { const s = add('sports', v); log('CREATE_SPORT', 'Sport', s.id, `Tạo bộ môn ${s.name}`); }
    message.success('Đã lưu'); setOpen(false);
  };
  return (
    <Page title="Bộ môn" subtitle="Danh mục bộ môn thể thao của trung tâm" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm bộ môn</Button>}>
      <Table rowKey="id" dataSource={data.sports} pagination={false} columns={[
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Mô tả', dataIndex: 'description' },
        { title: 'Số lớp', render: (_, r) => data.classes.filter((c) => c.sportId === r.id).length },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button><Popconfirm title="Xóa bộ môn?" onConfirm={() => remove('sports', r.id)}><Button size="small" danger disabled={data.classes.some((c) => c.sportId === r.id)}>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Sửa bộ môn' : 'Thêm bộ môn'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên bộ môn" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}

export function Rooms() {
  const { data, add, update, remove, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form] = Form.useForm();
  const openModal = (r?: Room) => { setEditing(r ?? null); form.resetFields(); if (r) form.setFieldsValue(r); setOpen(true); };
  const save = (v: Omit<Room, 'id'>) => {
    if (editing) update('rooms', editing.id, v); else { const r = add('rooms', v); log('CREATE_ROOM', 'Room', r.id, `Tạo phòng ${r.name}`); }
    message.success('Đã lưu'); setOpen(false);
  };
  return (
    <Page title="Phòng tập" subtitle="Quản lý phòng và sức chứa" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm phòng</Button>}>
      <Table rowKey="id" dataSource={data.rooms} pagination={false} columns={[
        { title: 'Tên phòng', dataIndex: 'name' },
        { title: 'Vị trí', dataIndex: 'location' },
        { title: 'Sức chứa', dataIndex: 'capacity' },
        { title: 'Lớp đang dùng', render: (_, r) => data.classes.filter((c) => c.roomId === r.id && c.status === 'OPEN').map((c) => c.name).join(', ') || '—' },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button><Popconfirm title="Xóa phòng?" onConfirm={() => remove('rooms', r.id)}><Button size="small" danger disabled={data.classes.some((c) => c.roomId === r.id)}>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Sửa phòng' : 'Thêm phòng'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên phòng" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="location" label="Vị trí"><Input /></Form.Item>
          <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
