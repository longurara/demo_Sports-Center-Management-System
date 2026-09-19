import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import { PrinterOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { OrderItem } from '../../types';

/** Hóa đơn (orders) + dòng dịch vụ + hoàn tiền thủ công từng dòng (UC_3.5, BR_3.7, BR_3.13). Member chỉ xem của mình. */
export default function OrdersPage() {
  const { data, currentUser, nameOf, refundItem, log } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const staff = me.role !== 'MEMBER';
  const base = `/${me.role.toLowerCase()}`;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [refund, setRefund] = useState<OrderItem | null>(null);
  const [form] = Form.useForm();

  const rows = data.orders
    .filter((o) => staff || o.buyerId === me.id)
    .filter((o) => !status || o.status === status)
    .filter((o) => !type || data.orderItems.some((it) => it.orderId === o.id && it.type === type))
    .filter((o) => !range || (o.paidAt >= range[0].format('YYYY-MM-DD') && o.paidAt <= range[1].format('YYYY-MM-DD') + ' 23:59'))
    .filter((o) => !q || o.orderNumber.toLowerCase().includes(q.toLowerCase()) || nameOf(o.buyerId).toLowerCase().includes(q.toLowerCase()) || (o.guestName ?? '').toLowerCase().includes(q.toLowerCase()) || (o.guestPhone ?? '').includes(q))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const itemsOf = (id: string) => data.orderItems.filter((it) => it.orderId === id).sort((a, b) => a.lineNumber - b.lineNumber);

  const doRefund = (v: { amount: number; reason: string }) => {
    if (!refund) return;
    const n = refundItem(refund.id, v.amount, v.reason);
    if (n > 0) { log('REFUND', 'OrderItem', refund.id, `Hoàn ${fmtMoney(n)} cho "${refund.name}" — ${v.reason}`); message.success(`Đã hoàn ${fmtMoney(n)} vào ví`); }
    else message.error('Không hoàn được (guest, membership hoặc đã hoàn hết)');
    setRefund(null);
  };

  return (
    <Page title={staff ? 'Hóa đơn & hoàn tiền' : 'Hóa đơn của tôi'} subtitle={`${rows.length} hóa đơn · ${fmtMoney(rows.reduce((s, o) => s + o.total, 0))} · đã hoàn ${fmtMoney(rows.reduce((s, o) => s + o.refundedAmount, 0))}`}>
      <Space wrap style={{ marginBottom: 16 }}>
        {staff && <Input.Search placeholder="Số HĐ / tên / SĐT khách" allowClear style={{ width: 260 }} onChange={(e) => setQ(e.target.value)} />}
        <Select placeholder="Trạng thái" allowClear style={{ width: 160 }} onChange={setStatus} options={['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].map((s) => ({ value: s, label: <StatusTag value={s} /> }))} />
        <Select placeholder="Loại dịch vụ" allowClear style={{ width: 180 }} onChange={setType} options={['MEMBERSHIP', 'FACILITY_BOOKING', 'FACILITY_PACKAGE', 'COURSE_ENROLLMENT'].map((s) => ({ value: s, label: <StatusTag value={s} /> }))} />
        <DatePicker.RangePicker onChange={(v) => setRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
      </Space>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }}
        expandable={{ expandedRowRender: (o) => (
          <Table size="small" rowKey="id" pagination={false} dataSource={itemsOf(o.id)} columns={[
            { title: '#', dataIndex: 'lineNumber', width: 40 },
            { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
            { title: 'Dịch vụ', render: (_, it) => <><b>{it.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{it.detail}</div></> },
            { title: 'Giá gốc', dataIndex: 'unitPrice', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
            { title: 'Ưu đãi gói', dataIndex: 'membershipDiscount', align: 'right', render: (v) => v ? <span className="sc-nowrap" style={{ color: '#16a34a' }}>−{fmtMoney(v)}</span> : '—' },
            { title: 'Coupon', dataIndex: 'couponDiscount', align: 'right', render: (v) => v ? <span className="sc-nowrap" style={{ color: '#16a34a' }}>−{fmtMoney(v)}</span> : '—' },
            { title: 'Thành tiền', dataIndex: 'total', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
            { title: 'Đã hoàn', dataIndex: 'refundedAmount', align: 'right', render: (v, it) => v ? <Tag color={v >= it.total ? 'red' : 'orange'} style={{ margin: 0 }}>−{fmtMoney(v)}</Tag> : '—' },
            ...(staff ? [{ title: '', render: (_: unknown, it: OrderItem) => o.buyerId && it.type !== 'MEMBERSHIP' && it.refundedAmount < it.total ? <Button size="small" icon={<RollbackOutlined />} onClick={() => { form.setFieldsValue({ amount: it.total - it.refundedAmount, reason: '' }); setRefund(it); }}>Hoàn tiền</Button> : it.type === 'MEMBERSHIP' ? <span style={{ fontSize: 12, color: '#9a968c' }}>Không hoàn</span> : null }] : []),
          ]} />
        ) }}
        columns={[
          { title: 'Số HĐ', dataIndex: 'orderNumber', render: (v) => <span className="sc-nowrap" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</span> },
          { title: 'Thời gian', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> },
          ...(staff ? [{ title: 'Người mua', render: (_: unknown, o: typeof rows[number]) => o.buyerId ? <UserCell id={o.buyerId} /> : <span><Tag>Guest</Tag> {o.guestName} · {o.guestPhone}</span> }] : []),
          { title: 'Dòng', render: (_, o) => <Space size={4} wrap>{itemsOf(o.id).map((it) => <StatusTag key={it.id} value={it.type} />)}</Space> },
          { title: 'Tổng', dataIndex: 'total', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
          { title: 'PT', dataIndex: 'paymentMethod', render: (v) => <StatusTag value={v} /> },
          { title: 'Trạng thái', dataIndex: 'status', render: (v, o) => <span className="sc-nowrap"><StatusTag value={v} />{o.refundedAmount > 0 && <small style={{ color: '#dc2626' }}>−{fmtMoney(o.refundedAmount)}</small>}</span> },
          { title: '', render: (_, o) => <Button size="small" icon={<PrinterOutlined />} onClick={() => navigate(`${base}/orders/${o.id}`)}>Hóa đơn</Button> },
        ]} />
      <Modal title={`Hoàn tiền: ${refund?.name}`} open={!!refund} onCancel={() => setRefund(null)} onOk={() => form.submit()} okText="Hoàn vào ví">
        <Form form={form} layout="vertical" onFinish={doRefund}>
          <Form.Item name="amount" label={`Số tiền (tối đa ${fmtMoney((refund?.total ?? 0) - (refund?.refundedAmount ?? 0))})`} rules={[{ required: true }]}><InputNumber min={1000} max={(refund?.total ?? 0) - (refund?.refundedAmount ?? 0)} step={10000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input placeholder="VD: bảo trì facility, lớp đổi lịch…" /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Hoàn về ví thành viên, ghi ledger REFUND gắn dòng này; không hoàn vượt dòng/đơn, không hoàn cho guest hoặc membership (BR_3.13).</div>
      </Modal>
    </Page>
  );
}
