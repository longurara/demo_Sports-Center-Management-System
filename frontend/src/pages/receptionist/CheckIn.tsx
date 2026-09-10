import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Input, Result, Row, Table, message } from 'antd';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';
import type { User } from '../../types';

export default function CheckIn() {
  const { data, add, nameOf, membershipStatus, activeSubscription, currentUser } = useApp();
  const [found, setFound] = useState<User | null | undefined>(undefined);
  const [done, setDone] = useState(false);

  const search = (q: string) => {
    const u = data.users.find((x) => x.role === 'MEMBER' && (x.phone === q || x.id.toLowerCase() === q.toLowerCase() || x.email === q || x.fullName.toLowerCase() === q.toLowerCase()));
    setFound(u ?? null); setDone(false);
  };

  const st = found ? membershipStatus(found.id) : undefined;
  const canCheckIn = found && found.status === 'ACTIVE' && (st === 'ACTIVE' || st === 'EXPIRING');

  const doCheckIn = () => {
    if (!found) return;
    add('checkIns', { memberId: found.id, time: dayjs().format('YYYY-MM-DD HH:mm'), by: currentUser!.id });
    setDone(true); message.success(`Đã check-in ${found.fullName}`);
  };

  const today = dayjs().format('YYYY-MM-DD');
  const todayList = data.checkIns.filter((c) => c.time.startsWith(today)).sort((a, b) => b.time.localeCompare(a.time));

  return (
    <Page title="Check-in thành viên" subtitle="Quét thẻ / nhập SĐT hoặc mã thành viên khi đến trung tâm" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Input.Search size="large" placeholder="SĐT / mã TV (VD: 0912000001 hoặc U6)" enterButton="Tìm" autoFocus onSearch={search} />
            {found === null && <Alert style={{ marginTop: 16 }} type="error" title="Không tìm thấy thành viên" />}
            {found && !done && (
              <div style={{ marginTop: 16 }}>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Thành viên">{found.fullName}</Descriptions.Item>
                  <Descriptions.Item label="Gói">{activeSubscription(found.id) ? data.plans.find((p) => p.id === activeSubscription(found.id)!.planId)?.name : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Hết hạn">{activeSubscription(found.id)?.endDate ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái gói"><StatusTag value={st} /></Descriptions.Item>
                  <Descriptions.Item label="Tài khoản"><StatusTag value={found.status} /></Descriptions.Item>
                </Descriptions>
                {canCheckIn ? (
                  <Button type="primary" size="large" block style={{ marginTop: 16 }} onClick={doCheckIn}>✓ Xác nhận check-in</Button>
                ) : (
                  <Alert style={{ marginTop: 16 }} type="warning" showIcon title={found.status === 'LOCKED' ? 'Tài khoản đã bị khóa' : 'Gói thành viên đã hết hạn hoặc chưa có — cần gia hạn trước khi vào tập'} />
                )}
              </div>
            )}
            {found && done && <Result status="success" title={`Check-in thành công: ${found.fullName}`} subTitle={dayjs().format('HH:mm DD/MM/YYYY')} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`Check-in hôm nay (${todayList.length})`}>
            <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={todayList} columns={[
              { title: 'Giờ', dataIndex: 'time', render: (v) => v.slice(11) },
              { title: 'Thành viên', render: (_, r) => nameOf(r.memberId) },
              { title: 'Nhân viên', render: (_, r) => nameOf(r.by) },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
