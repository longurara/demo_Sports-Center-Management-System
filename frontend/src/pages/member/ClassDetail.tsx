import { Alert, Avatar, Button, Card, Col, Descriptions, Popconfirm, Row, Space, Tag, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { seatsLeft } from '../../utils/conflicts';
import { planCovers, plansFor } from '../../utils/sports';
import SportTag from '../../components/SportTag';

export default function MemberClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, currentUser, userById, update, log } = useApp();
  const me = currentUser!;
  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const coach = userById(c.coachId);
  const en = data.enrollments.find((e) => e.memberId === me.id && e.classId === c.id && e.status === 'ACTIVE');
  const left = seatsLeft(data, c.id);
  const plans = data.trainingPlans.filter((p) => p.classId === c.id);
  const cov = planCovers(data, me.id, c.sportId);

  return (
    <Page title={c.name} extra={<Space>
      <Button onClick={() => navigate('/member/classes')}>Quay lại</Button>
      {en ? <Popconfirm title="Hủy đăng ký lớp này?" onConfirm={() => { update('enrollments', en.id, { status: 'CANCELLED' }); log('CANCEL_ENROLL', 'Enrollment', en.id, `${me.fullName} hủy lớp ${c.name}`); message.success('Đã hủy'); }}><Button danger>Hủy đăng ký</Button></Popconfirm>
        : <Button type="primary" disabled={left <= 0} onClick={() => navigate(`/member/checkout/class/${c.id}`)}>Đăng ký · {fmtMoney(c.price)}</Button>}
    </Space>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Thông tin lớp" extra={<StatusTag value={c.status} />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Bộ môn"><SportTag id={c.sportId} /></Descriptions.Item>
              <Descriptions.Item label="Phòng">{data.rooms.find((r) => r.id === c.roomId)?.name}</Descriptions.Item>
              <Descriptions.Item label="Lịch học">{data.schedules.filter((s) => s.classId === c.id).map((s) => <Tag key={s.id}>{DAY_NAMES[s.dayOfWeek]} {s.startTime}-{s.endTime}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="Khóa học">{c.startDate} → {c.endDate}</Descriptions.Item>
              <Descriptions.Item label="Sĩ số">{c.capacity - left}/{c.capacity} (còn {left} chỗ)</Descriptions.Item>
              <Descriptions.Item label="Học phí">{fmtMoney(c.price)}</Descriptions.Item>
            </Descriptions>
          </Card>
          {!en && !cov.ok && (
            <Alert type="warning" showIcon style={{ marginTop: 16 }} title={cov.plan ? `Gói "${cov.plan.name}" của bạn không bao gồm bộ môn này` : 'Bạn chưa có gói thành viên còn hiệu lực'}
              description={<span>Gói phù hợp: {plansFor(data, c.sportId).map((p) => p.name).join(', ')}. <a onClick={() => navigate(`/member/plans?sport=${c.sportId}`)}>Xem gói →</a></span>} />
          )}
          {plans.length > 0 && <Card title="Giáo án" style={{ marginTop: 16 }}>{plans.map((p) => <div key={p.id} style={{ marginBottom: 12 }}><b>{p.title}</b><div style={{ whiteSpace: 'pre-line', color: '#555' }}>{p.content}</div></div>)}</Card>}
        </Col>
        <Col xs={24} md={10}>
          <Card title="Huấn luyện viên">
            {coach ? (
              <Space orientation="vertical" align="center" style={{ width: '100%' }}>
                <Avatar size={72} style={{ background: '#1677ff', fontSize: 28 }}>{coach.fullName.split(' ').pop()?.[0]}</Avatar>
                <b style={{ fontSize: 16 }}>{coach.fullName}</b>
                <Space wrap size={[4, 4]} style={{ justifyContent: 'center' }}>{(coach.sportIds ?? []).map((id) => <SportTag key={id} id={id} size="small" />)}</Space>
                <div style={{ fontSize: 12, color: '#7a776f' }}>{coach.specialty}</div>
                <div style={{ textAlign: 'center', color: '#666' }}>{coach.bio}</div>
              </Space>
            ) : 'Chưa phân công'}
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
