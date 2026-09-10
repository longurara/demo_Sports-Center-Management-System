import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import { useApp } from '../../store/AppContext';
import type { Role } from '../../types';

const QUICK: { role: Role; email: string; label: string; color: string }[] = [
  { role: 'MANAGER', email: 'manager@sc.vn', label: 'Center Manager', color: '#f97316' },
  { role: 'RECEPTIONIST', email: 'reception@sc.vn', label: 'Receptionist', color: '#eab308' },
  { role: 'COACH', email: 'coach.an@sc.vn', label: 'Coach', color: '#2563eb' },
  { role: 'MEMBER', email: 'member.dung@gmail.com', label: 'Member', color: '#16a34a' },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const doLogin = (email: string) => {
    if (login(email)) {
      const role = QUICK.find((q) => q.email === email)?.role ?? guessRole(email);
      navigate(`/${role.toLowerCase()}`);
    } else {
      message.error('Sai thông tin đăng nhập hoặc tài khoản đã bị khóa');
    }
  };

  return (
    <AuthShell>
      <Typography.Title level={2} style={{ marginBottom: 4, letterSpacing: -0.5 }}>Đăng nhập</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 28 }}>Chào mừng trở lại! Nhập thông tin tài khoản của bạn.</Typography.Paragraph>
      <Form layout="vertical" size="large" onFinish={(v) => doLogin(v.email)} initialValues={{ email: 'member.dung@gmail.com', password: '123456' }}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="email@example.com" />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} />
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><Link to="/forgot-password">Quên mật khẩu?</Link></div>
        <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b' }}>Chưa có tài khoản? <Link to="/register" style={{ fontWeight: 600 }}>Đăng ký thành viên</Link></div>

      <Divider plain style={{ margin: '28px 0 16px', color: '#94a3b8', fontSize: 12 }}>DEMO NHANH THEO VAI TRÒ</Divider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUICK.map((q) => (
          <Button key={q.role} onClick={() => doLogin(q.email)} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start', fontWeight: 500 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: q.color, display: 'inline-block', boxShadow: `0 0 0 3px ${q.color}22` }} />{q.label}
          </Button>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Prototype — mật khẩu bất kỳ, dữ liệu giả lập trong trình duyệt.</div>
    </AuthShell>
  );
}

function guessRole(email: string): Role {
  if (email.startsWith('manager')) return 'MANAGER';
  if (email.startsWith('reception')) return 'RECEPTIONIST';
  if (email.startsWith('coach')) return 'COACH';
  return 'MEMBER';
}
