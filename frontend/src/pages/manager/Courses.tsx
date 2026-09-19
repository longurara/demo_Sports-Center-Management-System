import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Course } from '../../types';

/** Khóa học = template (bộ môn, số buổi, mô tả, giá). Lớp là section cụ thể của khóa (UC_2.11, BR_2.8). */
export default function Courses() {
  const { data, add, update, log } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const rows = data.courses.filter((c) => !c.deletedAt);

  const openModal = (c?: Course) => { setEditing(c ?? null); form.resetFields(); form.setFieldsValue(c ?? { totalSessions: 12, active: true }); setOpen(true); };
  const save = (v: Omit<Course, 'id'>) => {
    if (editing) { update('courses', editing.id, v); log('UPDATE_COURSE', 'Course', editing.id, `Cập nhật khóa ${v.name}`); }
    else { const c = add('courses', { ...v, active: v.active ?? true }); log('CREATE_COURSE', 'Course', c.id, `Tạo khóa ${c.name} (${v.totalSessions} buổi, ${fmtMoney(v.price)})`); }
    message.success('Đã lưu — lớp đã tạo giữ nguyên lịch/giá của mình, không bị ghi đè'); setOpen(false);
  };
  const softDelete = (c: Course) => { update('courses', c.id, { deletedAt: dayjs().format('YYYY-MM-DD HH:mm'), active: false }); log('DELETE_COURSE', 'Course', c.id, `Xóa mềm khóa ${c.name}`); };
  const classesOf = (id: string) => data.classes.filter((c) => c.courseId === id && c.status !== 'CANCELLED');

  return (
    <Page title="Khóa học" subtitle="Template khóa học: bộ môn, số buổi, học phí. Mỗi khóa mở được nhiều lớp." extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo khóa học</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: 'Khóa học', render: (_, c) => <><b>{c.name}</b><div style={{ fontSize: 12.5, color: '#7a776f', maxWidth: 420 }}>{c.description}</div></> },
        { title: 'Bộ môn', render: (_, c) => <SportTag id={c.sportId} /> },
        { title: 'Số buổi', dataIndex: 'totalSessions', align: 'center' },
        { title: 'Học phí', dataIndex: 'price', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> },
        { title: 'Lớp', render: (_, c) => { const cls = classesOf(c.id); return cls.length ? <Space wrap size={[4, 4]}>{cls.map((x) => <Tag key={x.id} style={{ margin: 0 }}>{x.name}</Tag>)}</Space> : <span style={{ color: '#9a968c' }}>—</span>; } },
        { title: 'Đang mở', render: (_, c) => <Switch checked={c.active} checkedChildren="Bật" unCheckedChildren="Tắt" onChange={(on) => { update('courses', c.id, { active: on }); log(on ? 'ENABLE_COURSE' : 'DISABLE_COURSE', 'Course', c.id, `${on ? 'Bật' : 'Ngừng'} mở lớp cho khóa ${c.name}`); }} /> },
        { title: '', render: (_, c) => <Space><Button size="small" onClick={() => openModal(c)}>Sửa</Button><Popconfirm title="Xóa mềm khóa học? Lớp đã tạo và hóa đơn vẫn tham chiếu được." onConfirm={() => softDelete(c)}><Button size="small" danger disabled={classesOf(c.id).some((x) => x.status === 'OPEN')}>Xóa</Button></Popconfirm></Space> },
      ]} />
      <Modal title={editing ? 'Cập nhật khóa học' : 'Tạo khóa học'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Tên khóa" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sportId" label="Bộ môn" rules={[{ required: true }]}><Select options={data.sports.filter((s) => !s.deletedAt).map((s) => ({ value: s.id, label: s.name }))} /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Space size={16}>
            <Form.Item name="totalSessions" label="Số buổi" rules={[{ required: true }]}><InputNumber min={1} max={100} /></Form.Item>
            <Form.Item name="price" label="Học phí (₫)" rules={[{ required: true }]}><InputNumber min={0} step={50000} style={{ width: 180 }} /></Form.Item>
            <Form.Item name="active" label="Đang mở" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Page>
  );
}
