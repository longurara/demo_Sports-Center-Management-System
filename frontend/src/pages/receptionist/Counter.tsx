import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Input, Radio, Row, Select, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import CartPanel from '../../components/CartPanel';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Đơn tại quầy (UC_2.7, UC_3.4, UC_3.18–3.20): chọn member hoặc guest → thêm dịch vụ từ các trang → xem lại → thu tiền. */
export default function Counter() {
  const { data, cart, setCartBuyer, membershipStatus, activeSubscription, walletBalance } = useApp();
  const navigate = useNavigate();
  const [kind, setKind] = useState<'MEMBER' | 'GUEST'>(cart.buyer?.kind ?? 'MEMBER');
  const [guest, setGuest] = useState({ name: cart.buyer?.kind === 'GUEST' ? cart.buyer.name : '', phone: cart.buyer?.kind === 'GUEST' ? cart.buyer.phone : '' });
  const memberId = cart.buyer?.kind === 'MEMBER' ? cart.buyer.memberId : undefined;
  const member = data.users.find((u) => u.id === memberId);
  const sub = memberId ? activeSubscription(memberId) : undefined;

  const applyGuest = () => { if (guest.name.trim() && guest.phone.trim()) setCartBuyer({ kind: 'GUEST', name: guest.name.trim(), phone: guest.phone.trim() }); };

  return (
    <Page title="Đơn tại quầy" subtitle="Một người mua · một đơn nhiều dòng (đặt sân + lớp + gói) · một phương thức thanh toán. Guest chỉ đặt sân lẻ, không hoàn." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="1. Người mua">
            <Radio.Group value={kind} onChange={(e) => { setKind(e.target.value); setCartBuyer(null); }} optionType="button" buttonStyle="solid" options={[{ value: 'MEMBER', label: 'Thành viên' }, { value: 'GUEST', label: 'Khách vãng lai' }]} style={{ marginBottom: 12 }} />
            {kind === 'MEMBER' ? (
              <>
                <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={(v) => setCartBuyer({ kind: 'MEMBER', memberId: v })}
                  options={data.users.filter((u) => u.role === 'MEMBER' && u.status === 'ACTIVE').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
                {member && (
                  <Descriptions column={1} size="small" bordered style={{ marginTop: 12 }}>
                    <Descriptions.Item label="Ví">{fmtMoney(walletBalance(member.id))}</Descriptions.Item>
                    <Descriptions.Item label="Gói"><StatusTag value={membershipStatus(member.id)} /> {sub ? data.plans.find((p) => p.id === sub.planId)?.name : ''}</Descriptions.Item>
                    <Descriptions.Item label="Quyền lợi">{sub ? (() => { const p = data.plans.find((x) => x.id === sub.planId)!; return `${p.gymAccess ? 'Gym free · ' : ''}−${p.bookingDiscountPct}% sân · −${p.classDiscountPct}% lớp · ${p.freeBookingSlotsPerMonth} slot free`; })() : 'Không có'}</Descriptions.Item>
                  </Descriptions>
                )}
              </>
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Input placeholder="Tên khách" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                <Input placeholder="Số điện thoại" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
                <Button type="primary" block onClick={applyGuest} disabled={!guest.name.trim() || !guest.phone.trim()}>Xác nhận khách</Button>
                {cart.buyer?.kind === 'GUEST' && <Tag color="gold">Guest: {cart.buyer.name} · {cart.buyer.phone}</Tag>}
                <Alert type="warning" showIcon title="Guest: chỉ FACILITY_BOOKING, thanh toán tại quầy, không quyền lợi, không hoàn tiền, không coupon (BR_2.17, D02)." />
              </Space>
            )}
          </Card>
          {cart.buyer && (
            <Card title="2. Thêm dịch vụ" size="small" style={{ marginTop: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Button block onClick={() => navigate('/receptionist/courts')}>Đặt sân / phòng theo slot</Button>
                {cart.buyer.kind === 'MEMBER' && <>
                  <Button block onClick={() => navigate('/receptionist/enrollments')}>Đăng ký lớp</Button>
                  <Button block onClick={() => navigate('/receptionist/subscriptions')}>Mua / gia hạn gói</Button>
                </>}
              </Space>
            </Card>
          )}
        </Col>
        <Col xs={24} lg={16}>
          {!cart.buyer ? <Card><Alert type="info" showIcon title="Chọn người mua trước, sau đó thêm dịch vụ từ các trang Đặt sân / Đăng ký lớp / Gói thành viên." /></Card>
            : <CartPanel methods={cart.buyer.kind === 'MEMBER' ? ['CASH', 'BANK', 'CARD', 'WALLET'] : ['CASH', 'BANK', 'CARD']} onPaid={(o) => navigate(`/receptionist/orders/${o.id}`)} />}
        </Col>
      </Row>
    </Page>
  );
}
