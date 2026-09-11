import { Button, Card, Col, Descriptions, Progress, Row, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';

export default function Membership() {
  const { data, currentUser, activeSubscription, membershipStatus } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const sub = activeSubscription(me.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const st = membershipStatus(me.id);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const history = data.subscriptions.filter((s) => s.memberId === me.id).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <Page title="Gói thành viên của tôi" extra={<Button type="primary" onClick={() => navigate('/member/plans')}>{sub ? 'Gia hạn' : 'Đăng ký gói'}</Button>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Gói hiện tại" extra={<StatusTag value={st} />}>
            {sub && plan ? (
              <>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Gói">{plan.name}</Descriptions.Item>
                  <Descriptions.Item label="Giá">{fmtMoney(plan.price)}</Descriptions.Item>
                  <Descriptions.Item label="Bắt đầu">{dayjs(sub.startDate).format('DD/MM/YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Hết hạn">{dayjs(sub.endDate).format('DD/MM/YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Bộ môn">{plan.sportIds.length === 0 ? <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>★ All-access — mọi bộ môn</Tag> : <Space wrap size={[4, 4]}>{plan.sportIds.map((id) => <SportTag key={id} id={id} />)}</Space>}</Descriptions.Item>
                  {plan.courtDiscount > 0 && <Descriptions.Item label="Ưu đãi thuê sân">Giảm {plan.courtDiscount}% mọi sân</Descriptions.Item>}
                  <Descriptions.Item label="Quyền lợi">{plan.benefits}</Descriptions.Item>
                </Descriptions>
                <Progress percent={Math.round((daysLeft / plan.durationDays) * 100)} format={() => `${daysLeft} ngày`} />
              </>
            ) : <div>Bạn chưa có gói còn hiệu lực.</div>}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Lịch sử gói">
            <Table size="small" rowKey="id" pagination={false} dataSource={history} columns={[
              { title: 'Gói', render: (_, r) => data.plans.find((p) => p.id === r.planId)?.name },
              { title: 'Từ', dataIndex: 'startDate' }, { title: 'Đến', dataIndex: 'endDate' },
              { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
