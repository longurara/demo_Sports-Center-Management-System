import { Avatar, Button, Card, Col, List, Progress, Row, Table, Tag } from 'antd';
import { BookOutlined, DollarOutlined, FieldTimeOutlined, IdcardOutlined, RightOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, enrolledCount } from '../../utils/classes';

/** Manager Overview (UC_3.10): doanh thu hôm nay, member mới, booking hôm nay, lớp đang diễn ra + việc cần duyệt. */
export default function ManagerDashboard() {
  const { data, nameOf, membershipStatus, activeSubscription } = useApp();
  const navigate = useNavigate();
  const members = data.users.filter((u) => u.role === 'MEMBER');
  const statuses = members.map((m) => membershipStatus(m.id));
  const activeMembers = statuses.filter((s) => s === 'ACTIVE' || s === 'EXPIRING').length;
  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().format('YYYY-MM');
  const lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM');
  const rev = (pred: (paidAt: string) => boolean) => data.orders.filter((o) => pred(o.paidAt)).reduce((s, o) => s + o.total, 0) - data.walletTransactions.filter((w) => w.type === 'REFUND' && pred(w.createdAt)).reduce((s, w) => s + w.amount, 0);
  const revenueToday = rev((p) => p.startsWith(today));
  const revenueMonth = rev((p) => p.startsWith(thisMonth));
  const revenueLast = rev((p) => p.startsWith(lastMonth));
  const delta = revenueLast ? Math.round(((revenueMonth - revenueLast) / revenueLast) * 100) : 0;
  const ongoing = data.classes.filter((c) => classPhase(c) === 'ONGOING');
  const openClasses = data.classes.filter((c) => c.status === 'OPEN' && classPhase(c) !== 'COMPLETED');
  const newThisMonth = members.filter((m) => m.createdAt.startsWith(thisMonth)).length;
  const newToday = members.filter((m) => m.createdAt === today).length;
  const dow = ((dayjs().day() + 6) % 7) + 1;
  const todaySessions = data.sessions.filter((s) => s.date === today && s.status === 'SCHEDULED').map((s) => ({ ...s, cls: data.classes.find((c) => c.id === s.classId)! })).filter((s) => s.cls && s.cls.status === 'OPEN').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayBookings = data.bookings.filter((b) => b.date === today && b.status === 'CONFIRMED');
  const todayCheckIns = data.checkIns.filter((c) => c.time.startsWith(today)).length;
  const expiring = members.filter((m) => membershipStatus(m.id) === 'EXPIRING');
  const pendingClasses = data.classes.filter((c) => c.status === 'PENDING_APPROVAL');
  const pendingSpecs = data.coachSpecializations.filter((s) => s.status === 'PENDING');

  const TYPE_LABEL: Record<string, string> = { MEMBERSHIP: 'Gói thành viên', COURSE_ENROLLMENT: 'Học phí lớp', FACILITY_BOOKING: 'Đặt sân', FACILITY_PACKAGE: 'Gói sân định kỳ' };
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const m = dayjs().subtract(5 - i, 'month'); const key = m.format('YYYY-MM');
    const ids = new Set(data.orders.filter((o) => o.paidAt.startsWith(key)).map((o) => o.id));
    const items = data.orderItems.filter((it) => ids.has(it.orderId));
    return Object.keys(TYPE_LABEL).map((t) => ({ month: m.format('MM/YYYY'), type: TYPE_LABEL[t], revenue: items.filter((it) => it.type === t).reduce((s, it) => s + it.total, 0) / 1e6 }));
  }).flat();

  const planDist = data.plans.filter((p) => p.active).map((p) => ({ plan: p.name, value: data.subscriptions.filter((s) => s.planId === p.id && s.status === 'ACTIVE').length })).filter((x) => x.value > 0);
  const statusDist = [
    { label: 'Còn hạn', value: statuses.filter((s) => s === 'ACTIVE').length, color: '#16a34a' },
    { label: 'Sắp hết hạn', value: statuses.filter((s) => s === 'EXPIRING').length, color: '#f59e0b' },
    { label: 'Hết hạn', value: statuses.filter((s) => s === 'EXPIRED').length, color: '#dc2626' },
    { label: 'Chưa có gói', value: statuses.filter((s) => s === 'NONE').length, color: '#9a968c' },
  ];
  const fill = openClasses.map((c) => { const n = enrolledCount(data, c.id); return { key: c.id, name: c.name, coach: nameOf(c.coachId), n, capacity: c.capacity, min: c.minStudents, rate: Math.round((n / c.capacity) * 100), phase: classPhase(c) }; }).sort((a, b) => b.rate - a.rate);

  return (
    <Page title="Tổng quan trung tâm" subtitle={`${DAY_NAMES[dow]}, ${dayjs().format('DD/MM/YYYY')} · ${todayCheckIns} lượt check-in hôm nay`} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Doanh thu hôm nay" value={fmtMoney(revenueToday)} icon={<DollarOutlined />} color="#c94a1e" hint={`Tháng này ${fmtMoney(revenueMonth)} · ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%`} onClick={() => navigate('/manager/reports')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Thành viên mới" value={newToday} icon={<TeamOutlined />} color="#0f4d34" hint={`+${newThisMonth} tháng này · tổng ${members.length}`} onClick={() => navigate('/manager/members')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Booking hôm nay" value={todayBookings.length} icon={<FieldTimeOutlined />} color="#06b6d4" hint={`${todayBookings.filter((b) => !b.memberId).length} guest · ${fmtMoney(todayBookings.reduce((s, b) => s + b.price, 0))}`} onClick={() => navigate('/manager/courts')} /></Col>
        <Col xs={12} xl={6}><StatCard title="Lớp đang diễn ra" value={ongoing.length} icon={<BookOutlined />} color="#9333ea" hint={`${todaySessions.length} buổi hôm nay · ${openClasses.length - ongoing.length} lớp sắp mở`} onClick={() => navigate('/manager/classes')} /></Col>
      </Row>
      {(pendingClasses.length > 0 || pendingSpecs.length > 0) && (
        <Card size="small" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
          <b><WarningOutlined style={{ color: '#f59e0b' }} /> Cần Manager xử lý:</b>{' '}
          {pendingClasses.length > 0 && <a onClick={() => navigate('/manager/classes')}>{pendingClasses.length} lớp chờ duyệt mở</a>}{pendingClasses.length > 0 && pendingSpecs.length > 0 && ' · '}
          {pendingSpecs.length > 0 && <a onClick={() => navigate('/manager/coaches')}>{pendingSpecs.length} chuyên môn HLV chờ duyệt</a>}
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Doanh thu 6 tháng theo loại dịch vụ (order_items)" extra={<Tag color="blue">triệu ₫</Tag>}>
            <Column data={monthly} xField="month" yField="revenue" colorField="type" group height={280} style={{ radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 32 }} scale={{ color: { range: ['#0f4d34', '#c94a1e', '#06b6d4', '#9333ea'] } }} axis={{ y: { grid: true, gridLineDash: [4, 4] } }} legend={{ color: { position: 'top' } }} tooltip={{ items: [{ channel: 'y', valueFormatter: (v: number) => v.toFixed(2) + ' triệu' }] }} />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Trạng thái gói thành viên" style={{ height: '100%' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `conic-gradient(${(() => { let acc = 0; const total = Math.max(1, members.length); return statusDist.map((s) => { const from = acc; acc += (s.value / total) * 100; return `${s.color} ${from}% ${acc}%`; }).join(', '); })()})` }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{members.length}</div>
                  <div style={{ fontSize: 11, color: '#9a968c' }}>thành viên</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                {statusDist.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
                    <span style={{ flex: 1, color: '#3d3b35' }}>{s.label}</span>
                    <b>{s.value}</b><span style={{ color: '#9a968c', width: 36, textAlign: 'right' }}>{Math.round((s.value / Math.max(1, members.length)) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #ece8df', marginTop: 14, paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: '#7a776f', marginBottom: 6 }}>Phân bổ theo gói</div>
              {planDist.map((p) => (
                <div key={p.plan} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ width: 110, color: '#3d3b35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.plan}</span>
                  <Progress percent={Math.round((p.value / Math.max(1, activeMembers)) * 100)} size="small" showInfo={false} strokeColor="#0f4d34" style={{ flex: 1, margin: 0 }} />
                  <b style={{ width: 24, textAlign: 'right' }}>{p.value}</b>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="Buổi học hôm nay" extra={<a onClick={() => navigate('/manager/schedule')}>Lịch tuần <RightOutlined style={{ fontSize: 10 }} /></a>} style={{ height: '100%' }}>
            <List size="small" dataSource={todaySessions} locale={{ emptyText: 'Hôm nay không có buổi học' }} renderItem={(s) => (
              <List.Item style={{ padding: '8px 0' }} onClick={() => navigate(`/manager/classes/${s.cls.id}`)}>
                <List.Item.Meta
                  avatar={<div style={{ width: 54, textAlign: 'center', background: '#e3efe8', borderRadius: 8, padding: '4px 0', color: '#0f4d34', fontWeight: 700, fontSize: 12 }}>{s.startTime}</div>}
                  title={<a>{s.cls.name}</a>} description={`${data.rooms.find((r) => r.id === s.roomId)?.name} · HLV ${nameOf(s.cls.coachId)} · ${enrolledCount(data, s.cls.id)}/${s.cls.capacity} HV`} />
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title={<span><IdcardOutlined style={{ color: '#f59e0b' }} /> Gói sắp hết hạn ({expiring.length})</span>} extra={<a onClick={() => navigate('/manager/members')}>Tất cả</a>} style={{ height: '100%' }}>
            <List size="small" dataSource={expiring.slice(0, 5)} locale={{ emptyText: 'Không có gói sắp hết hạn' }} renderItem={(u) => (
              <List.Item style={{ padding: '8px 0' }} actions={[activeSubscription(u.id)?.autoRenew ? <Tag color="green">auto-renew</Tag> : <StatusTag value="EXPIRING" />]}>
                <a onClick={() => navigate(`/manager/members/${u.id}`)}><UserCell user={u} sub={`hết hạn ${dayjs(activeSubscription(u.id)?.endDate).format('DD/MM')} · ví ${fmtMoney(u.walletBalance ?? 0)}`} size={30} /></a>
              </List.Item>
            )} />
          </Card>
        </Col>
        <Col xs={24} xl={7}>
          <Card title="Hoạt động gần đây" extra={<a onClick={() => navigate('/manager/audit-log')}>Audit log</a>} style={{ height: '100%' }}>
            <List size="small" dataSource={data.auditLogs.slice(0, 5)} renderItem={(a) => (
              <List.Item style={{ padding: '8px 0' }}>
                <List.Item.Meta avatar={<Avatar size={30} style={{ background: '#e3efe8', color: '#0f4d34', fontWeight: 600, fontSize: 12 }}>{nameOf(a.userId).split(' ').pop()?.[0]}</Avatar>}
                  title={<span style={{ fontSize: 13 }}>{a.detail}</span>} description={<span style={{ fontSize: 12 }}>{nameOf(a.userId)} · {dayjs(a.createdAt).fromNow()}</span>} />
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>

      <Card title="Tình trạng đăng ký lớp (OPEN / ONGOING)" extra={<Button size="small" onClick={() => navigate('/manager/reports')}>Báo cáo chi tiết</Button>}>
        <Table size="middle" pagination={false} dataSource={fill} onRow={(r) => ({ onClick: () => navigate(`/manager/classes/${r.key}`), style: { cursor: 'pointer' } })} columns={[
          { title: 'Lớp', dataIndex: 'name', render: (v, r) => <span><b>{v}</b> <StatusTag value={r.phase} /></span> },
          { title: 'Huấn luyện viên', dataIndex: 'coach' },
          { title: 'Đã đăng ký', render: (_, r) => <span className="sc-nowrap">{r.n} / {r.capacity} <small style={{ color: r.n < r.min ? '#dc2626' : '#9a968c' }}>(min {r.min})</small></span> },
          { title: 'Tỷ lệ lấp đầy', dataIndex: 'rate', width: 300, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 80 ? '#16a34a' : v >= 40 ? '#0f4d34' : '#f59e0b'} /> },
          { title: 'Đánh giá', render: (_, r) => r.n < r.min ? <Tag color="red">Thiếu sĩ số</Tag> : r.rate >= 80 ? <Tag color="green">Tốt</Tag> : r.rate >= 40 ? <Tag color="blue">Ổn định</Tag> : <Tag color="orange">Cần đẩy mạnh</Tag> },
        ]} />
      </Card>
    </Page>
  );
}
