import { Alert, Avatar, Button, Card, Col, DatePicker, Descriptions, Form, Input, Modal, Row, Select, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { coachSportIds } from '../../utils/classes';

/** Hồ sơ cá nhân (UC_1.5): thông tin chung (accounts) + profile theo role. Không tự sửa role/status/số dư ví; staff_notes chỉ Manager. */
export default function Profile() {
  const { data, currentUser, update, log } = useApp();
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form] = Form.useForm();
  if (!currentUser) return null;
  const u = currentUser;
  const isMember = u.role === 'MEMBER';
  const isCoach = u.role === 'COACH';

  const save = (v: Record<string, unknown>) => {
    // Chỉ các field được phép; role / status / walletBalance / staffNotes không nằm trong form
    update('users', u.id, { ...v, dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined });
    log('UPDATE_PROFILE', 'Account', u.id, `${u.fullName} cập nhật hồ sơ cá nhân`);
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
            <Avatar size={96} style={{ background: '#d6f24b', color: '#14130f', fontSize: 34, fontWeight: 700, border: '4px solid #fff', boxShadow: '0 6px 16px rgba(15,23,42,.15)' }}>{u.fullName.split(' ').slice(-2).map((w) => w[0]).join('')}</Avatar>
            <h3 style={{ marginBottom: 4 }}>{u.fullName}</h3>
            <StatusTag value={u.role} /> <StatusTag value={u.status} />
            <div style={{ marginTop: 12 }}>
              <Upload showUploadList={false} beforeUpload={(f) => { update('users', u.id, { avatarUrl: f.name }); message.success('Đã cập nhật ảnh đại diện (giả lập)'); return false; }}>
                <Button icon={<UploadOutlined />} size="small">Đổi ảnh đại diện</Button>
              </Upload>
            </div>
            {isMember && <div style={{ marginTop: 14, fontSize: 13 }}>Ví: <b>{fmtMoney(u.walletBalance ?? 0)}</b> <span style={{ color: '#9a968c' }}>(không sửa qua hồ sơ)</span></div>}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Thông tin chung (accounts)">
            <Descriptions column={{ xs: 1, md: 2 }} bordered size="small">
              <Descriptions.Item label="Email">{u.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{u.phone}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{u.dob ? dayjs(u.dob).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Giới tính"><StatusTag value={u.gender} /></Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>{u.address ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tham gia">{dayjs(u.createdAt).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Mã tài khoản">{u.id.toUpperCase()}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title={isMember ? 'Hồ sơ thành viên (member_profile)' : isCoach ? 'Hồ sơ HLV (coach_profile)' : `Hồ sơ nhân sự (${u.role.toLowerCase()}_profile)`} style={{ marginTop: 16 }}>
            <Descriptions column={1} bordered size="small">
              {isMember && <>
                <Descriptions.Item label="Liên hệ khẩn cấp">{u.emergencyContact ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Mục tiêu tập luyện">{u.goal ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Trình độ"><StatusTag value={u.level} /></Descriptions.Item>
                <Descriptions.Item label="Ghi chú sức khỏe">{u.healthNote ?? '—'} <span style={{ fontSize: 12, color: '#9a968c' }}>· chỉ bạn, Manager, Lễ tân và HLV lớp bạn học xem được</span></Descriptions.Item>
              </>}
              {isCoach && <>
                <Descriptions.Item label="Chuyên môn đã duyệt"><Space wrap size={[4, 4]}>{coachSportIds(data, u.id).map((id) => <SportTag key={id} id={id} />)}</Space> <a href="/coach/specializations" style={{ fontSize: 12, marginLeft: 8 }}>Đăng ký thêm</a></Descriptions.Item>
                <Descriptions.Item label="Chứng chỉ">{u.specialty ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Kinh nghiệm">{u.experience ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Giới thiệu">{u.bio}</Descriptions.Item>
                <Descriptions.Item label="Ảnh bìa">{u.coverImageUrl ?? '—'}</Descriptions.Item>
              </>}
              {!isMember && !isCoach && <Descriptions.Item label="Ghi chú nội bộ (staff_notes)">{u.staffNotes ?? '—'} <span style={{ fontSize: 12, color: '#9a968c' }}>· chỉ Manager sửa</span></Descriptions.Item>}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal title="Cập nhật hồ sơ" open={editing} onCancel={() => setEditing(false)} onOk={() => form.submit()} okText="Lưu">
        <Alert type="info" showIcon style={{ marginBottom: 12 }} title="Không thể tự sửa vai trò, trạng thái tài khoản, số dư ví hay chuyên môn (chuyên môn qua duyệt)." />
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item>
          <Space size={12}>
            <Form.Item name="dob" label="Ngày sinh"><DatePicker format="DD/MM/YYYY" /></Form.Item>
            <Form.Item name="gender" label="Giới tính"><Select style={{ width: 120 }} options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item>
          </Space>
          <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
          {isMember && <>
            <Form.Item name="emergencyContact" label="Liên hệ khẩn cấp"><Input placeholder="Tên · SĐT" /></Form.Item>
            <Form.Item name="goal" label="Mục tiêu tập luyện"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="level" label="Trình độ"><Select options={[{ value: 'BEGINNER', label: 'Mới bắt đầu' }, { value: 'INTERMEDIATE', label: 'Trung bình' }, { value: 'ADVANCED', label: 'Nâng cao' }]} /></Form.Item>
            <Form.Item name="healthNote" label="Ghi chú sức khỏe"><Input.TextArea rows={2} /></Form.Item>
          </>}
          {isCoach && <>
            <Form.Item name="specialty" label="Chứng chỉ"><Input /></Form.Item>
            <Form.Item name="experience" label="Kinh nghiệm"><Input /></Form.Item>
            <Form.Item name="bio" label="Giới thiệu"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="coverImageUrl" label="Ảnh bìa (URL)"><Input /></Form.Item>
          </>}
        </Form>
      </Modal>

      <Modal title="Đổi mật khẩu" open={pwOpen} onCancel={() => setPwOpen(false)} onOk={() => { log('CHANGE_PASSWORD', 'Account', u.id, `${u.fullName} đổi mật khẩu — revoke mọi phiên`); message.success('Đã đổi mật khẩu, các phiên đăng nhập khác bị thu hồi (password_changed_at)'); setPwOpen(false); }} okText="Xác nhận">
        <Form layout="vertical">
          <Form.Item label="Mật khẩu hiện tại" required><Input.Password /></Form.Item>
          <Form.Item label="Mật khẩu mới" required><Input.Password /></Form.Item>
          <Form.Item label="Nhập lại mật khẩu mới" required><Input.Password /></Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#9a968c' }}>Mật khẩu hash bcrypt; đổi mật khẩu cập nhật password_changed_at để vô hiệu refresh token cũ (UC_1.4, BR_G.2).</div>
      </Modal>
    </Page>
  );
}
