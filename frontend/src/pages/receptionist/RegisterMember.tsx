import { Button, Card, Col, DatePicker, Divider, Form, Input, Radio, Row, Select, Steps, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';
import { nextInvoiceNo } from '../../utils/invoice';

export default function RegisterMember() {
  const { data, add, log, notify, currentUser } = useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const planId = Form.useWatch('planId', form);
  const plan = data.plans.find((p) => p.id === planId);
  const [step, setStep] = useState(0);

  const onFinish = (v: Record<string, unknown>) => {
    const u = add('users', {
      email: v.email as string, fullName: v.fullName as string, phone: v.phone as string, role: 'MEMBER', status: 'ACTIVE',
      dob: v.dob ? (v.dob as dayjs.Dayjs).format('YYYY-MM-DD') : undefined, gender: v.gender as 'MALE' | 'FEMALE' | 'OTHER', goal: v.goal as string, level: 'BEGINNER', createdAt: dayjs().format('YYYY-MM-DD'),
    });
    log('CREATE_MEMBER', 'User', u.id, `Đăng ký thành viên mới tại quầy: ${u.fullName}`);
    if (plan) {
      const start = dayjs();
      add('subscriptions', { memberId: u.id, planId: plan.id, startDate: start.format('YYYY-MM-DD'), endDate: start.add(plan.durationDays, 'day').format('YYYY-MM-DD'), status: 'ACTIVE' });
      add('payments', { invoiceNo: nextInvoiceNo(data.payments), memberId: u.id, amount: plan.price, method: v.method as 'CASH', type: 'PLAN', refName: plan.name, paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id });
      log('PAYMENT', 'Payment', u.id, `Thu ${fmtMoney(plan.price)} - ${plan.name} cho ${u.fullName}`);
      notify(u.id, 'Chào mừng bạn!', `Gói ${plan.name} của bạn đã được kích hoạt đến ${start.add(plan.durationDays, 'day').format('DD/MM/YYYY')}.`);
    }
    message.success('Đăng ký thành viên thành công');
    navigate(`/receptionist/members/${u.id}`);
  };

  return (
    <Page title="Đăng ký thành viên tại quầy" subtitle="Tạo tài khoản, chọn gói và thu tiền trong một bước">
      <Steps current={step} items={[{ title: 'Thông tin' }, { title: 'Chọn gói' }, { title: 'Thanh toán' }]} style={{ marginBottom: 24 }} onChange={setStep} />
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ method: 'CASH' }}>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="1. Thông tin cá nhân" size="small">
              <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}><Input onFocus={() => setStep(0)} /></Form.Item>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="phone" label="SĐT" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="dob" label="Ngày sinh"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="gender" label="Giới tính"><Select options={[{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item></Col>
              </Row>
              <Form.Item name="goal" label="Mục tiêu tập luyện"><Input.TextArea rows={2} /></Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="2. Gói thành viên" size="small">
              <Form.Item name="planId" label="Chọn gói (có thể bỏ trống)">
                <Select allowClear onFocus={() => setStep(1)} options={data.plans.filter((p) => p.active).map((p) => ({ value: p.id, label: `${p.name} — ${fmtMoney(p.price)} / ${p.durationDays} ngày` }))} />
              </Form.Item>
              {plan && <Typography.Paragraph type="secondary">{plan.benefits}</Typography.Paragraph>}
            </Card>
            <Card title="3. Thanh toán" size="small" style={{ marginTop: 16 }}>
              <Form.Item name="method" label="Phương thức">
                <Radio.Group onChange={() => setStep(2)} options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }, { value: 'VNPAY', label: 'VNPay QR' }]} />
              </Form.Item>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}><span>Tổng thu</span><b>{fmtMoney(plan?.price ?? 0)}</b></div>
            </Card>
          </Col>
        </Row>
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Button type="primary" size="large" htmlType="submit">Hoàn tất đăng ký</Button>
        </div>
      </Form>
    </Page>
  );
}
