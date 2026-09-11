import { Button, Checkbox, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import { useApp } from '../../store/AppContext';
import type { Role } from '../../types';
import heroImg from '../../assets/sports/badminton.jpg';

const QUICK: { role: Role; email: string; label: string; hint: string; color: string }[] = [
  { role: 'MEMBER', email: 'member.dung@gmail.com', label: 'Thành viên', hint: 'Dũng', color: '#16a34a' },
  { role: 'COACH', email: 'coach.an@sc.vn', label: 'Huấn luyện viên', hint: 'An · Gym', color: '#2563eb' },
  { role: 'RECEPTIONIST', email: 'reception@sc.vn', label: 'Lễ tân', hint: 'Quầy', color: '#eab308' },
  { role: 'MANAGER', email: 'manager@sc.vn', label: 'Quản lý', hint: 'Center', color: '#f97316' },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const presetEmail = (useLocation().state as { email?: string } | null)?.email; // từ landing page: "Xem demo vai trò này"

  const doLogin = (email: string) => {
    if (login(email)) {
      const role = QUICK.find((q) => q.email === email)?.role ?? guessRole(email);
      navigate(`/${role.toLowerCase()}`);
    } else {
      message.error('Sai thông tin đăng nhập hoặc tài khoản đã bị khóa');
    }
  };

  return (
    <AuthShell visual={{
      image: heroImg, imagePosition: '60% 30%',
      kicker: 'Chào mừng trở lại',
      title: 'Sân đang chờ bạn.',
      lead: 'Đăng nhập để đặt sân, xem lịch lớp hôm nay và theo dõi tiến độ tập luyện của bạn.',
      facts: [{ v: '10', l: 'bộ môn' }, { v: '15', l: 'sân & phòng tập' }, { v: '06–22h', l: 'mở cửa hằng ngày' }],
    }}>
      <h2 className="au-h">Đăng nhập</h2>
      <p className="au-p">Dùng email đã đăng ký tại quầy hoặc trên trang này.</p>
      <Form layout="vertical" size="large" onFinish={(v) => doLogin(v.email)} initialValues={{ email: presetEmail ?? 'member.dung@gmail.com', password: '123456', remember: true }}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
          <Input prefix={<MailOutlined style={{ color: '#9c9890' }} />} placeholder="ban@email.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]} style={{ marginBottom: 12 }}>
          <Input.Password prefix={<LockOutlined style={{ color: '#9c9890' }} />} autoComplete="current-password" />
        </Form.Item>
        <div className="au-row">
          <Form.Item name="remember" valuePropName="checked" noStyle><Checkbox>Ghi nhớ đăng nhập</Checkbox></Form.Item>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
      </Form>
      <div className="au-alt">Chưa có tài khoản? <Link to="/register">Đăng ký tập thử miễn phí</Link></div>

      <div className="au-demo">
        <div className="au-demo-title">Xem thử với tài khoản mẫu</div>
        <div className="au-demo-grid">
          {QUICK.map((q) => (
            <button key={q.role} type="button" className="au-demo-btn" onClick={() => doLogin(q.email)}>
              <i style={{ background: q.color }} />{q.label}<small>{q.hint}</small>
            </button>
          ))}
        </div>
        <div className="au-note">Mật khẩu bất kỳ — dữ liệu giả lập, đổi gì cũng không sao.</div>
      </div>
    </AuthShell>
  );
}

function guessRole(email: string): Role {
  if (email.startsWith('manager')) return 'MANAGER';
  if (email.startsWith('reception')) return 'RECEPTIONIST';
  if (email.startsWith('coach')) return 'COACH';
  return 'MEMBER';
}
