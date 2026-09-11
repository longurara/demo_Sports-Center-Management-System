import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from 'antd';
import SportTag from '../../components/SportTag';
import { PlusOutlined } from '@ant-design/icons';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Plan } from '../../types';

export default function Plans() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form] = Form.useForm();

  const openModal = (p?: Plan) => { setEditing(p ?? null); form.resetFields(); form.setFieldsValue(p ?? { sportIds: [], courtDiscount: 0 }); setOpen(true); };
  const save = (raw: Omit<Plan, 'id' | 'active'>) => {
    const v = { ...raw, sportIds: raw.sportIds ?? [], courtDiscount: raw.courtDiscount ?? 0 };
    if (editing) { update('plans', editing.id, v); log('UPDATE_PLAN', 'Plan', editing.id, `Cập nhật gói ${v.name}`); }
    else { const p = add('plans', { ...v, active: true }); log('CREATE_PLAN', 'Plan', p.id, `Tạo gói ${p.name}`); }
    message.success('Đã lưu gói');
    setOpen(false);
  };

  return (
    <Page title="Gói thành viên" subtitle="Gói All-access dùng mọi bộ môn; gói theo môn chỉ được đăng ký lớp/dùng phòng của môn đó" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo gói</Button>}>
      <Table
        rowKey="id"
        dataSource={data.plans}
        pagination={false}
        columns={[
          { title: 'Tên gói', dataIndex: 'name' },
          { title: 'Giá', dataIndex: 'price', render: fmtMoney },
          { title: 'Thời hạn', dataIndex: 'durationDays', render: (v) => <span className="sc-nowrap">{v} ngày</span> },
          { title: 'Phạm vi', render: (_, r) => r.sportIds.length === 0 ? <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>★ All-access</Tag> : <Space wrap size={[4, 4]}>{r.sportIds.map((id) => <SportTag key={id} id={id} size="small" />)}</Space> },
          { title: 'Ưu đãi sân', dataIndex: 'courtDiscount', align: 'center', render: (v) => v ? <Tag color="cyan" style={{ margin: 0 }}>-{v}%</Tag> : '—' },
          { title: 'Quyền lợi', dataIndex: 'benefits', width: 280 },
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
          <Form.Item name="sportIds" label="Bộ môn áp dụng" extra="Để trống = All-access (mọi bộ môn)">
            <Select mode="multiple" allowClear placeholder="All-access" options={data.sports.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))} />
          </Form.Item>
          <Form.Item name="courtDiscount" label="Giảm giá thuê sân (%)"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="benefits" label="Quyền lợi" extra="Ngăn cách bằng dấu phẩy để hiển thị từng dòng"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
