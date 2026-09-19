import { useState } from 'react';
import { Alert, Button, Checkbox, Col, DatePicker, Form, Input, Row, Select, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AuthShell from '../../components/AuthShell';
import { useApp } from '../../store/AppContext';
import heroImg from '../../assets/sports/gym.jpg';

const GOALS = ['Giảm mỡ, giữ dáng', 'Tăng cơ, tăng sức mạnh', 'Cải thiện thể lực', 'Học kỹ thuật một môn mới', 'Thi đấu phong trào', 'Vận động cho khỏe'];
const DEMO_OTP = '123456';

/** Đăng ký (UC_1.1): điền thông tin → xác thực OTP email → tạo accounts + member_profile (ví 0) trong cùng transaction. */
export default function Register() {
  const { data, add, login, log } = useApp();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const [otp, setOtp] = useState('');
  const [tries, setTries] = useState(0);

  const requestOtp = (v: Record<string, unknown>) => {
    const email = (v.email as string).trim().toLowerCase();
    if (data.users.some((u) => u.email.toLowerCase() === email)) { message.error('Email này đã được đăng ký — bạn có thể đăng nhập luôn.'); return; }
    if (data.users.some((u) => u.phone === (v.phone as string))) { message.error('Số điện thoại đã được dùng.'); return; }
    setPending({ ...v, email }); setOtp(''); setTries(0);
    message.success(`Đã gửi mã OTP tới ${email} (demo: ${DEMO_OTP})`);
  };

  const verify = () => {
    if (!pending) return;
    if (otp !== DEMO_OTP) { setTries((t) => t + 1); message.error(`Mã OTP không đúng (${tries + 1}/5)`); if (tries + 1 >= 5) { setPending(null); message.warning('Quá 5 lần — gửi lại OTP'); } return; }
    const v = pending;
    const u = add('users', {
      email: v.email as string, fullName: (v.fullName as string).trim(), phone: v.phone as string, role: 'MEMBER', status: 'ACTIVE',
      dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined, gender: v.gender as 'MALE' | 'FEMALE' | 'OTHER', goal: v.goal as string, level: 'BEGINNER', walletBalance: 0, createdAt: dayjs().format('YYYY-MM-DD'),
    });
    log('REGISTER', 'Account', u.id, `Đăng ký tài khoản ${u.email} (OTP xác thực, tạo member_profile ví 0 ₫)`);
    message.success('Xác thực thành công. Đang đưa bạn vào trang thành viên…');
    setTimeout(() => { login(v.email as string); navigate('/member'); }, 300);
  };

  return (
    <AuthShell width={480} visual={{
      image: heroImg, imagePosition: 'center 40%',
      kicker: 'Thành viên mới',
      title: 'Không cần gói vẫn tập được.',
      lead: 'Tạo tài khoản, xác thực email, nạp ví — rồi đặt sân hoặc đăng ký lớp. Mua gói khi bạn muốn thêm ưu đãi.',
      steps: ['Điền thông tin, nhận OTP qua email', 'Nhập OTP để kích hoạt tài khoản', 'Nạp ví và đặt lịch ngay trên app'],
    }}>
      {!pending ? (
        <>
          <h2 className="au-h">Tạo tài khoản</h2>
          <p className="au-p">Miễn phí. Email cần xác thực OTP trước khi dùng.</p>
          <Form layout="vertical" onFinish={requestOtp} requiredMark={false} initialValues={{ agree: true }}>
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input placeholder="Nguyễn Văn A" autoComplete="name" /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input placeholder="ban@email.com" autoComplete="email" /></Form.Item></Col>
              <Col span={12}><Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: '10 số, bắt đầu bằng 0' }]}><Input placeholder="09xx xxx xxx" autoComplete="tel" inputMode="numeric" /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Ít nhất 6 ký tự' }]}><Input.Password autoComplete="new-password" /></Form.Item></Col>
              <Col span={12}><Form.Item name="confirm" label="Nhập lại mật khẩu" dependencies={['password']} rules={[{ required: true, message: 'Nhập lại mật khẩu' }, ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu không khớp'))) })]}><Input.Password autoComplete="new-password" /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="dob" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="DD/MM/YYYY" disabledDate={(d) => d.isAfter(dayjs())} /></Form.Item></Col>
              <Col span={12}><Form.Item name="gender" label="Giới tính"><Select placeholder="Chọn" options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item></Col>
            </Row>
            <Form.Item name="goal" label="Bạn muốn gì khi đến đây?" extra="Lưu vào hồ sơ thành viên — có thể đổi sau.">
              <Select placeholder="Chọn mục tiêu" options={GOALS.map((g) => ({ value: g, label: g }))} />
            </Form.Item>
            <Form.Item name="agree" valuePropName="checked" rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error('Cần đồng ý để tiếp tục'))) }]} style={{ marginBottom: 18 }}>
              <Checkbox>Tôi đồng ý với nội quy trung tâm và cho phép lưu thông tin để đặt lịch.</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">Gửi mã OTP</Button>
          </Form>
        </>
      ) : (
        <>
          <h2 className="au-h">Xác thực email</h2>
          <p className="au-p">Nhập mã 6 số đã gửi tới <b>{pending.email as string}</b>. Mã hết hạn sau 10 phút.</p>
          <Alert type="info" showIcon style={{ marginBottom: 14 }} title={`Demo: mã OTP là ${DEMO_OTP}`} />
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            <Input.OTP length={6} value={otp} onChange={setOtp} size="large" />
            <Button type="primary" block size="large" disabled={otp.length !== 6} onClick={verify}>Xác nhận & tạo tài khoản</Button>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <a onClick={() => { setOtp(''); message.success('Đã gửi lại OTP (rate limit: 3 lần / 10 phút)'); }}>Gửi lại mã</a>
              <a onClick={() => setPending(null)}>Sửa thông tin</a>
            </Space>
          </Space>
        </>
      )}
      <div className="au-alt">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></div>
    </AuthShell>
  );
}
