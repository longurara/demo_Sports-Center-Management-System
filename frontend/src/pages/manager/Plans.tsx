import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Plan } from '../../types';

/** Membership package với 4 quyền lợi cố định (BR_1.8): gym_access, booking_discount_pct, class_discount_pct, free_booking_slots_per_month. */
export default function Plans() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form] = Form.useForm();
  const rows = data.plans.filter((p) => !p.deletedAt);
  const activeCount = (id: string) => data.subscriptions.filter((s) => s.planId === id && s.status === 'ACTIVE').length;

  const openModal = (p?: Plan) => { setEditing(p ?? null); form.resetFields(); form.setFieldsValue(p ?? { gymAccess: true, bookingDiscountPct: 0, classDiscountPct: 0, freeBookingSlotsPerMonth: 0, durationDays: 30 }); setOpen(true); };
  const save = (v: Omit<Plan, 'id' | 'active'>) => {
    if (editing) { update('plans', editing.id, v); log('UPDATE_PLAN', 'MembershipPackage', editing.id, `Cập nhật gói ${v.name}${activeCount(editing.id) ? ` (${activeCount(editing.id)} member đang dùng — kỳ đã trả giữ quyền lợi cũ, D07)` : ''}`); }
    else { const p = add('plans', { ...v, active: true }); log('CREATE_PLAN', 'MembershipPackage', p.id, `Tạo gói ${p.name}`); }
    message.success('Đã lưu gói'); setOpen(false);
  };

  return (
    <Page title="Gói thành viên" subtitle="Không cần gói vẫn đặt sân / đăng ký lớp được. Gói chỉ thêm quyền lợi: vào gym, giảm giá đặt sân, giảm học phí, slot sân miễn phí mỗi tháng." extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo gói</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={false} scroll={{ x: 'max-content' }} columns={[
        { title: 'Tên gói', render: (_, r) => <><b>{r.name}</b><div style={{ fontSize: 12.5, color: '#7a776f', maxWidth: 320 }}>{r.description}</div></> },
        { title: 'Giá', dataIndex: 'price', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
        { title: 'Thời hạn', dataIndex: 'durationDays', render: (v) => <span className="sc-nowrap">{v} ngày</span> },
        { title: 'Gym', dataIndex: 'gymAccess', align: 'center', render: (v) => v ? <Tag color="green" style={{ margin: 0 }}>Miễn phí</Tag> : <Tag style={{ margin: 0 }}>—</Tag> },
        { title: 'Giảm đặt sân', dataIndex: 'bookingDiscountPct', align: 'center', render: (v) => v ? <Tag color="cyan" style={{ margin: 0 }}>−{v}%</Tag> : '—' },
        { title: 'Giảm học phí', dataIndex: 'classDiscountPct', align: 'center', render: (v) => v ? <Tag color="geekblue" style={{ margin: 0 }}>−{v}%</Tag> : '—' },
        { title: 'Slot miễn phí / tháng', dataIndex: 'freeBookingSlotsPerMonth', align: 'center', render: (v) => v || '—' },
        { title: 'Đang dùng', align: 'center', render: (_, r) => `${activeCount(r.id)} TV` },
        { title: 'Đang bán', render: (_, r) => <Switch checked={r.active} checkedChildren="Bật" unCheckedChildren="Tắt" onChange={(c) => { update('plans', r.id, { active: c }); log(c ? 'ENABLE_PLAN' : 'DISABLE_PLAN', 'MembershipPackage', r.id, `${c ? 'Bật' : 'Ngừng bán'} gói ${r.name}${!c ? ' — dừng auto-renew các member đang dùng (D07)' : ''}`); if (!c) data.subscriptions.filter((s) => s.planId === r.id && s.autoRenew).forEach((s) => update('subscriptions', s.id, { autoRenew: false })); }} /> },
        { title: '', render: (_, r) => <Space><Button size="small" onClick={() => openModal(r)}>Sửa</Button><Popconfirm title="Xóa mềm gói? Member đang dùng giữ quyền lợi đến hết kỳ." onConfirm={() => { update('plans', r.id, { deletedAt: dayjs().format('YYYY-MM-DD HH:mm'), active: false }); log('DELETE_PLAN', 'MembershipPackage', r.id, `Xóa mềm gói ${r.name}`); }}><Button size="small" danger>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Cập nhật gói' : 'Tạo gói thành viên'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên gói" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả ngắn"><Input.TextArea rows={2} /></Form.Item>
          <Space size={16}>
            <Form.Item name="price" label="Giá (₫)" rules={[{ required: true }]}><InputNumber min={0} step={50000} style={{ width: 160 }} /></Form.Item>
            <Form.Item name="durationDays" label="Thời hạn (ngày)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 140 }} /></Form.Item>
            <Form.Item name="gymAccess" label="Vào gym miễn phí" valuePropName="checked"><Switch /></Form.Item>
          </Space>
          <Space size={16}>
            <Form.Item name="bookingDiscountPct" label="Giảm đặt sân (%)"><InputNumber min={0} max={100} style={{ width: 140 }} /></Form.Item>
            <Form.Item name="classDiscountPct" label="Giảm học phí (%)"><InputNumber min={0} max={100} style={{ width: 140 }} /></Form.Item>
            <Form.Item name="freeBookingSlotsPerMonth" label="Slot miễn phí / tháng"><InputNumber min={0} max={60} style={{ width: 160 }} /></Form.Item>
          </Space>
          <div style={{ fontSize: 12, color: '#9a968c' }}>Thứ tự tính giá: giá gốc → quyền lợi gói → coupon. Gym miễn phí vẫn tạo booking để đếm capacity slot.</div>
        </Form>
      </Modal>
    </Page>
  );
}
