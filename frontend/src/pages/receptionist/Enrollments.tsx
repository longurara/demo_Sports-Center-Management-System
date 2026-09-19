import { useState } from 'react';
import { Alert, Button, Card, Col, Popconfirm, Row, Select, Space, Table, Tag, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, classPrice, enrollable, seatsLeft } from '../../utils/classes';
import { validateLine } from '../../utils/pricing';
import { benefitsOf } from '../../utils/slots';

/** Đăng ký / hủy lớp tại quầy (UC_2.16/2.17): thêm COURSE_ENROLLMENT vào đơn tại quầy; hủy theo deadline BR_2.7. */
export default function Enrollments() {
  const { data, cart, setCartBuyer, addToCart, nameOf, membershipStatus, cancelEnrollment } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? (cart.buyer?.kind === 'MEMBER' ? cart.buyer.memberId : undefined));
  const [classId, setClassId] = useState<string | undefined>();
  const cls = data.classes.find((c) => c.id === classId);
  const st = memberId ? membershipStatus(memberId) : undefined;
  const plan = benefitsOf(data, memberId);
  const error = memberId && cls ? validateLine(data, { kind: 'MEMBER', memberId }, { key: 'x', type: 'COURSE_ENROLLMENT', classId: cls.id, name: cls.name, detail: '' }, cart.lines) : null;
  const mine = data.enrollments.filter((e) => e.memberId === memberId).map((e) => ({ ...e, cls: data.classes.find((c) => c.id === e.classId)! })).sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));

  const addLine = () => {
    if (!memberId || !cls) return;
    if (cart.buyer?.kind !== 'MEMBER' || cart.buyer.memberId !== memberId) setCartBuyer({ kind: 'MEMBER', memberId });
    const co = data.courses.find((c) => c.id === cls.courseId);
    addToCart({ type: 'COURSE_ENROLLMENT', classId: cls.id, name: `Lớp ${cls.name}`, detail: `${co?.name} · ${co?.totalSessions} buổi · ${dayjs(cls.startDate).format('DD/MM')} → ${dayjs(cls.endDate).format('DD/MM/YYYY')} · HLV ${nameOf(cls.coachId)}` });
    message.success('Đã thêm vào đơn tại quầy'); setClassId(undefined); navigate('/receptionist/counter');
  };

  return (
    <Page title="Đăng ký / hủy lớp tại quầy" subtitle="Không cần gói vẫn đăng ký được; gói chỉ giảm học phí. Lớp OPEN chưa bắt đầu, còn chỗ, không trùng lịch." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Thành viên">
            <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={(v) => { setMemberId(v); setClassId(undefined); }}
              options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
            {memberId && <div style={{ marginTop: 12 }}>Gói: <StatusTag value={st} /> {plan && <Tag color="geekblue">−{plan.classDiscountPct}% học phí</Tag>}</div>}
          </Card>
          {memberId && (
            <Card title="Lớp đã đăng ký" style={{ marginTop: 16 }}>
              <Table size="small" rowKey="id" pagination={false} dataSource={mine} columns={[
                { title: 'Lớp', render: (_, r) => <><b>{r.cls?.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{dayjs(r.cls?.startDate).format('DD/MM')} → {dayjs(r.cls?.endDate).format('DD/MM')} · <StatusTag value={classPhase(r.cls)} /></div></> },
                { title: 'Trạng thái', dataIndex: 'status', render: (v, r) => <span className="sc-nowrap"><StatusTag value={v} />{r.refundedAmount > 0 && <small style={{ color: '#dc2626' }}>hoàn {fmtMoney(r.refundedAmount)}</small>}</span> },
                { title: '', render: (_, r) => r.status === 'ENROLLED' && classPhase(r.cls) !== 'COMPLETED' && (() => { const days = dayjs(r.cls.startDate).diff(dayjs().startOf('day'), 'day'); const ok = days >= data.settings.courseCancelDeadlineDays; return (
                  <Popconfirm title={ok ? `Hủy đăng ký? Hoàn 100% học phí về ví (còn ${days} ngày ≥ ${data.settings.courseCancelDeadlineDays}).` : 'Hủy đăng ký? Quá deadline — KHÔNG hoàn tiền.'} onConfirm={() => { const res = cancelEnrollment(r.id, 'STAFF'); message.success(`Đã hủy, hoàn ${fmtMoney(res.refunded)}`); }}><Button size="small" danger>Hủy</Button></Popconfirm>
                ); })() },
              ]} />
            </Card>
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Đăng ký lớp mới">
            {!memberId ? <Alert type="info" title="Chọn thành viên trước" /> : (
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Select placeholder="Chọn lớp đang nhận đăng ký" style={{ width: '100%' }} value={classId} onChange={setClassId}
                  options={data.classes.filter((c) => enrollable(data, c)).map((c) => ({ value: c.id, label: `${c.name} · HLV ${nameOf(c.coachId)} · còn ${seatsLeft(data, c.id)} chỗ · ${fmtMoney(classPrice(data, c))} · bắt đầu ${dayjs(c.startDate).format('DD/MM')}` }))} />
                {cls && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <SportTag id={cls.sportId} />
                    <span><b>Lịch:</b> {data.schedules.filter((s) => s.classId === cls.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')}</span>
                    <span><b>Học phí:</b> {fmtMoney(classPrice(data, cls))}{plan?.classDiscountPct ? <span style={{ color: '#16a34a' }}> → {fmtMoney(Math.floor(classPrice(data, cls) * (100 - plan.classDiscountPct) / 100 + 0.5))} (−{plan.classDiscountPct}%)</span> : null}</span>
                  </div>
                )}
                {error && <Alert type="error" showIcon title={error} />}
                {cls && !error && <Button type="primary" size="large" onClick={addLine}>Thêm vào đơn tại quầy</Button>}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
