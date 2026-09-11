import { Button, Checkbox, Col, DatePicker, Form, Input, Row, Select, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AuthShell from '../../components/AuthShell';
import { useApp } from '../../store/AppContext';
import heroImg from '../../assets/sports/gym.jpg';

const GOALS = ['Giảm mỡ, giữ dáng', 'Tăng cơ, tăng sức mạnh', 'Cải thiện thể lực', 'Học kỹ thuật một môn mới', 'Thi đấu phong trào', 'Vận động cho khỏe'];

export default function Register() {
  const { data, add, login } = useApp();
  const navigate = useNavigate();

  const onFinish = (v: Record<string, unknown>) => {
    const email = (v.email as string).trim().toLowerCase();
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      message.error('Email này đã được đăng ký — bạn có thể đăng nhập luôn.');
      return;
    }
    add('users', {
      email,
      fullName: (v.fullName as string).trim(),
      phone: v.phone as string,
      role: 'MEMBER',
      status: 'ACTIVE',
      dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      gender: v.gender as 'MALE' | 'FEMALE' | 'OTHER',
      goal: v.goal as string,
      level: 'BEGINNER',
      createdAt: dayjs().format('YYYY-MM-DD'),
    });
    message.success('Tạo tài khoản thành công. Đang đưa bạn vào trang thành viên…');
    setTimeout(() => { login(email); navigate('/member'); }, 300);
  };

  return (
    <AuthShell width={480} visual={{
      image: heroImg, imagePosition: 'center 40%',
      kicker: 'Thành viên mới',
      title: 'Buổi đầu tiên miễn phí.',
      lead: 'Tạo tài khoản trong một phút, chọn môn bạn muốn thử, đến tập — chưa cần mua gói.',
      steps: ['Điền thông tin, tạo tài khoản', 'Chọn lớp hoặc sân muốn thử ngay trên app', 'Đến đúng giờ, đọc mã thành viên ở quầy — thế thôi'],
    }}>
      <h2 className="au-h">Tạo tài khoản</h2>
      <p className="au-p">Miễn phí. Không phí gia nhập, không ràng buộc thời hạn.</p>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false} initialValues={{ agree: true }}>
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
        <Form.Item name="goal" label="Bạn muốn gì khi đến đây?" extra="Để HLV gợi ý lớp và kế hoạch phù hợp — có thể đổi sau.">
          <Select placeholder="Chọn mục tiêu" options={GOALS.map((g) => ({ value: g, label: g }))} />
        </Form.Item>
        <Form.Item name="agree" valuePropName="checked" rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error('Cần đồng ý để tiếp tục'))) }]} style={{ marginBottom: 18 }}>
          <Checkbox>Tôi đồng ý với nội quy trung tâm và cho phép lưu thông tin để đặt lịch.</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">Tạo tài khoản</Button>
      </Form>
      <div className="au-alt">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></div>
    </AuthShell>
  );
}
