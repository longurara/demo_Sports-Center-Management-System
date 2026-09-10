import { useState } from 'react';
import { Button, Form, Input, Result, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';

export default function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <AuthShell>
      {sent ? (
        <Result status="success" title="Đã gửi email đặt lại mật khẩu" subTitle={`Kiểm tra hộp thư ${sent} (giả lập).`} extra={<Link to="/login"><Button type="primary">Về trang đăng nhập</Button></Link>} />
      ) : (
        <>
          <Typography.Title level={2} style={{ marginBottom: 4, letterSpacing: -0.5 }}>Quên mật khẩu</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu.</Typography.Paragraph>
          <Form layout="vertical" size="large" onFinish={(v) => setSent(v.email)}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} /></Form.Item>
            <Button type="primary" htmlType="submit" block>Gửi liên kết</Button>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}><Link to="/login">← Quay lại đăng nhập</Link></div>
        </>
      )}
    </AuthShell>
  );
}
