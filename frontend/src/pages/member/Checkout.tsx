import { useState } from 'react';
import { Button, Card, Col, Result, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import CartPanel from '../../components/CartPanel';
import { fmtMoney, useApp } from '../../store/AppContext';
import type { Order } from '../../types';

/** Đơn đang soạn của member (UC_3.18–3.20, UC_3.3): nhiều dòng, coupon, trừ ví một lần. */
export default function Checkout() {
  const { currentUser, cart, walletBalance, setCartBuyer } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const [paid, setPaid] = useState<Order | null>(null);
  if (cart.buyer?.kind !== 'MEMBER' || cart.buyer.memberId !== me.id) setCartBuyer({ kind: 'MEMBER', memberId: me.id });

  if (paid) {
    return (
      <Page title="Thanh toán" noCard>
        <Card>
          <Result status="success" title="Thanh toán thành công!" subTitle={`Hóa đơn ${paid.orderNumber} · ${fmtMoney(paid.total)} · trừ ví, số dư còn ${fmtMoney(walletBalance(me.id))}`}
            extra={[
              <Button key="inv" onClick={() => navigate(`/member/orders/${paid.id}`)}>Xem hóa đơn</Button>,
              <Button key="sch" type="primary" onClick={() => navigate('/member/schedule')}>Xem lịch tập</Button>,
            ]} />
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Đơn đang soạn" subtitle="Thêm đặt sân, lớp học, gói thành viên vào cùng một đơn rồi thanh toán bằng ví. Giỏ chưa giữ chỗ — hệ thống kiểm tra lại khi thanh toán." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}><CartPanel methods={['WALLET']} onPaid={setPaid} /></Col>
        <Col xs={24} lg={7}>
          <Card title="Ví của tôi" size="small">
            <div style={{ fontSize: 26, fontWeight: 800 }}>{fmtMoney(walletBalance(me.id))}</div>
            <Button block style={{ marginTop: 10 }} onClick={() => navigate('/member/wallet')}>Nạp ví</Button>
          </Card>
          <Card title="Thêm dịch vụ" size="small" style={{ marginTop: 16 }}>
            <Button block style={{ marginBottom: 8 }} onClick={() => navigate('/member/courts')}>Đặt sân / phòng</Button>
            <Button block style={{ marginBottom: 8 }} onClick={() => navigate('/member/classes')}>Đăng ký lớp</Button>
            <Button block onClick={() => navigate('/member/plans')}>Gói thành viên</Button>
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
