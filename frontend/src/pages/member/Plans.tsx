import { useState } from 'react';
import { Button, Col, Row, Segmented, Tag, Tooltip } from 'antd';
import { CheckOutlined, CrownFilled } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';

export default function MemberPlans() {
  const { data, currentUser, activeSubscription } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sport, setSport] = useState<string>(params.get('sport') ?? 'ALL');
  const sub = activeSubscription(currentUser!.id);
  const plans = data.plans.filter((p) => p.active).filter((p) => sport === 'ALL' || p.sportIds.length === 0 || p.sportIds.includes(sport));
  const popularId = plans.reduce((best, p) => {
    const n = data.subscriptions.filter((s) => s.planId === p.id).length;
    return n > best.n ? { id: p.id, n } : best;
  }, { id: '', n: -1 }).id;

  return (
    <Page title="Gói thành viên" subtitle="Gói All-access dùng mọi bộ môn; gói theo môn rẻ hơn nếu bạn chỉ tập 1–2 môn. Thanh toán online, kích hoạt ngay." noCard>
      <div style={{ overflowX: 'auto', marginBottom: 4 }}>
        <Segmented value={sport} onChange={(v) => setSport(v as string)} options={[{ value: 'ALL', label: 'Tất cả gói' }, ...data.sports.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))]} />
      </div>
      <Row gutter={[16, 16]} align="stretch">
        {plans.map((p) => {
          const current = sub?.planId === p.id;
          const popular = p.id === popularId;
          const perMonth = Math.round((p.price / p.durationDays) * 30);
          return (
            <Col xs={24} sm={12} xl={6} key={p.id}>
              <div style={{
                height: '100%', borderRadius: 16, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column',
                background: popular ? 'linear-gradient(160deg,#14130f 0%,#0f4d34 140%)' : '#fff',
                color: popular ? '#fff' : undefined,
                border: current ? '2px solid #0f4d34' : '1px solid #ece8df',
                boxShadow: popular ? '0 16px 40px rgba(15,77,52,.28)' : '0 2px 10px rgba(20,19,15,.04)',
                transform: popular ? 'translateY(-4px)' : undefined,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, opacity: popular ? .85 : 1 }}>{p.name}</div>
                  {popular && <Tag color="orange" icon={<CrownFilled />} style={{ margin: 0 }}>Phổ biến</Tag>}
                  {current && !popular && <Tag color="blue" style={{ margin: 0 }}>Đang dùng</Tag>}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, margin: '10px 0 2px' }}>{fmtMoney(p.price)}</div>
                <div style={{ fontSize: 12.5, color: popular ? 'rgba(255,255,255,.65)' : '#7a776f' }}>{p.durationDays} ngày · ~{fmtMoney(perMonth)}/tháng</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {p.sportIds.length === 0
                    ? <Tooltip title={`Tập tất cả ${data.sports.length} bộ môn của trung tâm`}><Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>★ All-access</Tag></Tooltip>
                    : p.sportIds.map((id) => { const sp = data.sports.find((x) => x.id === id); return sp ? <Tag key={id} style={{ margin: 0, background: popular ? 'rgba(255,255,255,.12)' : `${sp.color}14`, color: popular ? '#fff' : sp.color, border: 'none', fontWeight: 600 }}>{sp.icon} {sp.name}</Tag> : null; })}
                  {p.courtDiscount > 0 && <Tag style={{ margin: 0, background: popular ? 'rgba(255,255,255,.12)' : '#ecfeff', color: popular ? '#fff' : '#0e7490', border: 'none' }}>Sân −{p.courtDiscount}%</Tag>}
                </div>
                <div style={{ height: 1, background: popular ? 'rgba(255,255,255,.15)' : '#ece8df', margin: '18px 0' }} />
                <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, flex: 1 }}>
                  {p.benefits.split(/,(?![^(]*\))|\s\+\s/).map((b) => (
                    <li key={b} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13.5 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: popular ? 'rgba(224,122,79,.25)' : '#dcfce7', color: popular ? '#e07a4f' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 1 }}><CheckOutlined /></span>
                      {b.trim()}
                    </li>
                  ))}
                </ul>
                <Button block size="large" type={popular ? 'default' : 'primary'} style={popular ? { background: '#e07a4f', border: 'none', color: '#fff', fontWeight: 600, marginTop: 16 } : { marginTop: 16 }} onClick={() => navigate(`/member/checkout/plan/${p.id}`)}>
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
