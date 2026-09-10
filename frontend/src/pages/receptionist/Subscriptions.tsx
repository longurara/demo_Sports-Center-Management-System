import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Radio, Row, Select, Table, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { nextInvoiceNo } from '../../utils/invoice';

export default function Subscriptions() {
  const { data, add, update, log, notify, currentUser, membershipStatus, activeSubscription, nameOf } = useApp();
  const [params] = useSearchParams();
  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? undefined);
  const [form] = Form.useForm();
  const planId = Form.useWatch('planId', form);
  const plan = data.plans.find((p) => p.id === planId);

  const sub = memberId ? activeSubscription(memberId) : undefined;
  const st = memberId ? membershipStatus(memberId) : undefined;
  const isRenew = !!sub && st !== 'EXPIRED';
  const startDate = isRenew ? dayjs(sub!.endDate).add(1, 'day') : dayjs();
  const endDate = plan ? startDate.add(plan.durationDays, 'day') : null;

  const submit = (v: { planId: string; method: 'CASH' | 'BANK' | 'VNPAY' | 'MOMO' }) => {
    if (!memberId || !plan) return;
    if (isRenew) update('subscriptions', sub!.id, { status: 'EXPIRED' });
    add('subscriptions', { memberId, planId: plan.id, startDate: startDate.format('YYYY-MM-DD'), endDate: endDate!.format('YYYY-MM-DD'), status: 'ACTIVE' });
    add('payments', { invoiceNo: nextInvoiceNo(data.payments), memberId, amount: plan.price, method: v.method, type: 'PLAN', refName: plan.name, paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id });
    log(isRenew ? 'RENEW' : 'SUBSCRIBE', 'Subscription', memberId, `${isRenew ? 'Gia hạn' : 'Đăng ký'} ${plan.name} cho ${nameOf(memberId)} - thu ${fmtMoney(plan.price)}`);
    notify(memberId, isRenew ? 'Gia hạn thành công' : 'Kích hoạt gói thành công', `Gói ${plan.name} có hiệu lực đến ${endDate!.format('DD/MM/YYYY')}.`);
    message.success(`${isRenew ? 'Gia hạn' : 'Đăng ký'} gói thành công, đã tạo hóa đơn`);
    form.resetFields();
  };

  const history = data.subscriptions.filter((s) => s.memberId === memberId).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <Page title="Đăng ký / gia hạn gói thành viên" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="1. Chọn thành viên">
            <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={setMemberId}
              options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
            {memberId && (
              <Descriptions column={1} size="small" style={{ marginTop: 16 }} bordered>
                <Descriptions.Item label="Trạng thái gói"><StatusTag value={st} /></Descriptions.Item>
                <Descriptions.Item label="Gói hiện tại">{sub ? data.plans.find((p) => p.id === sub.planId)?.name : '—'}</Descriptions.Item>
                <Descriptions.Item label="Hết hạn">{sub?.endDate ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Còn lại">{sub ? `${Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day'))} ngày` : '—'}</Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={`2. ${isRenew ? 'Gia hạn gói' : 'Đăng ký gói mới'}`}>
            {!memberId ? <Alert type="info" title="Chọn thành viên trước" /> : (
              <Form form={form} layout="vertical" onFinish={submit} initialValues={{ method: 'CASH' }}>
                <Form.Item name="planId" label="Gói" rules={[{ required: true }]}>
                  <Select options={data.plans.filter((p) => p.active).map((p) => ({ value: p.id, label: `${p.name} — ${fmtMoney(p.price)} / ${p.durationDays} ngày` }))} />
                </Form.Item>
                {plan && (
                  <Alert type={isRenew ? 'warning' : 'success'} showIcon style={{ marginBottom: 16 }}
                    title={isRenew ? `Gia hạn: gói mới bắt đầu từ ${startDate.format('DD/MM/YYYY')} (sau khi gói cũ hết hạn) đến ${endDate!.format('DD/MM/YYYY')}` : `Gói có hiệu lực từ hôm nay đến ${endDate!.format('DD/MM/YYYY')}`} />
                )}
                <Form.Item name="method" label="Phương thức thanh toán">
                  <Radio.Group options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }, { value: 'VNPAY', label: 'VNPay QR' }, { value: 'MOMO', label: 'MoMo' }]} />
                </Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>Tổng thu: <b>{fmtMoney(plan?.price ?? 0)}</b></span>
                  <Button type="primary" htmlType="submit" size="large">Xác nhận & tạo hóa đơn</Button>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
      {memberId && (
        <Card title="Lịch sử gói">
          <Table size="small" rowKey="id" pagination={false} dataSource={history} columns={[
            { title: 'Gói', render: (_, r) => data.plans.find((p) => p.id === r.planId)?.name },
            { title: 'Bắt đầu', dataIndex: 'startDate' }, { title: 'Kết thúc', dataIndex: 'endDate' },
            { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
          ]} />
        </Card>
      )}
    </Page>
  );
}
