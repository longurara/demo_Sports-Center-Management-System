import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Progress, Select, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Coupon, OrderItemType } from '../../types';

const TYPES: OrderItemType[] = ['MEMBERSHIP', 'FACILITY_BOOKING', 'FACILITY_PACKAGE', 'COURSE_ENROLLMENT'];

/** Coupon code: 1 mã/đơn, không cộng dồn, không áp cho nạp ví (UC_3.8, §2.5, BR_3.5). */
export default function Coupons() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const today = dayjs().format('YYYY-MM-DD');
  const rows = data.coupons.filter((c) => !c.deletedAt);
  const state = (c: Coupon) => !c.active ? 'OFF' : today < c.validFrom ? 'SOON' : today > c.validTo ? 'EXPIRED' : c.usedCount >= c.maxUses ? 'USED_UP' : 'LIVE';
  const STATE: Record<string, { color: string; label: string }> = { LIVE: { color: 'green', label: 'Đang chạy' }, SOON: { color: 'blue', label: 'Sắp hiệu lực' }, EXPIRED: { color: 'default', label: 'Hết hạn' }, USED_UP: { color: 'orange', label: 'Hết lượt' }, OFF: { color: 'red', label: 'Tắt' } };

  const openModal = (c?: Coupon) => {
    setEditing(c ?? null); form.resetFields();
    form.setFieldsValue(c ? { ...c, range: [dayjs(c.validFrom), dayjs(c.validTo)], applicableTypes: c.applicableTypes ?? [] } : { discountType: 'PERCENT', maxUses: 100, maxUsesPerUser: 1, minOrderAmount: 0, applicableTypes: [], active: true });
    setOpen(true);
  };
  const save = (v: Record<string, unknown>) => {
    const code = (v.code as string).trim().toUpperCase();
    if (rows.some((c) => c.code.toUpperCase() === code && c.id !== editing?.id)) { message.error('Mã đã tồn tại (không phân biệt hoa thường)'); return; }
    const [f, t] = v.range as [dayjs.Dayjs, dayjs.Dayjs];
    const types = (v.applicableTypes as OrderItemType[]) ?? [];
    const payload = { code, discountType: v.discountType as Coupon['discountType'], discountValue: v.discountValue as number, maxDiscount: (v.maxDiscount as number) || undefined, validFrom: f.format('YYYY-MM-DD'), validTo: t.format('YYYY-MM-DD'), maxUses: v.maxUses as number, maxUsesPerUser: v.maxUsesPerUser as number, minOrderAmount: (v.minOrderAmount as number) ?? 0, applicableTypes: types.length ? types : null, active: v.active as boolean };
    if (editing) { update('coupons', editing.id, payload); log('UPDATE_COUPON', 'Coupon', editing.id, `Cập nhật coupon ${code}`); }
    else { const c = add('coupons', { ...payload, usedCount: 0 }); log('CREATE_COUPON', 'Coupon', c.id, `Tạo coupon ${code}`); }
    message.success('Đã lưu coupon'); setOpen(false);
  };

  return (
    <Page title="Coupon" subtitle="Mã giảm giá nhập khi thanh toán · 1 mã / 1 đơn · không áp cho nạp ví · quota đếm theo đơn" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo coupon</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: 'Mã', dataIndex: 'code', render: (v, c) => <><b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14 }}>{v}</b><div><Tag color={STATE[state(c)].color} style={{ margin: '4px 0 0' }}>{STATE[state(c)].label}</Tag></div></> },
        { title: 'Giảm', render: (_, c) => <span className="sc-nowrap"><StatusTag value={c.discountType} /> <b>{c.discountType === 'PERCENT' ? `${c.discountValue}%` : fmtMoney(c.discountValue)}</b>{c.maxDiscount ? <div style={{ fontSize: 12, color: '#7a776f' }}>tối đa {fmtMoney(c.maxDiscount)}</div> : null}</span> },
        { title: 'Hiệu lực', render: (_, c) => <span className="sc-nowrap">{dayjs(c.validFrom).format('DD/MM')} → {dayjs(c.validTo).format('DD/MM/YYYY')}</span> },
        { title: 'Áp dụng', render: (_, c) => c.applicableTypes ? <Space wrap size={[4, 4]}>{c.applicableTypes.map((t) => <StatusTag key={t} value={t} />)}</Space> : <Tag>Mọi dịch vụ</Tag> },
        { title: 'Tối thiểu', dataIndex: 'minOrderAmount', align: 'right', render: (v) => v ? <span className="sc-nowrap">{fmtMoney(v)}</span> : '—' },
        { title: 'Lượt dùng', width: 170, render: (_, c) => <><Progress percent={Math.round(c.usedCount / Math.max(1, c.maxUses) * 100)} size="small" format={() => `${c.usedCount}/${c.maxUses}`} /><div style={{ fontSize: 12, color: '#7a776f' }}>{c.maxUsesPerUser}/người</div></> },
        { title: 'Bật', render: (_, c) => <Switch checked={c.active} onChange={(on) => { update('coupons', c.id, { active: on }); log(on ? 'ENABLE_COUPON' : 'DISABLE_COUPON', 'Coupon', c.id, `${on ? 'Bật' : 'Tắt'} coupon ${c.code}`); }} /> },
        { title: '', render: (_, c) => <Space><Button size="small" onClick={() => openModal(c)}>Sửa</Button><Popconfirm title="Xóa mềm coupon? Đơn đã dùng vẫn giữ mã." onConfirm={() => { update('coupons', c.id, { deletedAt: dayjs().format('YYYY-MM-DD HH:mm'), active: false }); log('DELETE_COUPON', 'Coupon', c.id, `Xóa mềm coupon ${c.code}`); }}><Button size="small" danger>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Cập nhật coupon' : 'Tạo coupon'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu" width={620}>
        <Form form={form} layout="vertical" onFinish={save}>
          <Space size={16} align="start" wrap>
            <Form.Item name="code" label="Mã" rules={[{ required: true }]} normalize={(v: string) => v?.toUpperCase()}><Input style={{ width: 180, fontFamily: 'ui-monospace, monospace' }} placeholder="WELCOME20" /></Form.Item>
            <Form.Item name="discountType" label="Loại giảm" rules={[{ required: true }]}><Select style={{ width: 140 }} options={[{ value: 'PERCENT', label: '% giảm' }, { value: 'FIXED', label: 'Số tiền' }]} /></Form.Item>
            <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 140 }} /></Form.Item>
            <Form.Item name="maxDiscount" label="Giảm tối đa (₫)"><InputNumber min={0} step={50000} style={{ width: 150 }} /></Form.Item>
          </Space>
          <Form.Item name="range" label="Thời gian hiệu lực" rules={[{ required: true }]}><DatePicker.RangePicker format="DD/MM/YYYY" /></Form.Item>
          <Space size={16} wrap>
            <Form.Item name="maxUses" label="Tổng lượt" rules={[{ required: true }]}><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="maxUsesPerUser" label="Lượt / người" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="minOrderAmount" label="Tối thiểu dòng áp dụng (₫)"><InputNumber min={0} step={50000} style={{ width: 200 }} /></Form.Item>
          </Space>
          <Form.Item name="applicableTypes" label="Loại dịch vụ áp dụng" extra="Để trống = mọi loại dịch vụ. Không bao giờ áp cho nạp ví."><Select mode="multiple" allowClear options={TYPES.map((t) => ({ value: t, label: <StatusTag value={t} /> }))} /></Form.Item>
          <Form.Item name="active" label="Đang bật" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
