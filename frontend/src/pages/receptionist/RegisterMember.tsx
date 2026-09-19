import { Alert, Button, Card, Col, DatePicker, Form, Input, Row, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Đăng ký thành viên tại quầy (mở rộng ngoài docs): tạo account + member_profile (ví = 0). Mua gói / nạp ví làm ở bước sau qua đơn tại quầy. */
export default function RegisterMember() {
  const { data, add, log, notify, setCartBuyer, addToCart } = useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const planId = Form.useWatch('planId', form);
  const plan = data.plans.find((p) => p.id === planId);

  const onFinish = (v: Record<string, unknown>) => {
    const email = (v.email as string).trim().toLowerCase();
    if (data.users.some((u) => u.email.toLowerCase() === email)) { message.error('Email đã tồn tại'); return; }
    if (data.users.some((u) => u.phone === (v.phone as string).trim())) { message.error('SĐT đã tồn tại'); return; }
    const u = add('users', {
      email, fullName: (v.fullName as string).trim(), phone: (v.phone as string).trim(), role: 'MEMBER', status: 'ACTIVE',
      dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined, gender: v.gender as 'MALE' | 'FEMALE' | 'OTHER', address: v.address as string, emergencyContact: v.emergencyContact as string, goal: v.goal as string, healthNote: v.healthNote as string, level: 'BEGINNER', walletBalance: 0, createdAt: dayjs().format('YYYY-MM-DD'),
    });
    log('CREATE_MEMBER', 'Account', u.id, `Đăng ký thành viên mới tại quầy: ${u.fullName} (account + member_profile, ví 0 ₫)`);
    notify(u.id, 'Chào mừng bạn!', 'Tài khoản đã được tạo tại quầy. Nạp ví để mua dịch vụ online.');
    message.success('Đã tạo tài khoản + hồ sơ thành viên');
    if (plan) {
      setCartBuyer({ kind: 'MEMBER', memberId: u.id });
      addToCart({ type: 'MEMBERSHIP', planId: plan.id, name: `Gói ${plan.name}`, detail: `Kích hoạt từ ${dayjs().format('DD/MM/YYYY')} → ${dayjs().add(plan.durationDays, 'day').format('DD/MM/YYYY')} · ${plan.durationDays} ngày` });
      navigate('/receptionist/counter');
    } else navigate(`/receptionist/members/${u.id}`);
  };

  return (
    <Page title="Đăng ký thành viên tại quầy" subtitle="Tạo account + member_profile trong một transaction; gói / đặt sân thanh toán qua đơn tại quầy">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          <Col xs={24} lg={14}>
            <Card title="Thông tin tài khoản (accounts)" size="small">
              <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="phone" label="SĐT" rules={[{ required: true, pattern: /^0\d{9}$/, message: '10 số' }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}><Form.Item name="dob" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col span={8}><Form.Item name="gender" label="Giới tính"><Select options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item></Col>
                <Col span={8}><Form.Item name="password" label="Mật khẩu tạm" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item></Col>
              </Row>
              <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
            </Card>
            <Card title="Hồ sơ thành viên (member_profile)" size="small" style={{ marginTop: 16 }}>
              <Form.Item name="emergencyContact" label="Liên hệ khẩn cấp"><Input placeholder="Tên · SĐT" /></Form.Item>
              <Form.Item name="goal" label="Mục tiêu tập luyện"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="healthNote" label="Ghi chú sức khỏe (chỉ chính chủ / Manager / Lễ tân / HLV lớp xem)"><Input.TextArea rows={2} /></Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="Mua gói ngay (tùy chọn)" size="small">
              <Form.Item name="planId" label="Gói thành viên">
                <Select allowClear placeholder="Không bắt buộc" options={data.plans.filter((p) => p.active && !p.deletedAt).map((p) => ({ value: p.id, label: `${p.name} — ${fmtMoney(p.price)} / ${p.durationDays} ngày` }))} />
              </Form.Item>
              {plan ? <Alert type="success" showIcon title={`Sau khi tạo tài khoản, gói ${plan.name} được thêm vào đơn tại quầy để thu tiền.`} /> : <Alert type="info" showIcon title="Không cần gói vẫn đặt sân / đăng ký lớp được. Ví bắt đầu 0 ₫ — nạp tại quầy hoặc online." />}
            </Card>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button type="primary" size="large" htmlType="submit">Tạo tài khoản</Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Page>
  );
}
