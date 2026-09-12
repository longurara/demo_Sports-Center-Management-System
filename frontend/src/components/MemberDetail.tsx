import { Button, Card, Col, Descriptions, Progress, Row, Space, Table, Tabs, Tag, Timeline } from 'antd';
import { CalendarOutlined, DollarOutlined, LoginOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from './Page';
import StatusTag from './StatusTag';
import StatCard from './StatCard';
import BodyMetricsChart from './BodyMetricsChart';
import { initialsOf } from './UserCell';
import { DAY_NAMES, fmtMoney, useApp } from '../store/AppContext';

export default function MemberDetail({ receptionist }: { receptionist?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, membershipStatus, activeSubscription } = useApp();
  const u = userById(id);
  if (!u) return <Page title="Không tìm thấy thành viên"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;

  const sub = activeSubscription(u.id);
  const st = membershipStatus(u.id);
  const plan = sub && data.plans.find((p) => p.id === sub.planId);
  const daysLeft = sub ? Math.max(0, dayjs(sub.endDate).diff(dayjs(), 'day')) : 0;
  const subs = data.subscriptions.filter((s) => s.memberId === u.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const enrolls = data.enrollments.filter((e) => e.memberId === u.id);
  const pays = data.payments.filter((p) => p.memberId === u.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const checkIns = data.checkIns.filter((c) => c.memberId === u.id).sort((a, b) => b.time.localeCompare(a.time));
  const att = data.attendances.filter((a) => a.memberId === u.id).map((a) => ({ ...a, session: data.sessions.find((s) => s.id === a.sessionId)! })).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const attRate = att.length ? Math.round((att.filter((a) => a.status !== 'ABSENT').length / att.length) * 100) : 0;
  const totalPaid = pays.reduce((s, p) => s + p.amount, 0);
  const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, session: data.sessions.find((s) => s.id === r.sessionId)! })).sort((a, b) => b.session.date.localeCompare(a.session.date));
  const reviews = data.progressReviews.filter((r) => r.memberId === u.id);
  const timeline = [
    ...subs.map((s) => ({ t: s.startDate, color: 'blue', text: `Kích hoạt ${data.plans.find((p) => p.id === s.planId)?.name} (đến ${dayjs(s.endDate).format('DD/MM/YYYY')})` })),
    ...enrolls.map((e) => ({ t: e.enrolledAt, color: e.status === 'ACTIVE' ? 'green' : 'red', text: `${e.status === 'ACTIVE' ? 'Đăng ký' : 'Hủy'} lớp ${data.classes.find((c) => c.id === e.classId)?.name}` })),
    { t: u.createdAt, color: 'gray', text: 'Tạo tài khoản' },
  ].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 8);

  return (
    <Page
      title={u.fullName}
      subtitle={`Mã TV ${u.id.toUpperCase()} · ${u.email} · ${u.phone}`}
      extra={<Space>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        {receptionist && <>
          <Button onClick={() => navigate(`/receptionist/subscriptions?member=${u.id}`)}>Gói thành viên</Button>
          <Button onClick={() => navigate(`/receptionist/enrollments?member=${u.id}`)}>Đăng ký lớp</Button>
          <Button type="primary" icon={<DollarOutlined />} onClick={() => navigate(`/receptionist/payments?member=${u.id}`)}>Thu tiền</Button>
        </>}
      </Space>}
      noCard
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <div className="sc-cover" style={{ height: 90, borderRadius: 0 }} />
            <div style={{ padding: '0 20px 20px', marginTop: -36 }}>
              <div style={{ position: 'relative', zIndex: 1, width: 72, height: 72, borderRadius: 999, border: '4px solid #fff', boxShadow: '0 6px 16px rgba(20,19,15,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, fontFamily: "'Barlow Condensed', sans-serif", color: '#14130f', backgroundColor: '#d6f24b' }}>{initialsOf(u.fullName)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <b style={{ fontSize: 16 }}>{u.fullName}</b><StatusTag value={u.status} />
              </div>
              <div style={{ color: '#7a776f', fontSize: 13, marginBottom: 14 }}>Tham gia {dayjs(u.createdAt).format('DD/MM/YYYY')} · {dayjs().diff(dayjs(u.createdAt), 'month')} tháng</div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Ngày sinh">{u.dob ? `${dayjs(u.dob).format('DD/MM/YYYY')} (${dayjs().diff(dayjs(u.dob), 'year')} tuổi)` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Giới tính"><StatusTag value={u.gender} /></Descriptions.Item>
                <Descriptions.Item label="Trình độ"><StatusTag value={u.level} /></Descriptions.Item>
                <Descriptions.Item label="Mục tiêu">{u.goal ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Sức khỏe">{u.healthNote ?? '—'}</Descriptions.Item>
              </Descriptions>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card title="Gói thành viên" extra={<StatusTag value={st} />} style={{ height: '100%' }}>
                {sub && plan ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <b style={{ fontSize: 16 }}>{plan.name}</b><span style={{ color: '#7a776f', fontSize: 13 }}>{fmtMoney(plan.price)}</span>
                    </div>
                    <Progress percent={Math.round((daysLeft / plan.durationDays) * 100)} showInfo={false} strokeColor={st === 'EXPIRING' ? '#f59e0b' : '#0f4d34'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#7a776f' }}>
                      <span>{dayjs(sub.startDate).format('DD/MM/YYYY')}</span><b style={{ color: st === 'EXPIRING' ? '#f59e0b' : '#14130f' }}>còn {daysLeft} ngày</b><span>{dayjs(sub.endDate).format('DD/MM/YYYY')}</span>
                    </div>
                  </>
                ) : <div style={{ color: '#9a968c' }}>Chưa có gói còn hiệu lực</div>}
              </Card>
            </Col>
            <Col xs={12} xl={6}><StatCard title="Chuyên cần" value={`${attRate}%`} icon={<CalendarOutlined />} color="#16a34a" hint={`${att.length} buổi`} /></Col>
            <Col xs={12} xl={6}><StatCard title="Tổng chi tiêu" value={fmtMoney(totalPaid)} icon={<DollarOutlined />} color="#c94a1e" hint={`${pays.length} giao dịch`} /></Col>
            <Col xs={24}>
              <Card title="Lớp đang học">
                {enrolls.filter((e) => e.status === 'ACTIVE').length === 0 && <span style={{ color: '#9a968c' }}>Chưa đăng ký lớp nào</span>}
                <Space wrap>
                  {enrolls.filter((e) => e.status === 'ACTIVE').map((e) => { const c = data.classes.find((x) => x.id === e.classId)!; return (
                    <div key={e.id} style={{ border: '1px solid #ece8df', borderRadius: 12, padding: '10px 14px', minWidth: 220 }}>
                      <b>{c.name}</b>
                      <div style={{ fontSize: 12, color: '#7a776f' }}>HLV {nameOf(c.coachId)} · {data.schedules.filter((s) => s.classId === c.id).map((s) => DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T')).join(', ')}</div>
                    </div>
                  ); })}
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'progress', label: <span><TrophyOutlined /> Tiến độ</span>, children: (
            <Row gutter={16}>
              <Col xs={24} lg={14}><BodyMetricsChart memberId={u.id} /></Col>
              <Col xs={24} lg={10}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Kết quả buổi tập gần đây</div>
                <Table size="small" rowKey="id" pagination={false} dataSource={results.slice(0, 5)} columns={[{ title: 'Ngày', render: (_, r) => dayjs(r.session.date).format('DD/MM') }, { title: 'Chỉ số', dataIndex: 'metrics' }, { title: 'HLV', render: (_, r) => nameOf(r.coachId) }]} />
                {reviews.length > 0 && <div style={{ marginTop: 12, fontSize: 13, color: '#3d3b35' }}><b>Nhận xét mới nhất:</b> {reviews[reviews.length - 1].comment}</div>}
              </Col>
            </Row>
          ) },
          { key: 'att', label: <span><CalendarOutlined /> Điểm danh ({att.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={att} columns={[{ title: 'Ngày', render: (_, r) => dayjs(r.session.date).format('DD/MM/YYYY') }, { title: 'Lớp', render: (_, r) => data.classes.find((c) => c.id === r.session.classId)?.name }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /> },
          { key: 'subs', label: 'Lịch sử gói', children: <Table size="small" rowKey="id" pagination={false} dataSource={subs} columns={[{ title: 'Gói', render: (_, r) => data.plans.find((p) => p.id === r.planId)?.name }, { title: 'Bắt đầu', dataIndex: 'startDate', render: (v) => dayjs(v).format('DD/MM/YYYY') }, { title: 'Kết thúc', dataIndex: 'endDate', render: (v) => dayjs(v).format('DD/MM/YYYY') }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> }]} /> },
          { key: 'pays', label: <span><DollarOutlined /> Thanh toán ({pays.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={pays} columns={[{ title: 'Hóa đơn', dataIndex: 'invoiceNo', render: (v, r) => <a onClick={() => navigate(`${receptionist ? '/receptionist' : '/manager'}/payments/${r.id}`)} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{v}</a> }, { title: 'Nội dung', dataIndex: 'refName' }, { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> }, { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> }, { title: 'PT', dataIndex: 'method', render: (v) => <StatusTag value={v} /> }, { title: 'Ngày', dataIndex: 'paidAt', render: (v) => <span className="sc-nowrap">{v}</span> }]} /> },
          { key: 'checkins', label: <span><LoginOutlined /> Check-in ({checkIns.length})</span>, children: <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={checkIns} columns={[{ title: 'Thời gian', dataIndex: 'time' }, { title: 'Nhân viên', render: (_, r) => nameOf(r.by) }]} /> },
          { key: 'timeline', label: 'Dòng thời gian', children: <Timeline items={timeline.map((t) => ({ color: t.color, children: <><Tag style={{ background: '#f3f1ec', color: '#3d3b35' }}>{dayjs(t.t).format('DD/MM/YYYY')}</Tag> {t.text}</> }))} style={{ marginTop: 12 }} /> },
        ]} />
      </Card>
    </Page>
  );
}
