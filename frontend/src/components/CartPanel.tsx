import { useState } from 'react';
import { Alert, Button, Card, Empty, Input, Popconfirm, Radio, Space, Table, Tag, Tooltip, message } from 'antd';
import { DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatusTag from './StatusTag';
import { fmtMoney, useApp } from '../store/AppContext';
import type { Order, PaymentMethod } from '../types';

const BENEFIT: Record<string, string> = { GYM_ACCESS: 'Gym miễn phí theo gói', FREE_SLOT: 'Slot miễn phí theo gói', DISCOUNT: 'Giảm giá theo gói' };

/**
 * Đơn đang soạn (UC_3.18–3.20): các dòng dịch vụ, coupon, tổng và thanh toán.
 * Member: chỉ WALLET. Lễ tân: CASH/BANK/CARD (member có thể dùng WALLET), guest không WALLET.
 */
export default function CartPanel({ onPaid, methods }: { onPaid?: (o: Order) => void; methods: PaymentMethod[] }) {
  const { cart, quote, removeFromCart, clearCart, setCoupon, checkout, walletBalance, userById } = useApp();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>(methods[0]);
  const [code, setCode] = useState(cart.couponCode);
  const [err, setErr] = useState<string | null>(null);
  const memberId = cart.buyer?.kind === 'MEMBER' ? cart.buyer.memberId : undefined;
  const balance = walletBalance(memberId);
  const wallet = method === 'WALLET';
  const short = wallet && balance < quote.total;

  const pay = () => {
    const r = checkout(method);
    if (!r.ok) { setErr(r.error); message.error(r.error); return; }
    setErr(null); setCode('');
    message.success(`Đã thanh toán ${fmtMoney(r.order.total)} · ${r.order.orderNumber}`);
    onPaid?.(r.order);
  };

  if (!cart.lines.length) return <Card><Empty description="Đơn đang soạn trống — thêm dịch vụ (đặt sân, lớp, gói) rồi quay lại thanh toán." /></Card>;

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card title={`Dòng dịch vụ (${cart.lines.length})`} extra={<Popconfirm title="Xóa toàn bộ đơn đang soạn?" onConfirm={clearCart}><Button size="small" danger>Xóa hết</Button></Popconfirm>}>
        <Table size="small" rowKey={(r) => r.line.key} pagination={false} dataSource={quote.lines} columns={[
          { title: '#', width: 40, render: (_, __, i) => i + 1 },
          { title: 'Dịch vụ', render: (_, r) => <div><StatusTag value={r.line.type} /> <b>{r.line.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{r.line.detail}</div>{r.error && <Alert type="error" showIcon title={r.error} style={{ marginTop: 6 }} />}</div> },
          { title: 'Giá gốc', align: 'right', render: (_, r) => <span className="sc-nowrap">{fmtMoney(r.unitPrice)}</span> },
          { title: 'Ưu đãi gói', align: 'right', render: (_, r) => r.membershipDiscount ? <Tooltip title={BENEFIT[r.benefitKind ?? 'DISCOUNT']}><span className="sc-nowrap" style={{ color: '#16a34a' }}>−{fmtMoney(r.membershipDiscount)}</span></Tooltip> : '—' },
          { title: 'Coupon', align: 'right', render: (_, r) => r.couponDiscount ? <span className="sc-nowrap" style={{ color: '#16a34a' }}>−{fmtMoney(r.couponDiscount)}</span> : '—' },
          { title: 'Thành tiền', align: 'right', render: (_, r) => <b className="sc-nowrap">{fmtMoney(r.total)}</b> },
          { title: '', width: 40, render: (_, r) => <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(r.line.key)} /> },
        ]} />
      </Card>
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}><TagOutlined /> Mã giảm giá</div>
            <Space.Compact style={{ width: '100%', maxWidth: 360 }}>
              <Input placeholder="VD: WELCOME20" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onPressEnter={() => setCoupon(code)} />
              <Button onClick={() => setCoupon(code)}>Áp dụng</Button>
              {cart.couponCode && <Button onClick={() => { setCoupon(''); setCode(''); }}>Bỏ</Button>}
            </Space.Compact>
            {quote.couponError && <div style={{ color: '#dc2626', fontSize: 12.5, marginTop: 6 }}>{quote.couponError}</div>}
            {quote.coupon && <div style={{ color: '#16a34a', fontSize: 12.5, marginTop: 6 }}>Áp dụng <b>{quote.coupon.code}</b>: {quote.coupon.discountType === 'PERCENT' ? `${quote.coupon.discountValue}%` : fmtMoney(quote.coupon.discountValue)}{quote.coupon.applicableTypes ? ` cho ${quote.coupon.applicableTypes.length} loại dịch vụ` : ''} · 1 mã / đơn</div>}
            <div style={{ marginTop: 18, fontWeight: 600, marginBottom: 6 }}>Phương thức thanh toán</div>
            <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} optionType="button" buttonStyle="solid"
              options={methods.map((m) => ({ value: m, label: m === 'WALLET' ? `Ví (${fmtMoney(balance)})` : m === 'CASH' ? 'Tiền mặt' : m === 'BANK' ? 'Chuyển khoản' : 'Thẻ', disabled: m === 'WALLET' && cart.buyer?.kind !== 'MEMBER' }))} />
            {short && <Alert style={{ marginTop: 10 }} type="warning" showIcon title={`Ví thiếu ${fmtMoney(quote.total - balance)}`} action={<Button size="small" onClick={() => navigate(memberId && userById(memberId)?.role === 'MEMBER' && cart.buyer?.kind === 'MEMBER' && window.location.pathname.startsWith('/member') ? '/member/wallet' : `/receptionist/wallet?member=${memberId}`)}>Nạp ví</Button>} />}
          </div>
          <div style={{ width: 320, fontSize: 13.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2ddd2' }}><span>Tạm tính</span><span className="sc-nowrap">{fmtMoney(quote.subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2ddd2', color: '#16a34a' }}><span>Ưu đãi membership</span><span className="sc-nowrap">−{fmtMoney(quote.membershipDiscount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2ddd2', color: '#16a34a' }}><span>Coupon</span><span className="sc-nowrap">−{fmtMoney(quote.couponDiscount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 20, fontWeight: 800, borderBottom: '2px solid #14130f' }}><span>Phải trả</span><span className="sc-nowrap">{fmtMoney(quote.total)}</span></div>
            {quote.total === 0 && <Tag color="green" style={{ marginTop: 8 }}>Đơn miễn phí — vẫn ghi nhận hóa đơn, không trừ ví</Tag>}
            {err && <Alert type="error" showIcon title={err} style={{ marginTop: 10 }} />}
            <Button type="primary" size="large" block style={{ marginTop: 14 }} disabled={!quote.valid || short} onClick={pay}>
              {wallet ? 'Thanh toán bằng ví' : 'Thu tiền & tạo hóa đơn'} · {fmtMoney(quote.total)}
            </Button>
            <div style={{ fontSize: 12, color: '#9a968c', marginTop: 8 }}>Server kiểm tra lại toàn bộ dòng, chỗ trống, coupon và số dư trước khi ghi nhận; một dòng lỗi thì cả đơn không được thanh toán (BR_3.16–3.18).</div>
          </div>
        </div>
      </Card>
    </Space>
  );
}
