import { Button, Col, DatePicker, Form, Input, Row, Select, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AuthShell from '../../components/AuthShell';
import { useApp } from '../../store/AppContext';

export default function Register() {
  const { add, login } = useApp();
  const navigate = useNavigate();

  const onFinish = (v: Record<string, unknown>) => {
    add('users', {
      email: v.email as string,
      fullName: v.fullName as string,
      phone: v.phone as string,
      role: 'MEMBER',
      status: 'ACTIVE',
      dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      gender: v.gender as 'MALE' | 'FEMALE' | 'OTHER',
      goal: v.goal as string,
      level: 'BEGINNER',
      createdAt: dayjs().format('YYYY-MM-DD'),
    });
    message.success('Đăng ký thành công! Đang đăng nhập...');
    setTimeout(() => { login(v.email as string); navigate('/member'); }, 300);
  };

  return (
    <AuthShell width={460}>
      <Typography.Title level={2} style={{ marginBottom: 4, letterSpacing: -0.5 }}>Tạo tài khoản</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>Đăng ký thành viên để xem lớp học, đăng ký gói và theo dõi tiến độ tập luyện.</Typography.Paragraph>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item></Col>
          <Col span={12}><Form.Item name="confirm" label="Nhập lại mật khẩu" dependencies={['password']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator: (_, v) => (v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu không khớp'))) })]}><Input.Password /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="dob" label="Ngày sinh"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item name="gender" label="Giới tính"><Select options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item></Col>
        </Row>
        <Form.Item name="goal" label="Mục tiêu tập luyện"><Input.TextArea rows={2} placeholder="VD: Giảm 5kg trong 3 tháng" /></Form.Item>
        <Button type="primary" htmlType="submit" block size="large">Đăng ký</Button>
        <div style={{ textAlign: 'center', marginTop: 14, color: '#64748b' }}>Đã có tài khoản? <Link to="/login" style={{ fontWeight: 600 }}>Đăng nhập</Link></div>
      </Form>
    </AuthShell>
  );
}
