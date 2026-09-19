import { useState } from 'react';
import { Button, Card, Col, Row, Segmented, Select, Space, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, classPrice, enrollable, seatsLeft } from '../../utils/classes';
import { validateLine } from '../../utils/pricing';
import { benefitsOf } from '../../utils/slots';

/** Danh mục lớp (UC_2.16, BR_2.9): OPEN chưa bắt đầu có HLV mới nhận đăng ký; không cần gói. Thêm vào đơn đang soạn. */
export default function MemberClasses() {
  const { data, currentUser, nameOf, cart, addToCart } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const [sport, setSport] = useState<string | undefined>();
  const [coach, setCoach] = useState<string | undefined>();
  const [day, setDay] = useState<number | undefined>();
  const [scope, setScope] = useState<'OPEN' | 'MINE'>('OPEN');
  const plan = benefitsOf(data, me.id);
  const myEnroll = (classId: string) => data.enrollments.find((e) => e.memberId === me.id && e.classId === classId && e.status === 'ENROLLED');

  const list = data.classes.filter((c) => (scope === 'OPEN' ? enrollable(data, c) || (c.status === 'OPEN' && classPhase(c) === 'ONGOING') : !!myEnroll(c.id)) && (!sport || c.sportId === sport) && (!coach || c.coachId === coach) && (!day || data.schedules.some((s) => s.classId === c.id && s.dayOfWeek === day)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const add = (c: typeof list[number]) => {
    const co = data.courses.find((x) => x.id === c.courseId);
    addToCart({ type: 'COURSE_ENROLLMENT', classId: c.id, name: `Lớp ${c.name}`, detail: `${co?.name} · ${co?.totalSessions} buổi · ${dayjs(c.startDate).format('DD/MM')} → ${dayjs(c.endDate).format('DD/MM/YYYY')} · HLV ${nameOf(c.coachId)}` });
    message.success('Đã thêm lớp vào đơn đang soạn'); navigate('/member/checkout');
  };

  return (
    <Page title="Lớp học" subtitle={plan?.classDiscountPct ? `Gói ${plan.name} giảm ${plan.classDiscountPct}% học phí mọi lớp` : 'Không cần gói vẫn đăng ký được. Đăng ký lớp OPEN chưa bắt đầu, còn chỗ, không trùng lịch.'} extra={
      <Space wrap>
        <Segmented value={scope} onChange={(v) => setScope(v as typeof scope)} options={[{ value: 'OPEN', label: 'Đang mở' }, { value: 'MINE', label: 'Lớp của tôi' }]} />
        <Select placeholder="Bộ môn" allowClear style={{ width: 140 }} onChange={setSport} options={data.sports.filter((s) => !s.deletedAt).map((s) => ({ value: s.id, label: s.name }))} />
        <Select placeholder="Huấn luyện viên" allowClear style={{ width: 170 }} onChange={setCoach} options={data.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE').map((u) => ({ value: u.id, label: u.fullName }))} />
        <Select placeholder="Ngày" allowClear style={{ width: 120 }} onChange={setDay} options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: DAY_NAMES[d] }))} />
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        {list.length === 0 && <Col span={24}><Card><div style={{ color: '#9a968c', textAlign: 'center', padding: 24 }}>Không có lớp phù hợp.</div></Card></Col>}
        {list.map((c) => {
          const en = myEnroll(c.id);
          const left = seatsLeft(data, c.id);
          const phase = classPhase(c);
          const inCart = cart.lines.some((l) => l.type === 'COURSE_ENROLLMENT' && l.classId === c.id);
          const err = !en && enrollable(data, c) ? validateLine(data, { kind: 'MEMBER', memberId: me.id }, { key: 'x', type: 'COURSE_ENROLLMENT', classId: c.id, name: c.name, detail: '' }, cart.lines) : null;
          const price = classPrice(data, c);
          const after = plan?.classDiscountPct ? Math.floor(price * (100 - plan.classDiscountPct) / 100 + 0.5) : price;
          return (
            <Col xs={24} md={12} xl={8} key={c.id}>
              <Card title={c.name} extra={en ? <Tag color="blue">Đã đăng ký</Tag> : phase === 'ONGOING' ? <StatusTag value="ONGOING" /> : <Tag color={left > 0 ? 'green' : 'red'}>{left > 0 ? `Còn ${left} chỗ` : 'Hết chỗ'}</Tag>} hoverable onClick={() => navigate(`/member/classes/${c.id}`)}>
                <div><Tag>{data.sports.find((s) => s.id === c.sportId)?.name}</Tag> HLV <b>{nameOf(c.coachId)}</b></div>
                <div style={{ margin: '8px 0', color: '#666' }}>{data.schedules.filter((s) => s.classId === c.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(' · ')}</div>
                <div style={{ fontSize: 13 }}>{data.rooms.find((r) => r.id === c.roomId)?.name} · {dayjs(c.startDate).format('DD/MM')} → {dayjs(c.endDate).format('DD/MM/YYYY')} · {data.courses.find((x) => x.id === c.courseId)?.totalSessions} buổi</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                  <span><b style={{ fontSize: 16 }}>{fmtMoney(after)}</b>{after !== price && <small style={{ color: '#9a968c', textDecoration: 'line-through', marginLeft: 6 }}>{fmtMoney(price)}</small>}</span>
                  {en ? <Button size="small" onClick={() => navigate(`/member/classes/${c.id}`)}>Chi tiết</Button>
                    : phase === 'ONGOING' ? <span style={{ fontSize: 12, color: '#9a968c' }}>Đã bắt đầu — không nhận thêm</span>
                    : inCart ? <Tag color="green">Trong đơn</Tag>
                    : <Button type="primary" size="small" disabled={!!err} title={err ?? ''} onClick={() => add(c)}>{err ? 'Không thể' : 'Thêm vào đơn'}</Button>}
                </div>
                {err && !en && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{err}</div>}
              </Card>
            </Col>
          );
        })}
      </Row>
    </Page>
  );
}
