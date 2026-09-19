import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Input, Result, Row, Table, Tag, message } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';
import { benefitsOf } from '../../utils/slots';
import type { CheckIn as CI, User } from '../../types';

/** Check-in (UC_4.1, BR_4.1): cần booking CONFIRMED hôm nay, hoặc buổi học hôm nay của lớp đã đăng ký, hoặc membership hiệu lực có gym_access. */
export default function CheckIn() {
  const { data, add, nameOf, membershipStatus, activeSubscription, currentUser } = useApp();
  const [found, setFound] = useState<User | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  const today = dayjs().format('YYYY-MM-DD');

  const search = (q: string) => {
    const s = q.trim().toLowerCase();
    const u = data.users.find((x) => x.role === 'MEMBER' && (x.phone === s || x.id.toLowerCase() === s || x.email.toLowerCase() === s || x.fullName.toLowerCase() === s));
    setFound(u ?? null); setDone(false);
  };

  const st = found ? membershipStatus(found.id) : undefined;
  const plan = found ? benefitsOf(data, found.id) : undefined;
  const bookingsToday = found ? data.bookings.filter((b) => b.memberId === found.id && b.date === today && b.status === 'CONFIRMED') : [];
  const sessionsToday = found ? data.sessions.filter((s) => s.date === today && s.status === 'SCHEDULED' && data.enrollments.some((e) => e.memberId === found.id && e.classId === s.classId && e.status === 'ENROLLED') && data.classes.find((c) => c.id === s.classId)?.status === 'OPEN') : [];
  const basis: CI['basis'] | undefined = bookingsToday.length ? 'BOOKING' : sessionsToday.length ? 'SESSION' : plan?.gymAccess ? 'MEMBERSHIP' : undefined;
  const canCheckIn = found && found.status === 'ACTIVE' && !!basis;

  const doCheckIn = () => {
    if (!found || !basis) return;
    add('checkIns', { memberId: found.id, time: dayjs().format('YYYY-MM-DD HH:mm'), by: currentUser!.id, basis });
    setDone(true); message.success(`Đã check-in ${found.fullName}`);
  };

  const todayList = data.checkIns.filter((c) => c.time.startsWith(today)).sort((a, b) => b.time.localeCompare(a.time));

  return (
    <Page title="Check-in thành viên" subtitle="Nhập SĐT / mã thành viên hoặc quét QR. Check-in không thay booking và không tự giữ capacity; lưu bảng center_checkins, không vào audit log." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Input.Search size="large" placeholder="SĐT / mã TV (VD: 0912000001 hoặc U6)" enterButton="Tìm" autoFocus onSearch={search} suffix={<QrcodeOutlined onClick={() => message.info('Quét QR (giả lập): dùng mã thành viên in trên thẻ')} style={{ color: '#9a968c', cursor: 'pointer' }} />} />
            {found === null && <Alert style={{ marginTop: 16 }} type="error" title="Không tìm thấy thành viên" />}
            {found && !done && (
              <div style={{ marginTop: 16 }}>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Thành viên">{found.fullName} · {found.phone}</Descriptions.Item>
                  <Descriptions.Item label="Tài khoản"><StatusTag value={found.status} /></Descriptions.Item>
                  <Descriptions.Item label="Gói"><StatusTag value={st} /> {activeSubscription(found.id) ? `${data.plans.find((p) => p.id === activeSubscription(found.id)!.planId)?.name} · đến ${dayjs(activeSubscription(found.id)!.endDate).format('DD/MM/YYYY')}` : ''}{plan && <Tag color={plan.gymAccess ? 'green' : 'default'} style={{ marginLeft: 6 }}>{plan.gymAccess ? 'gym_access' : 'không gym'}</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="Booking hôm nay">{bookingsToday.length ? bookingsToday.map((b) => <Tag key={b.id} color="blue">{data.rooms.find((r) => r.id === b.roomId)?.name} {b.startTime}–{b.endTime}</Tag>) : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Buổi học hôm nay">{sessionsToday.length ? sessionsToday.map((s) => <Tag key={s.id} color="purple">{data.classes.find((c) => c.id === s.classId)?.name} {s.startTime}</Tag>) : '—'}</Descriptions.Item>
                </Descriptions>
                {canCheckIn ? (
                  <>
                    <Alert style={{ marginTop: 12 }} type="success" showIcon title={`Đủ điều kiện: ${basis === 'BOOKING' ? 'có booking hôm nay' : basis === 'SESSION' ? 'có buổi học hôm nay' : 'membership còn hiệu lực có gym_access'}`} />
                    <Button type="primary" size="large" block style={{ marginTop: 12 }} onClick={doCheckIn}>✓ Xác nhận check-in</Button>
                  </>
                ) : (
                  <Alert style={{ marginTop: 16 }} type="warning" showIcon title={found.status !== 'ACTIVE' ? 'Tài khoản không hoạt động' : 'Không đủ điều kiện check-in (BR_4.1)'} description="Cần: booking CONFIRMED hôm nay, hoặc buổi học hôm nay của lớp đã đăng ký, hoặc membership hiệu lực có gym_access. Lễ tân có thể đặt slot gym tại quầy." />
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
              { title: 'Căn cứ', dataIndex: 'basis', render: (v) => v ? <Tag>{v === 'MEMBERSHIP' ? 'Gói gym' : v === 'BOOKING' ? 'Booking' : 'Buổi học'}</Tag> : '—' },
              { title: 'Nhân viên', render: (_, r) => nameOf(r.by) },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
