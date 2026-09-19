import { useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, coachSportIds } from '../../utils/classes';
import type { Room, Sport } from '../../types';

const COLORS = ['#2563eb', '#9333ea', '#dc2626', '#0891b2', '#16a34a', '#ca8a04', '#ea580c', '#f97316', '#db2777', '#15803d', '#0f766e', '#7c3aed'];

/** Bộ môn (UC_2.1) — soft delete; không xóa khi có lớp ONGOING, xóa khi có lớp DRAFT/PENDING/OPEN thì hủy lớp + hoàn 100% (BR_1.13). */
export function Sports() {
  const { data, add, update, log, cancelClass } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sport | null>(null);
  const [form] = Form.useForm();
  const rows = data.sports.filter((s) => !s.deletedAt);
  const openModal = (s?: Sport) => { setEditing(s ?? null); form.resetFields(); form.setFieldsValue(s ?? { color: COLORS[data.sports.length % COLORS.length], icon: '🏅' }); setOpen(true); };
  const save = (v: Omit<Sport, 'id'>) => {
    if (rows.some((s) => s.name.trim().toLowerCase() === v.name.trim().toLowerCase() && s.id !== editing?.id)) { message.error('Tên bộ môn đã tồn tại'); return; }
    if (editing) { update('sports', editing.id, v); log('UPDATE_SPORT', 'Sport', editing.id, `Cập nhật bộ môn ${v.name}`); } else { const s = add('sports', v); log('CREATE_SPORT', 'Sport', s.id, `Tạo bộ môn ${s.name}`); }
    message.success('Đã lưu'); setOpen(false);
  };
  const stat = (id: string) => ({
    ongoing: data.classes.filter((c) => c.sportId === id && classPhase(c) === 'ONGOING'),
    pending: data.classes.filter((c) => c.sportId === id && ['DRAFT', 'PENDING_APPROVAL', 'OPEN'].includes(classPhase(c))),
    rooms: data.rooms.filter((r) => !r.deletedAt && r.sportIds.includes(id)),
    coaches: data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE' && coachSportIds(data, u.id).includes(id)),
    students: new Set(data.enrollments.filter((e) => e.status === 'ENROLLED' && data.classes.some((c) => c.id === e.classId && c.sportId === id)).map((e) => e.memberId)).size,
    courses: data.courses.filter((c) => !c.deletedAt && c.sportId === id).length,
  });
  const del = (s: Sport) => {
    const st = stat(s.id);
    let refunded = 0;
    st.pending.forEach((c) => { refunded += cancelClass(c.id, `bộ môn ${s.name} bị xóa`).refunded; });
    update('sports', s.id, { deletedAt: dayjs().format('YYYY-MM-DD HH:mm') });
    log('DELETE_SPORT', 'Sport', s.id, `Xóa mềm bộ môn ${s.name}: hủy ${st.pending.length} lớp, hoàn ${fmtMoney(refunded)}`);
    message.success(`Đã xóa bộ môn${st.pending.length ? `, hủy ${st.pending.length} lớp và hoàn ${fmtMoney(refunded)}` : ''}`);
  };

  return (
    <Page title="Bộ môn thể thao" subtitle={`${rows.length} bộ môn · ${data.rooms.filter((r) => !r.deletedAt).length} facility`}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm bộ môn</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={false} className="sc-sport-table" columns={[
        { title: '#', width: 56, render: (_, __, i) => <span className="sc-roster-idx" style={{ fontSize: 22 }}>{String(i + 1).padStart(2, '0')}</span> },
        { title: 'Bộ môn', render: (_, s) => <div><div className="sc-sport-name">{s.icon} {s.name}</div><div style={{ fontSize: 13, color: '#7a776f' }}>{s.description}</div></div> },
        { title: 'Facility', render: (_, s) => { const st = stat(s.id); return st.rooms.length ? <Space wrap size={[4, 4]}>{st.rooms.map((r) => <Tag key={r.id} style={{ margin: 0 }}>{r.name}</Tag>)}</Space> : <span style={{ color: '#c94a1e', fontWeight: 600 }}>Chưa có facility</span>; } },
        { title: 'Khóa', align: 'right', width: 70, render: (_, s) => <b>{stat(s.id).courses}</b> },
        { title: 'Lớp', align: 'right', width: 110, render: (_, s) => { const st = stat(s.id); return <span className="sc-nowrap"><b>{st.ongoing.length}</b> đang học · {st.pending.length} chờ</span>; } },
        { title: 'Học viên', align: 'right', width: 90, render: (_, s) => <b>{stat(s.id).students}</b> },
        { title: 'HLV (đã duyệt)', render: (_, s) => { const cs = stat(s.id).coaches; return cs.length === 0 ? <span style={{ color: '#c94a1e', fontWeight: 600 }}>Chưa có HLV</span> : <span>{cs.map((c) => c.fullName).join(' · ')}</span>; } },
        { title: '', width: 130, align: 'right', render: (_, s) => { const st = stat(s.id); return (
          <Space>
            <Button size="small" onClick={() => openModal(s)}>Sửa</Button>
            <Popconfirm title={st.pending.length ? `Xóa bộ môn sẽ hủy ${st.pending.length} lớp chưa học và hoàn 100% học phí. Tiếp tục?` : 'Xóa mềm bộ môn?'} onConfirm={() => del(s)} disabled={st.ongoing.length > 0}>
              <Button size="small" danger disabled={st.ongoing.length > 0} title={st.ongoing.length ? 'Đang có lớp ONGOING — không xóa được' : ''}>Xóa</Button>
            </Popconfirm>
          </Space>); } },
      ]} />
      <Modal title={editing ? 'Sửa bộ môn' : 'Thêm bộ môn'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên bộ môn" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Space size={16}>
            <Form.Item name="icon" label="Icon"><Input style={{ width: 80 }} /></Form.Item>
            <Form.Item name="color" label="Màu trên lịch" style={{ width: 200 }}>
              <Select options={COLORS.map((c) => ({ value: c, label: <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: c, marginRight: 8, verticalAlign: -1 }} />{c}</span> }))} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Page>
  );
}

