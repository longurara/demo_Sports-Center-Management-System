import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, message } from 'antd';
import { PlusOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { fmtMoney, useApp } from '../../store/AppContext';
import { nextInvoiceNo } from '../../utils/invoice';

export default function Payments() {
  const { data, add, log, nameOf, currentUser } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(!!params.get('member'));
  const [form] = Form.useForm();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [q, setQ] = useState('');

  const rows = data.payments
    .filter((p) => !range || (p.paidAt >= range[0].format('YYYY-MM-DD') && p.paidAt <= range[1].format('YYYY-MM-DD') + ' 23:59'))
    .filter((p) => !q || p.invoiceNo.toLowerCase().includes(q.toLowerCase()) || nameOf(p.memberId).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  const save = (v: { memberId: string; type: 'PLAN' | 'CLASS'; refName: string; amount: number; method: 'CASH' | 'BANK' | 'VNPAY' | 'MOMO' }) => {
    const p = add('payments', { ...v, invoiceNo: nextInvoiceNo(data.payments), paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id });
    log('PAYMENT', 'Payment', p.id, `Thu ${fmtMoney(v.amount)} (${v.refName}) từ ${nameOf(v.memberId)}`);
    message.success(`Đã ghi nhận thanh toán, hóa đơn ${p.invoiceNo}`); setOpen(false);
    navigate(`/receptionist/payments/${p.id}`);
  };

  return (
    <Page title="Thanh toán & hóa đơn" subtitle={`Tổng ${fmtMoney(rows.reduce((s, p) => s + p.amount, 0))} trong ${rows.length} giao dịch`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ memberId: params.get('member') ?? undefined, method: 'CASH' }); setOpen(true); }}>Ghi nhận thanh toán</Button>}>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker onChange={(v) => setRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Input.Search placeholder="Số hóa đơn / tên thành viên" allowClear style={{ width: 260 }} onChange={(e) => setQ(e.target.value)} />
      </Space>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 10 }} columns={[
        { title: 'Số HĐ', dataIndex: 'invoiceNo', render: (v) => <span className="sc-nowrap" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</span> },
        { title: 'Thời gian', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> },
        { title: 'Thành viên', render: (_, r) => <UserCell id={r.memberId} /> },
        { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
        { title: 'Nội dung', dataIndex: 'refName' },
        { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> },
        { title: 'PT', dataIndex: 'method', render: (v) => <StatusTag value={v} /> },
        { title: 'Thu bởi', render: (_, r) => nameOf(r.createdBy) },
        { title: '', render: (_, r) => <Button size="small" icon={<PrinterOutlined />} onClick={() => navigate(`/receptionist/payments/${r.id}`)}>Hóa đơn</Button> },
      ]} />
      <Modal title="Ghi nhận thanh toán" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu & tạo hóa đơn">
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ method: 'CASH', type: 'PLAN' }}>
          <Form.Item name="memberId" label="Thành viên" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} /></Form.Item>
          <Form.Item name="type" label="Loại"><Select options={[{ value: 'PLAN', label: 'Gói thành viên' }, { value: 'CLASS', label: 'Học phí lớp' }]} /></Form.Item>
          <Form.Item name="refName" label="Nội dung" rules={[{ required: true }]}><Input placeholder="VD: Gói 3 tháng" /></Form.Item>
          <Form.Item name="amount" label="Số tiền (₫)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={50000} /></Form.Item>
          <Form.Item name="method" label="Phương thức"><Select options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }, { value: 'VNPAY', label: 'VNPay' }, { value: 'MOMO', label: 'MoMo' }]} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
