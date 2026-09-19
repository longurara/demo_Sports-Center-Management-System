import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Popconfirm, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Gói thành viên tại quầy (UC_1.9/1.10/1.11): thêm MEMBERSHIP item vào đơn tại quầy; bật/tắt auto-renew; hủy gói (không hoàn). */
export default function Subscriptions() {
  const { data, cart, setCartBuyer, addToCart, update, log, membershipStatus, activeSubscription, nameOf, cancelMembership } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? (cart.buyer?.kind === 'MEMBER' ? cart.buyer.memberId : undefined));
  const [planId, setPlanId] = useState<string | undefined>();
  const plan = data.plans.find((p) => p.id === planId);
  const sub = memberId ? activeSubscription(memberId) : undefined;
  const st = memberId ? membershipStatus(memberId) : undefined;
  const startDate = sub ? dayjs(sub.endDate) : dayjs();
  const inCart = cart.lines.some((l) => l.type === 'MEMBERSHIP');
  const periods = data.orderItems.filter((it) => it.type === 'MEMBERSHIP' && data.orders.find((o) => o.id === it.orderId)?.buyerId === memberId).map((it) => ({ ...it, order: data.orders.find((o) => o.id === it.orderId)! })).sort((a, b) => b.order.paidAt.localeCompare(a.order.paidAt));

  const addLine = () => {
    if (!memberId || !plan) return;
    if (cart.buyer?.kind !== 'MEMBER' || cart.buyer.memberId !== memberId) setCartBuyer({ kind: 'MEMBER', memberId });
    addToCart({ type: 'MEMBERSHIP', planId: plan.id, name: `Gói ${plan.name}`, detail: `${sub ? 'Gia hạn nối từ ' : 'Kích hoạt từ '}${startDate.format('DD/MM/YYYY')} → ${startDate.add(plan.durationDays, 'day').format('DD/MM/YYYY')} · ${plan.durationDays} ngày` });
    message.success('Đã thêm vào đơn tại quầy'); navigate('/receptionist/counter');
  };

  return (
    <Page title="Gói thành viên tại quầy" subtitle="Mua / gia hạn thêm một dòng MEMBERSHIP vào đơn tại quầy (tối đa 1 dòng/đơn). Gia hạn nối từ ngày hết hạn; hủy gói mất quyền lợi ngay, không hoàn." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="1. Thành viên">
            <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={(v) => { setMemberId(v); setPlanId(undefined); }}
              options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
            {memberId && (
              <Descriptions column={1} size="small" style={{ marginTop: 16 }} bordered>
                <Descriptions.Item label="Trạng thái gói"><StatusTag value={st} /></Descriptions.Item>
                <Descriptions.Item label="Gói hiện tại">{sub ? data.plans.find((p) => p.id === sub.planId)?.name : '—'}</Descriptions.Item>
                <Descriptions.Item label="Hiệu lực">{sub ? `${dayjs(sub.startDate).format('DD/MM/YYYY')} → ${dayjs(sub.endDate).format('DD/MM/YYYY')} (còn ${Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day'))} ngày)` : '—'}</Descriptions.Item>
                {sub && <Descriptions.Item label="Auto-renew"><Switch size="small" checked={sub.autoRenew} onChange={(v) => { update('subscriptions', sub.id, { autoRenew: v }); log(v ? 'ENABLE_AUTO_RENEW' : 'DISABLE_AUTO_RENEW', 'Membership', sub.id, `${v ? 'Bật' : 'Tắt'} auto-renew cho ${nameOf(memberId)}`); }} /> <small style={{ color: '#9a968c' }}>đến hạn trừ ví, không đủ → EXPIRED</small></Descriptions.Item>}
                {sub && <Descriptions.Item label="Hủy gói"><Popconfirm title="Hủy gói? Mất quyền lợi ngay, không hoàn tiền (BR_1.9)." onConfirm={() => { cancelMembership(sub.id); message.success('Đã hủy gói'); }}><Button size="small" danger>Hủy gói thành viên</Button></Popconfirm></Descriptions.Item>}
              </Descriptions>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={`2. ${sub ? 'Gia hạn gói' : 'Mua gói mới'}`}>
            {!memberId ? <Alert type="info" title="Chọn thành viên trước" /> : (
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Select style={{ width: '100%' }} placeholder="Chọn gói" value={planId} onChange={setPlanId} options={data.plans.filter((p) => p.active && !p.deletedAt).map((p) => ({ value: p.id, label: `${p.name} — ${fmtMoney(p.price)} / ${p.durationDays} ngày`, disabled: !!sub && sub.planId !== p.id }))} />
                {sub && <div style={{ fontSize: 12, color: '#9a968c' }}>Đang còn hiệu lực: chỉ gia hạn cùng gói. Muốn đổi gói khác → chờ hết hạn hoặc hủy gói hiện tại.</div>}
                {plan && (
                  <Alert type={sub ? 'warning' : 'success'} showIcon title={sub ? `Gia hạn: kỳ mới nối từ ${startDate.format('DD/MM/YYYY')} đến ${startDate.add(plan.durationDays, 'day').format('DD/MM/YYYY')}` : `Kích hoạt từ hôm nay đến ${startDate.add(plan.durationDays, 'day').format('DD/MM/YYYY')}`}
                    description={<span>Quyền lợi: {plan.gymAccess ? 'gym miễn phí · ' : ''}−{plan.bookingDiscountPct}% đặt sân · −{plan.classDiscountPct}% học phí · {plan.freeBookingSlotsPerMonth} slot miễn phí/tháng. <Tag>{fmtMoney(plan.price)}</Tag></span>} />
                )}
                <Button type="primary" size="large" disabled={!plan || inCart} onClick={addLine}>{inCart ? 'Đơn đã có dòng membership' : 'Thêm vào đơn tại quầy'}</Button>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
      {memberId && (
        <Card title="Các kỳ đã mua (membership_orders)">
          <Table size="small" rowKey="id" pagination={false} dataSource={periods} columns={[
            { title: 'Gói', dataIndex: 'name' }, { title: 'Kỳ', dataIndex: 'detail' },
            { title: 'Hóa đơn', render: (_, p) => <a onClick={() => navigate(`/receptionist/orders/${p.orderId}`)} style={{ fontFamily: 'ui-monospace, monospace' }}>{p.order.orderNumber}</a> },
            { title: 'Thanh toán', render: (_, p) => <span className="sc-nowrap">{p.order.paidAt} · {fmtMoney(p.total)} · <StatusTag value={p.order.paymentMethod} /></span> },
          ]} />
        </Card>
      )}
    </Page>
  );
}
