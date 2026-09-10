import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { GymClass } from '../../types';

export default function Classes() {
  const { data, add, update, log, nameOf } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymClass | null>(null);
  const [form] = Form.useForm();

  const openModal = (c?: GymClass) => {
    setEditing(c ?? null); form.resetFields();
    if (c) form.setFieldsValue({ ...c, range: [dayjs(c.startDate), dayjs(c.endDate)] });
    setOpen(true);
  };

  const save = (v: Record<string, unknown>) => {
    const [s, e] = v.range as [dayjs.Dayjs, dayjs.Dayjs];
    const payload = { name: v.name as string, sportId: v.sportId as string, roomId: v.roomId as string, capacity: v.capacity as number, price: v.price as number, startDate: s.format('YYYY-MM-DD'), endDate: e.format('YYYY-MM-DD') };
    if (editing) { update('classes', editing.id, payload); log('UPDATE_CLASS', 'Class', editing.id, `Cập nhật lớp ${payload.name}`); }
    else { const c = add('classes', { ...payload, status: 'OPEN' }); log('CREATE_CLASS', 'Class', c.id, `Tạo lớp ${c.name}`); }
    message.success('Đã lưu lớp học'); setOpen(false);
  };

  const cancel = (c: GymClass) => {
    update('classes', c.id, { status: 'CANCELLED' });
    log('CANCEL_CLASS', 'Class', c.id, `Hủy lớp ${c.name}`);
    message.success('Đã hủy lớp và gửi thông báo cho học viên');
  };

  return (
    <Page title="Lớp học" subtitle="Tạo lớp, thiết lập lịch và phân công huấn luyện viên" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo lớp học</Button>}>
      <Table
        rowKey="id"
        dataSource={data.classes}
        columns={[
          { title: 'Tên lớp', dataIndex: 'name', render: (v, r) => <a onClick={() => navigate(`/manager/classes/${r.id}`)}>{v}</a> },
          { title: 'Bộ môn', render: (_, r) => data.sports.find((s) => s.id === r.sportId)?.name },
          { title: 'Phòng', render: (_, r) => data.rooms.find((s) => s.id === r.roomId)?.name },
          { title: 'HLV', render: (_, r) => r.coachId ? nameOf(r.coachId) : <span style={{ color: '#fa8c16' }}>Chưa phân công</span> },
          { title: 'Sĩ số', render: (_, r) => `${data.enrollments.filter((e) => e.classId === r.id && e.status === 'ACTIVE').length}/${r.capacity}` },
          { title: 'Học phí', dataIndex: 'price', render: fmtMoney },
          { title: 'Thời gian', render: (_, r) => `${r.startDate} → ${r.endDate}` },
          { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          {
            title: '', render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => navigate(`/manager/classes/${r.id}`)}>Chi tiết</Button>
                <Button size="small" onClick={() => openModal(r)}>Sửa</Button>
                {r.status === 'OPEN' && <Popconfirm title="Hủy lớp này? Học viên sẽ được thông báo." onConfirm={() => cancel(r)}><Button size="small" danger>Hủy</Button></Popconfirm>}
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? 'Cập nhật lớp' : 'Tạo lớp học'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên lớp" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sportId" label="Bộ môn" rules={[{ required: true }]}><Select options={data.sports.map((s) => ({ value: s.id, label: s.name }))} /></Form.Item>
          <Form.Item name="roomId" label="Phòng" rules={[{ required: true }]}><Select options={data.rooms.map((s) => ({ value: s.id, label: `${s.name} (${s.capacity} chỗ)` }))} /></Form.Item>
          <Form.Item name="capacity" label="Sức chứa lớp" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="price" label="Học phí (₫)" rules={[{ required: true }]}><InputNumber min={0} step={50000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="range" label="Thời gian khóa học" rules={[{ required: true }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