/** Facility (UC_2.2): loại gym/court/room/field, capacity_per_slot, n-n bộ môn, giá / slot, is_active, soft delete. */
export function Rooms() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [filter, setFilter] = useState<'ALL' | Room['type']>('ALL');
  const [form] = Form.useForm();
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const openModal = (r?: Room) => { setEditing(r ?? null); form.resetFields(); form.setFieldsValue(r ?? { type: 'COURT', capacity: 1, isActive: true, sportIds: [] }); setOpen(true); };
  const save = (v: Omit<Room, 'id'>) => {
    if (data.rooms.some((r) => !r.deletedAt && r.name.trim().toLowerCase() === v.name.trim().toLowerCase() && r.id !== editing?.id)) { message.error('Tên facility đã tồn tại'); return; }
    if (editing) { update('rooms', editing.id, v); log('UPDATE_FACILITY', 'Facility', editing.id, `Cập nhật ${v.name}`); } else { const r = add('rooms', v); log('CREATE_FACILITY', 'Facility', r.id, `Tạo facility ${r.name} (${v.type}, ${v.capacity} chỗ/slot)`); }
    message.success('Đã lưu'); setOpen(false);
  };
  const rows = data.rooms.filter((r) => !r.deletedAt && (filter === 'ALL' || r.type === filter));
  const futureUse = (id: string) => ({
    bookings: data.bookings.filter((b) => b.roomId === id && b.status === 'CONFIRMED' && `${b.date} ${b.startTime}` >= now).length,
    sessions: data.sessions.filter((s) => s.roomId === id && s.status === 'SCHEDULED' && `${s.date} ${s.startTime}` >= now && data.classes.find((c) => c.id === s.classId)?.status !== 'CANCELLED').length,
  });
  const weekBookings = (id: string) => data.bookings.filter((b) => b.roomId === id && b.status === 'CONFIRMED' && b.date >= dayjs().subtract(6, 'day').format('YYYY-MM-DD') && b.date <= dayjs().format('YYYY-MM-DD')).length;

  return (
    <Page title="Cơ sở vật chất (Facility)" subtitle="Phòng/sân gộp chung; capacity = số booking đồng thời mỗi slot (gym 20, sân cầu lông 1). Facility đa năng gắn nhiều bộ môn."
      extra={<Space><Segmented value={filter} onChange={(v) => setFilter(v as typeof filter)} options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'GYM', label: 'Gym' }, { value: 'COURT', label: 'Sân' }, { value: 'ROOM', label: 'Phòng' }, { value: 'FIELD', label: 'Sân ngoài trời' }]} /><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm facility</Button></Space>}>
      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: 'Tên', dataIndex: 'name', render: (v, r) => <><b>{v}</b><div style={{ fontSize: 12, color: '#64748b' }}>{r.location}</div></> },
        { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
        { title: 'Bộ môn', render: (_, r) => <Space wrap size={[4, 4]}>{r.sportIds.map((id) => <SportTag key={id} id={id} size="small" />)}</Space> },
        { title: 'Capacity / slot', dataIndex: 'capacity', align: 'center', render: (v) => v === 1 ? <Tag style={{ margin: 0 }}>1 booking</Tag> : <Tag color="blue" style={{ margin: 0 }}>{v} người</Tag> },
        { title: 'Giá / slot', dataIndex: 'pricePerSlot', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
        { title: 'Lịch sắp tới', render: (_, r) => { const f = futureUse(r.id); return <span className="sc-nowrap">{f.bookings} booking · {f.sessions} buổi</span>; } },
        { title: 'Lượt đặt 7 ngày', align: 'center', render: (_, r) => <b>{weekBookings(r.id)}</b> },
        { title: 'Nhận đặt', render: (_, r) => <Switch checked={r.isActive} checkedChildren="Bật" unCheckedChildren="Tắt" onChange={(on) => { const f = futureUse(r.id); if (!on && (f.bookings || f.sessions)) { message.error(`Còn ${f.bookings} booking / ${f.sessions} buổi tương lai — xử lý qua lịch bảo trì trước`); return; } update('rooms', r.id, { isActive: on }); log(on ? 'ENABLE_FACILITY' : 'DISABLE_FACILITY', 'Facility', r.id, `${on ? 'Mở' : 'Ngừng'} nhận đặt ${r.name}`); }} /> },
        { title: '', render: (_, r) => { const f = futureUse(r.id); return <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button><Popconfirm title="Xóa mềm facility? Lịch sử booking vẫn tham chiếu được." onConfirm={() => { update('rooms', r.id, { deletedAt: now, isActive: false }); log('DELETE_FACILITY', 'Facility', r.id, `Xóa mềm ${r.name}`); }} disabled={f.bookings + f.sessions > 0}><Button size="small" danger disabled={f.bookings + f.sessions > 0}>Xóa</Button></Popconfirm></Space>; } },
      ]} />
      <Modal title={editing ? 'Sửa facility' : 'Thêm facility'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="type" label="Loại"><Segmented options={[{ value: 'GYM', label: 'Gym' }, { value: 'COURT', label: 'Sân' }, { value: 'ROOM', label: 'Phòng' }, { value: 'FIELD', label: 'Ngoài trời' }]} /></Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input placeholder="VD: Sân cầu lông 5" /></Form.Item>
          <Form.Item name="sportIds" label="Bộ môn hỗ trợ" rules={[{ required: true, message: 'Chọn ít nhất 1 bộ môn' }]} extra="Phòng đa năng chọn nhiều bộ môn (facility_sports)"><Select mode="multiple" options={data.sports.filter((s) => !s.deletedAt).map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))} /></Form.Item>
          <Form.Item name="location" label="Vị trí"><Input /></Form.Item>
          <Space size={16}>
            <Form.Item name="capacity" label="Capacity / slot" rules={[{ required: true }]} extra="Số booking đồng thời"><InputNumber min={1} style={{ width: 140 }} /></Form.Item>
            <Form.Item name="pricePerSlot" label="Giá / slot (₫)" rules={[{ required: true }]}><InputNumber min={0} step={10000} style={{ width: 160 }} /></Form.Item>
            <Form.Item name="isActive" label="Nhận đặt" valuePropName="checked"><Switch /></Form.Item>
          </Space>
          {editing && <Alert type="info" showIcon title="Sửa capacity / bộ môn không tự đổi booking, buổi học đã có; kiểm tra xung đột trước khi giảm capacity." />}
        </Form>
      </Modal>
    </Page>
  );
}
