import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Space, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Room, Sport } from '../../types';

const COLORS = ['#2563eb', '#9333ea', '#dc2626', '#0891b2', '#16a34a', '#ca8a04', '#ea580c', '#f97316', '#db2777', '#15803d', '#0f766e', '#7c3aed'];

export function Sports() {
  const { data, add, update, remove, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sport | null>(null);
  const [form] = Form.useForm();
  const openModal = (s?: Sport) => { setEditing(s ?? null); form.resetFields(); form.setFieldsValue(s ?? { color: COLORS[data.sports.length % COLORS.length] }); setOpen(true); };
  const save = (v: Omit<Sport, 'id'>) => {
    if (editing) update('sports', editing.id, v); else { const s = add('sports', v); log('CREATE_SPORT', 'Sport', s.id, `Tạo bộ môn ${s.name}`); }
    message.success('Đã lưu'); setOpen(false);
  };
  const stat = (id: string) => ({
    classes: data.classes.filter((c) => c.sportId === id && c.status === 'OPEN').length,
    rooms: data.rooms.filter((r) => r.sportId === id && r.type === 'ROOM').length,
    courts: data.rooms.filter((r) => r.sportId === id && r.type === 'COURT').length,
    coaches: data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE' && u.sportIds?.includes(id)),
    students: new Set(data.enrollments.filter((e) => e.status === 'ACTIVE' && data.classes.some((c) => c.id === e.classId && c.sportId === id)).map((e) => e.memberId)).size,
    plans: data.plans.filter((p) => p.active && (p.sportIds.length === 0 || p.sportIds.includes(id))).length,
  });

  const courtFrom = (id: string) => Math.min(...data.rooms.filter((r) => r.sportId === id && r.type === 'COURT').map((r) => r.hourlyRate ?? 0));

  return (
    <Page title="Bộ môn thể thao" subtitle={`${data.sports.length} bộ môn · ${data.rooms.filter((r) => r.type === 'ROOM').length} phòng tập · ${data.rooms.filter((r) => r.type === 'COURT').length} sân cho thuê`}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm bộ môn</Button>}>
      {/* Bảng vận hành: không icon/màu trang trí; mỗi dòng là một bộ môn với số liệu thật */}
      <Table rowKey="id" dataSource={data.sports} pagination={false} className="sc-sport-table" columns={[
        { title: '#', width: 56, render: (_, __, i) => <span className="sc-roster-idx" style={{ fontSize: 22 }}>{String(i + 1).padStart(2, '0')}</span> },
        { title: 'Bộ môn', render: (_, s) => <div><div className="sc-sport-name">{s.name}</div><div style={{ fontSize: 13, color: '#7a776f' }}>{s.description}</div></div> },
        { title: 'Cơ sở', render: (_, s) => { const st = stat(s.id); return st.rooms + st.courts === 0 ? <span style={{ color: '#c94a1e', fontWeight: 600 }}>Chưa có phòng/sân</span>
          : <div style={{ lineHeight: 1.4 }}><b>{st.courts > 0 ? `${st.courts} sân` : `${st.rooms} phòng tập`}</b><div style={{ fontSize: 12.5, color: '#7a776f' }}>{st.courts > 0 ? `Thuê theo giờ · từ ${fmtMoney(courtFrom(s.id))}/giờ` : 'Học theo lớp'}</div></div>; } },
        { title: 'Lớp mở', align: 'right', width: 90, render: (_, s) => <b>{stat(s.id).classes}</b> },
        { title: 'Học viên', align: 'right', width: 100, render: (_, s) => <b>{stat(s.id).students}</b> },
        { title: 'Gói áp dụng', align: 'right', width: 110, render: (_, s) => <b>{stat(s.id).plans}</b> },
        { title: 'Huấn luyện viên', render: (_, s) => { const cs = stat(s.id).coaches; return cs.length === 0 ? <span style={{ color: '#c94a1e', fontWeight: 600 }}>Chưa có HLV</span> : <span>{cs.map((c) => c.fullName).join(' · ')}</span>; } },
        { title: '', width: 120, align: 'right', render: (_, s) => { const st = stat(s.id); const used = st.classes > 0 || st.rooms + st.courts > 0; return (
          <Space>
            <Button size="small" onClick={() => openModal(s)}>Sửa</Button>
            <Popconfirm title="Xóa bộ môn?" onConfirm={() => remove('sports', s.id)}><Button size="small" danger disabled={used}>Xóa</Button></Popconfirm>
          </Space>); } },
      ]} />
      <Modal title={editing ? 'Sửa bộ môn' : 'Thêm bộ môn'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={(v) => save({ ...v, icon: editing?.icon ?? '' })}>
          <Form.Item name="name" label="Tên bộ môn" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="color" label="Màu trên lịch" extra="Chỉ dùng để phân biệt lớp trên thời khóa biểu.">
            <Select options={COLORS.map((c) => ({ value: c, label: <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: c, marginRight: 8, verticalAlign: -1 }} />{c}</span> }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}

export function Rooms() {
  const { data, add, update, remove, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ROOM' | 'COURT'>('ALL');
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);
  const openModal = (r?: Room) => { setEditing(r ?? null); form.resetFields(); form.setFieldsValue(r ?? { type: 'ROOM' }); setOpen(true); };
  const save = (v: Omit<Room, 'id'>) => {
    if (editing) update('rooms', editing.id, v); else { const r = add('rooms', v); log('CREATE_ROOM', 'Room', r.id, `Tạo ${v.type === 'COURT' ? 'sân' : 'phòng'} ${r.name}`); }
    message.success('Đã lưu'); setOpen(false);
  };
  const rows = data.rooms.filter((r) => filter === 'ALL' || r.type === filter);
  const weekBookings = (id: string) => data.courtBookings.filter((b) => b.courtId === id && b.status !== 'CANCELLED' && b.date >= new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) && b.date <= new Date().toISOString().slice(0, 10));

  return (
    <Page title="Phòng tập & sân" subtitle="Phòng tập dùng cho lớp học theo lịch; sân cho thuê theo khung giờ và cũng có thể xếp lớp"
      extra={<Space><Segmented value={filter} onChange={(v) => setFilter(v as typeof filter)} options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'ROOM', label: 'Phòng tập' }, { value: 'COURT', label: 'Sân' }]} /><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm phòng / sân</Button></Space>}>
      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: 'Tên', dataIndex: 'name', render: (v, r) => <><b>{v}</b><div style={{ fontSize: 12, color: '#64748b' }}>{r.location}</div></> },
        { title: 'Loại', dataIndex: 'type', render: (v) => v === 'COURT' ? <Tag color="cyan" style={{ margin: 0 }}>Sân</Tag> : <Tag style={{ margin: 0 }}>Phòng tập</Tag> },
        { title: 'Bộ môn', render: (_, r) => <SportTag id={r.sportId} /> },
        { title: 'Sức chứa', dataIndex: 'capacity', align: 'center', render: (v) => `${v} người` },
        { title: 'Giá thuê', align: 'right', render: (_, r) => r.type === 'COURT' ? <b className="sc-nowrap">{fmtMoney(r.hourlyRate ?? 0)}/giờ</b> : <span style={{ color: '#94a3b8' }}>—</span> },
        { title: 'Lớp đang dùng', render: (_, r) => { const cls = data.classes.filter((c) => c.roomId === r.id && c.status === 'OPEN'); return cls.length ? <Space wrap size={[4, 4]}>{cls.map((c) => <Tag key={c.id} style={{ margin: 0, background: '#f1f5f9', color: '#334155' }}>{c.name}</Tag>)}</Space> : <span style={{ color: '#94a3b8' }}>—</span>; } },
        { title: 'Lượt đặt 7 ngày', align: 'center', render: (_, r) => r.type === 'COURT' ? <b>{weekBookings(r.id).length}</b> : <span style={{ color: '#94a3b8' }}>—</span> },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button><Popconfirm title="Xóa?" onConfirm={() => remove('rooms', r.id)}><Button size="small" danger disabled={data.classes.some((c) => c.roomId === r.id) || data.courtBookings.some((b) => b.courtId === r.id)}>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Sửa phòng / sân' : 'Thêm phòng / sân'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="type" label="Loại"><Segmented options={[{ value: 'ROOM', label: 'Phòng tập (theo lớp)' }, { value: 'COURT', label: 'Sân (đặt theo giờ)' }]} /></Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input placeholder={type === 'COURT' ? 'VD: Sân cầu lông 5' : 'VD: Phòng Gym B'} /></Form.Item>
          <Form.Item name="sportId" label="Bộ môn" rules={[{ required: true }]}><Select options={data.sports.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))} /></Form.Item>
          <Form.Item name="location" label="Vị trí"><Input /></Form.Item>
          <Form.Item name="capacity" label="Sức chứa (người)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          {type === 'COURT' && <Form.Item name="hourlyRate" label="Giá thuê / giờ (₫)" rules={[{ required: true }]}><InputNumber min={0} step={10000} style={{ width: '100%' }} /></Form.Item>}
        </Form>
      </Modal>
    </Page>
  );
}
