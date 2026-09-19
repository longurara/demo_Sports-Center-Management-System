import { useState } from 'react';
import { Button, Card, Col, InputNumber, Radio, Result, Row, Spin, Statistic, Steps, Table, Tag, message } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';

const QUICK = [200000, 500000, 1000000, 2000000];

/** Ví (UC_3.1, UC_3.7): nạp online qua gateway sandbox (PENDING → SUCCESS callback), lịch sử TOP_UP/PAYMENT/REFUND. Không rút. */
export default function Wallet() {
  const { data, currentUser, topUp, log } = useApp();
  const me = currentUser!;
  const [amount, setAmount] = useState<number>(500000);
  const [gateway, setGateway] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [step, setStep] = useState(0);
  const [ref, setRef] = useState('');
  const txns = data.walletTransactions.filter((w) => w.memberId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const month = dayjs().format('YYYY-MM');
  const sum = (t: string) => txns.filter((w) => w.type === t && w.createdAt.startsWith(month)).reduce((s, w) => s + w.amount, 0);

  const pay = () => {
    if (!amount || amount < 10000) { message.error('Tối thiểu 10.000 ₫'); return; }
    setStep(1);
    const r = `${gateway}${dayjs().format('YYMMDDHHmmss')}`;
    setTimeout(() => { topUp(me.id, amount, gateway, r); log('WALLET_TOP_UP', 'Wallet', me.id, `Nạp ${fmtMoney(amount)} qua ${gateway} (${r})`); setRef(r); setStep(2); }, 1500);
  };

  return (
    <Page title="Ví của tôi" subtitle="Mua dịch vụ online chỉ thanh toán bằng ví. Ví chỉ nạp / trả / hoàn — không rút tiền." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={9}>
          <Card style={{ height: '100%', background: 'linear-gradient(135deg,#14130f 0%,#0f4d34 120%)', border: 'none', color: '#fff' }} styles={{ body: { padding: 22 } }}>
            <div style={{ opacity: .7, fontSize: 13 }}><WalletOutlined /> Số dư khả dụng</div>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, letterSpacing: -1 }}>{fmtMoney(me.walletBalance ?? 0)}</div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 12.5, opacity: .85 }}>
              <span>Nạp tháng này<br /><b>+{fmtMoney(sum('TOP_UP'))}</b></span>
              <span>Đã chi<br /><b>−{fmtMoney(sum('PAYMENT'))}</b></span>
              <span>Hoàn<br /><b>+{fmtMoney(sum('REFUND'))}</b></span>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={15}>
          <Card title="Nạp tiền vào ví">
            <Steps current={step} size="small" items={[{ title: 'Số tiền & cổng' }, { title: 'Thanh toán tại cổng' }, { title: 'Callback xác nhận' }]} style={{ marginBottom: 18 }} />
            {step === 0 && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>{QUICK.map((q) => <Button key={q} type={amount === q ? 'primary' : 'default'} onClick={() => setAmount(q)}>{fmtMoney(q)}</Button>)}</div>
                <InputNumber value={amount} onChange={(v) => setAmount(v ?? 0)} min={10000} step={50000} style={{ width: 240 }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => Number((v ?? '').replace(/\./g, ''))} addonAfter="₫" />
                <div style={{ margin: '14px 0 8px', fontWeight: 600 }}>Cổng thanh toán</div>
                <Radio.Group value={gateway} onChange={(e) => setGateway(e.target.value)} optionType="button" buttonStyle="solid" options={[{ value: 'VNPAY', label: 'VNPay (QR / ATM / Visa)' }, { value: 'MOMO', label: 'Ví MoMo' }]} />
                <div><Button type="primary" size="large" style={{ marginTop: 18 }} onClick={pay}>Nạp {fmtMoney(amount || 0)}</Button></div>
                <div style={{ fontSize: 12, color: '#9a968c', marginTop: 8 }}>Giao dịch gateway ở trạng thái PENDING cho đến khi callback hợp lệ (đúng chữ ký, số tiền, mã tham chiếu) — chỉ cộng ví một lần.</div>
              </>
            )}
            {step === 1 && <div style={{ textAlign: 'center', padding: 30 }}><Spin size="large" /><div style={{ marginTop: 12 }}>Đang chuyển đến cổng {gateway} (sandbox)… giao dịch PENDING</div></div>}
            {step === 2 && <Result status="success" title={`Đã nạp ${fmtMoney(amount)}`} subTitle={<span>Callback {gateway} thành công · mã <code>{ref}</code> · số dư {fmtMoney(me.walletBalance ?? 0)}</span>} extra={<Button onClick={() => setStep(0)}>Nạp tiếp</Button>} />}
          </Card>
        </Col>
      </Row>
      <Card title={`Lịch sử giao dịch ví (${txns.length})`}>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col><Statistic title="Tổng đã nạp" value={txns.filter((w) => w.type === 'TOP_UP').reduce((s, w) => s + w.amount, 0)} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
          <Col><Statistic title="Tổng đã chi" value={txns.filter((w) => w.type === 'PAYMENT').reduce((s, w) => s + w.amount, 0)} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
          <Col><Statistic title="Tổng hoàn" value={txns.filter((w) => w.type === 'REFUND').reduce((s, w) => s + w.amount, 0)} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
        </Row>
        <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={txns} columns={[
          { title: 'Thời gian', dataIndex: 'createdAt', render: (v) => <span className="sc-nowrap">{v}</span> },
          { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
          { title: 'Nội dung', render: (_, w) => <>{w.note}{w.gatewayRef && <div style={{ fontSize: 11, color: '#9a968c', fontFamily: 'ui-monospace, monospace' }}>{w.gateway} · {w.gatewayRef} <StatusTag value={w.gatewayStatus} /></div>}{w.orderId && <Tag style={{ marginLeft: 6 }}>{data.orders.find((o) => o.id === w.orderId)?.orderNumber}</Tag>}</> },
          { title: 'Số tiền', align: 'right', render: (_, w) => <b className="sc-nowrap" style={{ color: w.type === 'PAYMENT' ? '#dc2626' : '#16a34a' }}>{w.type === 'PAYMENT' ? '−' : '+'}{fmtMoney(w.amount)}</b> },
          { title: 'Số dư sau', dataIndex: 'balanceAfter', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
        ]} />
      </Card>
    </Page>
  );
}
