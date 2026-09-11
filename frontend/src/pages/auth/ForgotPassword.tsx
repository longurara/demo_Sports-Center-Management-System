import { useState } from 'react';
import { Button, Form, Input, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import heroImg from '../../assets/sports/swim.jpg';

export default function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <AuthShell visual={{
      image: heroImg, imagePosition: 'center 45%',
      kicker: 'Hỗ trợ tài khoản',
      title: 'Quên mật khẩu? Không sao.',
      lead: 'Nhập email đã đăng ký, chúng tôi gửi liên kết đặt lại trong vài giây. Hoặc ghé quầy, nhân viên đặt lại giúp bạn ngay.',
      facts: [{ v: '06–22h', l: 'quầy hỗ trợ' }, { v: '0901 000 002', l: 'hotline' }, { v: 'hello@sc.vn', l: 'email' }],
    }}>
      {sent ? (
        <Result
          status="success"
          title="Đã gửi liên kết đặt lại mật khẩu"
          subTitle={`Kiểm tra hộp thư ${sent} (giả lập). Liên kết có hiệu lực 30 phút.`}
          extra={[<Link key="back" to="/login"><Button type="primary">Về trang đăng nhập</Button></Link>, <Button key="again" onClick={() => setSent(null)}>Gửi lại</Button>]}
        />
      ) : (
        <>
          <h2 className="au-h">Đặt lại mật khẩu</h2>
          <p className="au-p">Nhập email bạn dùng khi đăng ký. Nếu chưa nhớ, gọi quầy để được hỗ trợ.</p>
          <Form layout="vertical" size="large" onFinish={(v) => setSent(v.email)}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
              <Input prefix={<MailOutlined style={{ color: '#9c9890' }} />} placeholder="ban@email.com" autoComplete="email" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Gửi liên kết đặt lại</Button>
          </Form>
          <div className="au-alt"><Link to="/login">← Quay lại đăng nhập</Link></div>
        </>
      )}
    </AuthShell>
  );
}
