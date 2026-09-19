import { Alert, Avatar, Button, Card, Col, Descriptions, List, Popconfirm, Rate, Row, Space, Table, Tabs, Tag, message } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, classPrice, coachSportIds, enrollable, seatsLeft } from '../../utils/classes';
import { validateLine } from '../../utils/pricing';

/** Chi tiết lớp cho member: thông tin, lịch buổi học thật, session notes & đánh giá của tôi (UC_4.7/4.8), đăng ký / hủy. */
export default function MemberClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, currentUser, userById, nameOf, cart, addToCart, cancelEnrollment } = useApp();
  const me = currentUser!;
  const c = data.classes.find((x) => x.id === id);
  if (!c) return <Page title="Không tìm thấy lớp"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const coach = userById(c.coachId);
  const course = data.courses.find((x) => x.id === c.courseId);
  const en = data.enrollments.find((e) => e.memberId === me.id && e.classId === c.id && e.status === 'ENROLLED');
  const left = seatsLeft(data, c.id);
  const phase = classPhase(c);
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const sessions = data.sessions.filter((s) => s.classId === c.id).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const notes = data.sessionNotes.filter((n) => sessions.some((s) => s.id === n.sessionId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviews = data.progressReviews.filter((r) => r.memberId === me.id && !r.deletedAt && sessions.some((s) => s.id === r.sessionId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const plans = data.trainingPlans.filter((p) => p.classId === c.id);
  const err = !en && enrollable(data, c) ? validateLine(data, { kind: 'MEMBER', memberId: me.id }, { key: 'x', type: 'COURSE_ENROLLMENT', classId: c.id, name: c.name, detail: '' }, cart.lines) : null;
  const daysLeft = dayjs(c.startDate).diff(dayjs().startOf('day'), 'day');
  const refundOk = daysLeft >= data.settings.courseCancelDeadlineDays;

  const add = () => { addToCart({ type: 'COURSE_ENROLLMENT', classId: c.id, name: `Lớp ${c.name}`, detail: `${course?.name} · ${course?.totalSessions} buổi · ${dayjs(c.startDate).format('DD/MM')} → ${dayjs(c.endDate).format('DD/MM/YYYY')} · HLV ${nameOf(c.coachId)}` }); message.success('Đã thêm vào đơn đang soạn'); navigate('/member/checkout'); };

  return (
    <Page title={c.name} extra={<Space>
      <Button onClick={() => navigate('/member/classes')}>Quay lại</Button>
      {en ? (phase !== 'COMPLETED' && <Popconfirm title={refundOk ? `Hủy đăng ký? Hoàn 100% học phí về ví (còn ${daysLeft} ngày trước buổi đầu).` : 'Quá deadline — hủy sẽ KHÔNG hoàn tiền. Vẫn hủy?'} onConfirm={() => { const r = cancelEnrollment(en.id, 'MEMBER'); message.success(`Đã hủy, hoàn ${fmtMoney(r.refunded)}`); }}><Button danger>Hủy đăng ký</Button></Popconfirm>)
        : enrollable(data, c) ? <Button type="primary" disabled={!!err} onClick={add}>Thêm vào đơn · {fmtMoney(classPrice(data, c))}</Button> : <StatusTag value={phase} />}
    </Space>} noCard>
      {err && !en && <Alert type="warning" showIcon title={err} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Thông tin lớp" extra={<StatusTag value={phase} />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Khóa học">{course?.name} · <SportTag id={c.sportId} /></Descriptions.Item>
              <Descriptions.Item label="Mô tả">{course?.description}</Descriptions.Item>
              <Descriptions.Item label="Facility">{data.rooms.find((r) => r.id === c.roomId)?.name}</Descriptions.Item>
              <Descriptions.Item label="Lịch tuần">{data.schedules.filter((s) => s.classId === c.id).map((s) => <Tag key={s.id}>{DAY_NAMES[s.dayOfWeek]} {s.startTime}-{s.endTime}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="Thời gian">{dayjs(c.startDate).format('DD/MM/YYYY')} → {dayjs(c.endDate).format('DD/MM/YYYY')} · {sessions.filter((s) => s.status === 'SCHEDULED').length} buổi</Descriptions.Item>
              <Descriptions.Item label="Sĩ số">{c.capacity - left}/{c.capacity} (còn {left} chỗ, tối thiểu {c.minStudents})</Descriptions.Item>
              <Descriptions.Item label="Học phí">{fmtMoney(classPrice(data, c))} · hủy trước buổi đầu ≥ {data.settings.courseCancelDeadlineDays} ngày hoàn 100%</Descriptions.Item>
            </Descriptions>
          </Card>
          {plans.length > 0 && <Card title="Giáo án" style={{ marginTop: 16 }}>{plans.map((p) => <div key={p.id} style={{ marginBottom: 12 }}><b>{p.title}</b><div style={{ whiteSpace: 'pre-line', color: '#555' }}>{p.content}</div></div>)}</Card>}
        </Col>
        <Col xs={24} md={10}>
          <Card title="Huấn luyện viên">
            {coach ? (
              <Space orientation="vertical" align="center" style={{ width: '100%' }}>
                <Avatar size={72} style={{ background: '#1677ff', fontSize: 28 }}>{coach.fullName.split(' ').pop()?.[0]}</Avatar>
                <b style={{ fontSize: 16 }}>{coach.fullName}</b>
                <Space wrap size={[4, 4]} style={{ justifyContent: 'center' }}>{coachSportIds(data, coach.id).map((sid) => <SportTag key={sid} id={sid} size="small" />)}</Space>
                <div style={{ fontSize: 12, color: '#7a776f' }}>{coach.specialty}{coach.experience ? ` · ${coach.experience}` : ''}</div>
                <div style={{ textAlign: 'center', color: '#666' }}>{coach.bio}</div>
              </Space>
            ) : <Alert type="warning" showIcon title="Đang tìm HLV thay thế" />}
          </Card>
        </Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'sessions', label: `Buổi học (${sessions.length})`, children: (
            <Table size="small" rowKey="id" pagination={{ pageSize: 8 }} dataSource={sessions} columns={[
              { title: '#', width: 40, render: (_, __, i) => i + 1 },
              { title: 'Ngày', render: (_, s) => <span className="sc-nowrap"><b>{dayjs(s.date).format('DD/MM/YYYY')}</b> <small>{DAY_NAMES[((dayjs(s.date).day() + 6) % 7) + 1]}</small> · {s.startTime}–{s.endTime}</span> },
              { title: 'Facility', render: (_, s) => data.rooms.find((r) => r.id === s.roomId)?.name },
              { title: 'Trạng thái', render: (_, s) => s.status === 'CANCELLED' ? <StatusTag value="CANCELLED" /> : `${s.date} ${s.endTime}` < now ? <Tag>Đã diễn ra</Tag> : <Tag color="blue">Sắp tới</Tag> },
              ...(en ? [{ title: 'Điểm danh', render: (_: unknown, s: typeof sessions[number]) => { const a = data.attendances.find((x) => x.sessionId === s.id && x.memberId === me.id); return a ? <StatusTag value={a.status} /> : '—'; } }] : []),
              { title: 'Ghi chú', dataIndex: 'note', render: (v) => v ? <span style={{ fontSize: 12, color: '#7a776f' }}>{v}</span> : '' },
            ]} />
          ) },
          ...(en ? [
            { key: 'notes', label: `Session notes (${notes.length})`, children: (
              <List dataSource={notes} locale={{ emptyText: 'HLV chưa ghi nội dung buổi học' }} renderItem={(n) => { const s = sessions.find((x) => x.id === n.sessionId)!; return (
                <List.Item>
                  <List.Item.Meta title={<Space><Tag color="blue">{dayjs(s.date).format('DD/MM')}</Tag><b>{n.title}</b></Space>} description={<><div style={{ whiteSpace: 'pre-line' }}>{n.content}</div>{n.attachments.length > 0 && <div style={{ marginTop: 4 }}>{n.attachments.map((a) => <Tag key={a} icon={<PaperClipOutlined />}>{a}</Tag>)}</div>}<div style={{ fontSize: 12, marginTop: 4 }}>HLV {nameOf(n.coachId)} · {n.createdAt}</div></>} />
                </List.Item>
              ); }} />
            ) },
            { key: 'reviews', label: `Đánh giá của HLV (${reviews.length})`, children: (
              <List dataSource={reviews} locale={{ emptyText: 'Chưa có đánh giá' }} renderItem={(r) => { const s = sessions.find((x) => x.id === r.sessionId)!; return (
                <List.Item><List.Item.Meta title={<Space><Tag color="blue">{dayjs(s.date).format('DD/MM')}</Tag><Rate disabled value={r.rating} /></Space>} description={`${r.comment} — HLV ${nameOf(r.coachId)}, ${r.createdAt}`} /></List.Item>
              ); }} />
            ) },
          ] : []),
        ]} />
      </Card>
    </Page>
  );
}
