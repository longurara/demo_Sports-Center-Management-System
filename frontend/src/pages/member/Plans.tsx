import { Button, Col, Row, Tag } from 'antd';
import { CheckOutlined, CrownFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';

export default function MemberPlans() {
  const { data, currentUser, activeSubscription } = useApp();
  const navigate = useNavigate();
  const sub = activeSubscription(currentUser!.id);
  const plans = data.plans.filter((p) => p.active);
  const popularId = plans.reduce((best, p) => {
    const n = data.subscriptions.filter((s) => s.planId === p.id).length;
    return n > best.n ? { id: p.id, n } : best;
  }, { id: '', n: -1 }).id;

  return (
    <Page title="Gói thành viên" subtitle="Chọn gói phù hợp — thanh toán online qua VNPay / MoMo, kích hoạt ngay lập tức" noCard>
      <Row gutter={[16, 16]} align="stretch">
        {plans.map((p) => {
          const current = sub?.planId === p.id;
          const popular = p.id === popularId;
          const perMonth = Math.round((p.price / p.durationDays) * 30);
          return (
            <Col xs={24} sm={12} xl={6} key={p.id}>
              <div style={{
                height: '100%', borderRadius: 16, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column',
                background: popular ? 'linear-gradient(160deg,#0b1220 0%,#1d4ed8 140%)' : '#fff',
                color: popular ? '#fff' : undefined,
                border: current ? '2px solid #2563eb' : '1px solid #eef1f6',
                boxShadow: popular ? '0 16px 40px rgba(29,78,216,.28)' : '0 2px 10px rgba(15,23,42,.04)',
                transform: popular ? 'translateY(-4px)' : undefined,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, opacity: popular ? .85 : 1 }}>{p.name}</div>
                  {popular && <Tag color="orange" icon={<CrownFilled />} style={{ margin: 0 }}>Phổ biến</Tag>}
                  {current && !popular && <Tag color="blue" style={{ margin: 0 }}>Đang dùng</Tag>}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, margin: '10px 0 2px' }}>{fmtMoney(p.price)}</div>
                <div style={{ fontSize: 12.5, color: popular ? 'rgba(255,255,255,.65)' : '#64748b' }}>{p.durationDays} ngày · ~{fmtMoney(perMonth)}/tháng</div>
                <div style={{ height: 1, background: popular ? 'rgba(255,255,255,.15)' : '#eef1f6', margin: '18px 0' }} />
                <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, flex: 1 }}>
                  {p.benefits.split(/[,+]/).map((b) => (
                    <li key={b} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13.5 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: popular ? 'rgba(251,146,60,.25)' : '#dcfce7', color: popular ? '#fb923c' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 1 }}><CheckOutlined /></span>
                      {b.trim()}
                    </li>
                  ))}
                </ul>
                <Button block size="large" type={popular ? 'default' : 'primary'} style={popular ? { background: '#fb923c', border: 'none', color: '#fff', fontWeight: 600, marginTop: 16 } : { marginTop: 16 }} onClick={() => navigate(`/member/checkout/plan/${p.id}`)}>
                  {current ? 'Gia hạn gói này' : sub ? 'Chuyển sang gói này' : 'Đăng ký ngay'}
                </Button>
              </div>
            </Col>
          );
        })}
      </Row>
    </Page>
  );
}
