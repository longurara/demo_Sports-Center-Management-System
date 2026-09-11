import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Radio, Result, Row, Spin, Steps } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';
import { nextInvoiceNo } from '../../utils/invoice';
import { memberConflict, seatsLeft } from '../../utils/conflicts';
import { courtConflict, courtPrice, hh, planCovers, plansFor, sportOf } from '../../utils/sports';

export default function Checkout() {
  const { kind, id } = useParams<{ kind: 'plan' | 'class' | 'court'; id: string }>();
  const [qs] = useSearchParams();
  const navigate = useNavigate();
  const { data, currentUser, activeSubscription, membershipStatus, add, update, log, notify } = useApp();
  const me = currentUser!;
  const [method, setMethod] = useState<'VNPAY' | 'MOMO' | 'BANK'>('VNPAY');
  const [step, setStep] = useState(0);
  const [invoice, setInvoice] = useState<string>('');

  const plan = kind === 'plan' ? data.plans.find((p) => p.id === id) : undefined;
  const cls = kind === 'class' ? data.classes.find((c) => c.id === id) : undefined;
  const court = kind === 'court' ? data.rooms.find((r) => r.id === id && r.type === 'COURT') : undefined;
  const cDate = qs.get('date') ?? dayjs().format('YYYY-MM-DD');
  const cStart = Number(qs.get('start') ?? 0);
  const cHours = Math.max(1, Number(qs.get('hours') ?? 1));
  const cQuote = court ? courtPrice(data, me.id, court, cHours) : null;
  const sub = activeSubscription(me.id);
  const st = membershipStatus(me.id);
  const isRenew = !!plan && !!sub && st !== 'EXPIRED';
  const start = isRenew ? dayjs(sub!.endDate).add(1, 'day') : dayjs();
  const amount = plan?.price ?? cls?.price ?? cQuote?.price ?? 0;
  const name = plan?.name ?? cls?.name ?? (court ? `${court.name} · ${dayjs(cDate).format('DD/MM')} ${hh(cStart)}–${hh(cStart + cHours)}` : '');

  const errors: string[] = [];
  if (cls) {
    if (st === 'EXPIRED' || st === 'NONE') errors.push('Bạn cần có gói thành viên còn hiệu lực để đăng ký lớp.');
    else { const cov = planCovers(data, me.id, cls.sportId); if (!cov.ok) errors.push(`Gói "${cov.plan?.name}" không bao gồm bộ môn ${sportOf(data, cls.sportId)?.name}. Gói phù hợp: ${plansFor(data, cls.sportId).map((p) => p.name).join(', ')}.`); }
    if (seatsLeft(data, cls.id) <= 0) errors.push('Lớp đã đủ sĩ số.');
    if (data.enrollments.some((e) => e.memberId === me.id && e.classId === cls.id && e.status === 'ACTIVE')) errors.push('Bạn đã đăng ký lớp này.');
    const conflict = memberConflict(data, me.id, cls.id);
    if (conflict) errors.push(`Trùng lịch với lớp "${conflict.name}" bạn đang học.`);
  }

  if (court) {
    const cf = courtConflict(data, court.id, cDate, hh(cStart), hh(cStart + cHours));
    if (cf) errors.push(cf);
    if (dayjs(`${cDate} ${hh(cStart)}`).isBefore(dayjs())) errors.push('Khung giờ đã qua.');
  }

  const pay = () => {
    setStep(1);
    setTimeout(() => {
      const inv = nextInvoiceNo(data.payments);
      if (plan) {
        if (isRenew) update('subscriptions', sub!.id, { status: 'EXPIRED' });
        add('subscriptions', { memberId: me.id, planId: plan.id, startDate: start.format('YYYY-MM-DD'), endDate: start.add(plan.durationDays, 'day').format('YYYY-MM-DD'), status: 'ACTIVE' });
        notify(me.id, isRenew ? 'Gia hạn thành công' : 'Kích hoạt gói thành công', `Gói ${plan.name} có hiệu lực đến ${start.add(plan.durationDays, 'day').format('DD/MM/YYYY')}.`);
      }
      if (cls) {
        add('enrollments', { classId: cls.id, memberId: me.id, enrolledAt: dayjs().format('YYYY-MM-DD'), status: 'ACTIVE' });
        notify(me.id, 'Đăng ký lớp thành công', `Bạn đã đăng ký lớp ${cls.name}.`);
      }
      if (court) {
        add('courtBookings', { courtId: court.id, memberId: me.id, date: cDate, startTime: hh(cStart), endTime: hh(cStart + cHours), price: amount, status: 'BOOKED', createdAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: me.id });
        notify(me.id, 'Đặt sân thành công', `${court.name} ngày ${dayjs(cDate).format('DD/MM')} lúc ${hh(cStart)}–${hh(cStart + cHours)}. Vui lòng đến quầy nhận sân trước 10 phút.`);
      }
      add('payments', { invoiceNo: inv, memberId: me.id, amount, method, type: plan ? 'PLAN' : cls ? 'CLASS' : 'COURT', refName: name, paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: me.id });
      log('ONLINE_PAYMENT', 'Payment', inv, `${me.fullName} thanh toán online ${fmtMoney(amount)} - ${name} qua ${method}`);
      setInvoice(inv); setStep(2);
    }, 1500);
  };

  if (!plan && !cls && !court) return <Page title="Không tìm thấy sản phẩm"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;

  return (
    <Page title="Thanh toán" noCard>
      <Steps current={step} items={[{ title: 'Xác nhận' }, { title: 'Cổng thanh toán' }, { title: 'Hoàn tất' }]} style={{ marginBottom: 24 }} />
      {step === 0 && (
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Card title="Thông tin đơn hàng">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Sản phẩm">{plan ? 'Gói thành viên' : cls ? 'Học phí lớp' : 'Thuê sân'}: <b>{name}</b></Descriptions.Item>
                {court && cQuote && <Descriptions.Item label="Chi tiết">{cHours} giờ × {fmtMoney(court.hourlyRate ?? 0)}{cQuote.discount > 0 && <span style={{ color: '#16a34a' }}> · giảm {cQuote.discount}% (gói {cQuote.plan?.name})</span>}</Descriptions.Item>}
                {plan && <Descriptions.Item label="Hiệu lực">{start.format('DD/MM/YYYY')} → {start.add(plan.durationDays, 'day').format('DD/MM/YYYY')} {isRenew && '(nối tiếp gói hiện tại)'}</Descriptions.Item>}
                {cls && <Descriptions.Item label="Khóa học">{cls.startDate} → {cls.endDate}</Descriptions.Item>}
                <Descriptions.Item label="Thành viên">{me.fullName} · {me.phone}</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền"><b style={{ fontSize: 18 }}>{fmtMoney(amount)}</b></Descriptions.Item>
              </Descriptions>
              {errors.map((e) => <Alert key={e} type="error" showIcon title={e} style={{ marginTop: 12 }} />)}
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <Card title="Phương thức thanh toán">
              <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Radio value="VNPAY">VNPay (QR / thẻ ATM / Visa)</Radio>
                <Radio value="MOMO">Ví MoMo</Radio>
                <Radio value="BANK">Chuyển khoản ngân hàng</Radio>
              </Radio.Group>
              <Button type="primary" size="large" block style={{ marginTop: 24 }} disabled={errors.length > 0} onClick={pay}>Thanh toán {fmtMoney(amount)}</Button>
              <Button block style={{ marginTop: 8 }} onClick={() => navigate(-1)}>Hủy</Button>
            </Card>
          </Col>
        </Row>
      )}
      {step === 1 && <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /><div style={{ marginTop: 16 }}>Đang chuyển đến cổng {method} (sandbox)...</div></Card>}
      {step === 2 && (
        <Card>
          <Result status="success" title="Thanh toán thành công!" subTitle={`Hóa đơn ${invoice} · ${fmtMoney(amount)} · ${name}`}
            extra={[
              <Button key="inv" onClick={() => navigate('/member/payments')}>Xem hóa đơn</Button>,
              <Button key="home" type="primary" onClick={() => navigate(plan ? '/member/membership' : court ? '/member/courts' : '/member/schedule')}>{plan ? 'Xem gói của tôi' : court ? 'Lịch đặt sân' : 'Xem lịch tập'}</Button>,
            ]} />
        </Card>
      )}
    </Page>
  );
}
