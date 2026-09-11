import { Avatar, Button, Card, Col, DatePicker, Descriptions, Form, Input, Modal, Row, Select, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';

export default function Profile() {
  const { data, currentUser, update } = useApp();
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form] = Form.useForm();
  if (!currentUser) return null;
  const u = currentUser;
  const isMember = u.role === 'MEMBER';
  const isCoach = u.role === 'COACH';

  const save = (v: Record<string, unknown>) => {
    update('users', u.id, { ...v, dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined });
    message.success('Đã cập nhật hồ sơ');
    setEditing(false);
  };

  return (
    <Page title="Hồ sơ cá nhân" extra={<Space><Button onClick={() => setPwOpen(true)}>Đổi mật khẩu</Button><Button type="primary" onClick={() => { form.setFieldsValue({ ...u, dob: u.dob ? dayjs(u.dob) : undefined }); setEditing(true); }}>Chỉnh sửa</Button></Space>} noCard>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <div className="sc-cover" style={{ borderRadius: 0 }} />
            <div style={{ marginTop: -48, padding: '0 20px 20px' }}>
            <Avatar size={96} style={{ background: '#2563eb', fontSize: 34, fontWeight: 600, border: '4px solid #fff', boxShadow: '0 6px 16px rgba(15,23,42,.15)' }}>{u.fullName.split(' ').slice(-2).map((w) => w[0]).join('')}</Avatar>
            <h3 style={{ marginBottom: 4 }}>{u.fullName}</h3>
            <StatusTag value={u.role} />
            <div style={{ marginTop: 12 }}>
              <Upload showUploadList={false} beforeUpload={() => { message.success('Đã cập nhật ảnh đại diện (giả lập)'); return false; }}>
                <Button icon={<UploadOutlined />} size="small">Đổi ảnh đại diện</Button>
              </Upload>
            </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">{u.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{u.phone}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><StatusTag value={u.status} /></Descriptions.Item>
              <Descriptions.Item label="Ngày tham gia">{u.createdAt}</Descriptions.Item>
              {isMember && <>
                <Descriptions.Item label="Ngày sinh">{u.dob ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Giới tính"><StatusTag value={u.gender} /></Descriptions.Item>
                <Descriptions.Item label="Mục tiêu tập luyện">{u.goal ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Trình độ"><StatusTag value={u.level} /></Descriptions.Item>
                <Descriptions.Item label="Ghi chú sức khỏe">{u.healthNote ?? '—'}</Descriptions.Item>
              </>}
              {isCoach && <>
                <Descriptions.Item label="Bộ môn phụ trách"><Space wrap size={[4, 4]}>{(u.sportIds ?? []).map((id) => <SportTag key={id} id={id} />)}</Space></Descriptions.Item>
                <Descriptions.Item label="Chứng chỉ / chuyên môn">{u.specialty ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Giới thiệu">{u.bio}</Descriptions.Item>
              </>}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal title="Cập nhật hồ sơ" open={editing} onCancel={() => setEditing(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item>
          {isMember && <>
            <Form.Item name="dob" label="Ngày sinh"><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="gender" label="Giới tính"><Select options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item>
            <Form.Item name="goal" label="Mục tiêu tập luyện"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="level" label="Trình độ"><Select options={[{ value: 'BEGINNER', label: 'Mới bắt đầu' }, { value: 'INTERMEDIATE', label: 'Trung bình' }, { value: 'ADVANCED', label: 'Nâng cao' }]} /></Form.Item>
            <Form.Item name="healthNote" label="Ghi chú sức khỏe"><Input.TextArea rows={2} /></Form.Item>
          </>}
          {isCoach && <>
            <Form.Item name="sportIds" label="Bộ môn phụ trách"><Select mode="multiple" options={data.sports.map((sp) => ({ value: sp.id, label: `${sp.icon} ${sp.name}` }))} /></Form.Item>
            <Form.Item name="specialty" label="Chứng chỉ / chuyên môn"><Input /></Form.Item>
            <Form.Item name="bio" label="Giới thiệu"><Input.TextArea rows={3} /></Form.Item>
          </>}
        </Form>
      </Modal>

      <Modal title="Đổi mật khẩu" open={pwOpen} onCancel={() => setPwOpen(false)} onOk={() => { message.success('Đã đổi mật khẩu'); setPwOpen(false); }} okText="Xác nhận">
        <Form layout="vertical">
          <Form.Item label="Mật khẩu hiện tại" required><Input.Password /></Form.Item>
          <Form.Item label="Mật khẩu mới" required><Input.Password /></Form.Item>
          <Form.Item label="Nhập lại mật khẩu mới" required><Input.Password /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
