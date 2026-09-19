import { Alert, Button, Card, Col, Descriptions, Popconfirm, Progress, Row, Switch, Table, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { freeSlotsLeft } from '../../utils/pricing';

/** Gói của tôi (UC_1.10/1.11): trạng thái, ngày hết hạn, quyền lợi + quota, bật/tắt auto-renew, hủy gói (không hoàn). */
export default function Membership() {
  const { data, currentUser, activeSubscription, membershipStatus, update, log, cancelMembership, walletBalance } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const sub = activeSubscription(me.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const st = membershipStatus(me.id);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const history = data.subscriptions.filter((s) => s.memberId === me.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const periods = data.orderItems.filter((it) => it.type === 'MEMBERSHIP' && data.orders.find((o) => o.id === it.orderId)?.buyerId === me.id).map((it) => ({ ...it, order: data.orders.find((o) => o.id === it.orderId)! })).sort((a, b) => b.order.paidAt.localeCompare(a.order.paidAt));
  const freeLeft = freeSlotsLeft(data, me.id, dayjs().format('YYYY-MM'));

  return (
    <Page title="Gói thành viên của tôi" extra={<Button type="primary" onClick={() => navigate('/member/plans')}>{sub ? 'Gia hạn' : 'Đăng ký gói'}</Button>} noCard>
      {sub?.autoRenew && plan && walletBalance(me.id) < plan.price && <Alert type="warning" showIcon title={`Auto-renew đang bật nhưng ví (${fmtMoney(walletBalance(me.id))}) không đủ ${fmtMoney(plan.price)} — đến hạn gói sẽ EXPIRED.`} action={<Button size="small" onClick={() => navigate('/member/wallet')}>Nạp ví</Button>} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Gói hiện tại" extra={<StatusTag value={st} />}>
            {sub && plan ? (
              <>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Gói">{plan.name} · {fmtMoney(plan.price)}</Descriptions.Item>
                  <Descriptions.Item label="Hiệu lực">{dayjs(sub.startDate).format('DD/MM/YYYY')} → {dayjs(sub.endDate).format('DD/MM/YYYY')} <small style={{ color: '#9a968c' }}>[start, end)</small></Descriptions.Item>
                  <Descriptions.Item label="Quyền lợi">
                    <div>{plan.gymAccess ? <Tag color="green">Gym miễn phí</Tag> : <Tag>Không gym</Tag>}<Tag color="cyan">−{plan.bookingDiscountPct}% đặt sân</Tag><Tag color="geekblue">−{plan.classDiscountPct}% học phí</Tag></div>
                    <div style={{ marginTop: 6 }}>Slot sân miễn phí tháng này: <b>{freeLeft}/{plan.freeBookingSlotsPerMonth}</b> còn lại</div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tự động gia hạn">
                    <Switch checked={sub.autoRenew} onChange={(v) => { update('subscriptions', sub.id, { autoRenew: v }); log(v ? 'ENABLE_AUTO_RENEW' : 'DISABLE_AUTO_RENEW', 'Membership', sub.id, `${me.fullName} ${v ? 'bật' : 'tắt'} auto-renew`); message.success(v ? 'Đã bật auto-renew: đến hạn tự trừ ví' : 'Đã tắt auto-renew'); }} />
                    <span style={{ fontSize: 12, color: '#7a776f', marginLeft: 8 }}>Đến hạn: trừ ví {fmtMoney(plan.price)} và nối kỳ; ví không đủ → gói EXPIRED + thông báo.</span>
                  </Descriptions.Item>
                </Descriptions>
                <Progress percent={Math.round((daysLeft / plan.durationDays) * 100)} format={() => `${daysLeft} ngày`} />
                <Popconfirm title="Hủy gói? Quyền lợi dừng ngay, không hoàn tiền (BR_1.9)." onConfirm={() => { cancelMembership(sub.id); message.success('Đã hủy gói'); }}><Button danger size="small" style={{ marginTop: 8 }}>Hủy gói thành viên</Button></Popconfirm>
              </>
            ) : <div>Bạn chưa có gói còn hiệu lực. Vẫn đặt sân / đăng ký lớp được với giá gốc.</div>}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Các kỳ đã mua">
            <Table size="small" rowKey="id" pagination={false} dataSource={periods} columns={[
              { title: 'Gói', dataIndex: 'name' }, { title: 'Kỳ', dataIndex: 'detail' },
              { title: 'Thanh toán', render: (_, p) => <a onClick={() => navigate(`/member/orders/${p.orderId}`)} className="sc-nowrap">{dayjs(p.order.paidAt).format('DD/MM/YYYY')} · {fmtMoney(p.total)}</a> },
            ]} />
            <div style={{ fontWeight: 600, margin: '14px 0 6px' }}>Lịch sử membership</div>
            <Table size="small" rowKey="id" pagination={false} dataSource={history} columns={[
              { title: 'Gói', render: (_, r) => data.plans.find((p) => p.id === r.planId)?.name },
              { title: 'Từ', dataIndex: 'startDate', render: (v) => dayjs(v).format('DD/MM/YY') }, { title: 'Đến', dataIndex: 'endDate', render: (v) => dayjs(v).format('DD/MM/YY') },
              { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
