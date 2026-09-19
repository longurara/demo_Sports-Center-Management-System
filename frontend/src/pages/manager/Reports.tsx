import { useState } from 'react';
import { Button, Card, Col, DatePicker, Progress, Radio, Row, Space, Table, Tabs, Tag, message } from 'antd';
import { DollarOutlined, DownloadOutlined, FieldTimeOutlined, GiftOutlined, PrinterOutlined, ReadOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import Donut from '../../components/Donut';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import SportTag from '../../components/SportTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { downloadCsv } from '../../utils/csv';
import { labelOf } from '../../components/StatusTag';
import { classPhase, coachSportIds, enrolledCount } from '../../utils/classes';
import { slotsOf } from '../../utils/slots';
import type { OrderItemType } from '../../types';

const TYPES: OrderItemType[] = ['MEMBERSHIP', 'COURSE_ENROLLMENT', 'FACILITY_BOOKING', 'FACILITY_PACKAGE'];
const COLORS = ['#0f4d34', '#c94a1e', '#06b6d4', '#9333ea'];

/** Báo cáo (UC_3.11–3.15, BR_3.9, BR_3.14): doanh số theo orders/order_items, mốc = paidAt; hoàn = REFUND ledger; không cộng top-up. */
export default function Reports() {
  const { data, nameOf, userById } = useApp();
  const [gran, setGran] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(5, 'month').startOf('month'), dayjs().endOf('day')]);
  const from = range[0].format('YYYY-MM-DD'), to = range[1].format('YYYY-MM-DD') + ' 23:59';

  const orders = data.orders.filter((o) => o.paidAt >= from && o.paidAt <= to);
  const orderIds = new Set(orders.map((o) => o.id));
  const items = data.orderItems.filter((it) => orderIds.has(it.orderId)).map((it) => ({ ...it, order: data.orders.find((o) => o.id === it.orderId)! }));
  const refunds = data.walletTransactions.filter((w) => w.type === 'REFUND' && w.createdAt >= from && w.createdAt <= to);
  const gross = orders.reduce((s, o) => s + o.total, 0);
  const refunded = refunds.reduce((s, w) => s + w.amount, 0);
  const byType = TYPES.map((t) => ({ type: labelOf(t), value: items.filter((it) => it.type === t).reduce((s, it) => s + it.total, 0), count: items.filter((it) => it.type === t).length }));
  const byMethod = (['WALLET', 'CASH', 'BANK', 'CARD'] as const).map((m) => ({ method: labelOf(m), value: orders.filter((o) => o.paymentMethod === m).reduce((s, o) => s + o.total, 0), count: orders.filter((o) => o.paymentMethod === m).length }));

  const keyOf = (d: string) => gran === 'day' ? d.slice(0, 10) : gran === 'week' ? dayjs(d).startOf('week').format('YYYY-MM-DD') : gran === 'month' ? d.slice(0, 7) : d.slice(0, 4);
  const fmt = (k: string) => gran === 'day' ? dayjs(k).format('DD/MM') : gran === 'week' ? `T${dayjs(k).format('DD/MM')}` : gran === 'month' ? dayjs(k).format('MM/YYYY') : k;
  const buckets: string[] = [];
  for (let d = range[0].startOf(gran === 'week' ? 'week' : gran); d.isBefore(range[1]); d = d.add(1, gran)) buckets.push(keyOf(d.format('YYYY-MM-DD HH:mm')));
  const revenueSeries = buckets.slice(-24).flatMap((key) => TYPES.map((t) => ({ period: fmt(key), type: labelOf(t), revenue: items.filter((it) => keyOf(it.order.paidAt) === key && it.type === t).reduce((s, it) => s + it.total, 0) })));

  // Thành viên: mới theo tháng, trạng thái gói, tỷ lệ gia hạn (member có ≥ 2 kỳ MEMBERSHIP / member có ≥ 1)
  const members = data.users.filter((u) => u.role === 'MEMBER');
  const newMembers = Array.from({ length: 6 }).map((_, i) => { const m = dayjs().subtract(5 - i, 'month'); return { month: m.format('MM/YYYY'), count: members.filter((u) => u.createdAt.startsWith(m.format('YYYY-MM'))).length }; });
  const periodsBy = new Map<string, number>();
  data.orderItems.filter((it) => it.type === 'MEMBERSHIP').forEach((it) => { const b = data.orders.find((o) => o.id === it.orderId)?.buyerId; if (b) periodsBy.set(b, (periodsBy.get(b) ?? 0) + 1); });
  const renewRate = periodsBy.size ? Math.round(Array.from(periodsBy.values()).filter((n) => n >= 2).length / periodsBy.size * 100) : 0;
  const autoRenew = data.subscriptions.filter((s) => s.status === 'ACTIVE' && s.autoRenew).length;
  const topMembers = members.map((u) => ({ key: u.id, user: u, total: orders.filter((o) => o.buyerId === u.id).reduce((s, o) => s + o.total, 0), count: orders.filter((o) => o.buyerId === u.id).length })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  // Facility: tỷ lệ lấp đầy = (slot có booking + slot có buổi học) / slot khả dụng trong kỳ
  const rangeDays = Math.max(1, range[1].diff(range[0], 'day') + 1);
  const slotsPerDay = slotsOf(data.settings).length;
  const facilityUtil = data.rooms.filter((r) => !r.deletedAt).map((r) => {
    const bks = data.bookings.filter((b) => b.roomId === r.id && b.status === 'CONFIRMED' && b.date >= from.slice(0, 10) && b.date <= to.slice(0, 10));
    const bSlots = bks.reduce((s, b) => s + Math.max(1, Math.round((Number(b.endTime.slice(0, 2)) * 60 + Number(b.endTime.slice(3)) - Number(b.startTime.slice(0, 2)) * 60 - Number(b.startTime.slice(3))) / data.settings.slotMinutes)), 0);
    const sess = data.sessions.filter((s) => s.roomId === r.id && s.status === 'SCHEDULED' && s.date >= from.slice(0, 10) && s.date <= to.slice(0, 10) && data.classes.find((c) => c.id === s.classId)?.status !== 'CANCELLED');
    const sSlots = sess.reduce((s, x) => s + Math.max(1, Math.round((Number(x.endTime.slice(0, 2)) * 60 - Number(x.startTime.slice(0, 2)) * 60) / data.settings.slotMinutes)), 0);
    const cancelled = data.bookings.filter((b) => b.roomId === r.id && b.status === 'CANCELLED' && b.date >= from.slice(0, 10) && b.date <= to.slice(0, 10)).length;
    const peak = bks.reduce<Record<string, number>>((acc, b) => { acc[b.startTime] = (acc[b.startTime] ?? 0) + 1; return acc; }, {});
    const avail = rangeDays * slotsPerDay * r.capacity;
    return { key: r.id, room: r, bookings: bks.length, guests: bks.filter((b) => !b.memberId).length, sessions: sess.length, cancelled, util: Math.min(100, Math.round((bSlots + sSlots * r.capacity) / Math.max(1, avail) * 100)), revenue: bks.reduce((s, b) => s + b.price - b.refundedAmount, 0), peakHour: Object.entries(peak).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—' };
  }).sort((a, b) => b.util - a.util);

  // Khóa học / lớp: học viên, lấp đầy, HLV nhiều học viên nhất, chuyên cần (F4)
  const classRows = data.classes.filter((c) => c.status !== 'DRAFT').map((c) => {
    const n = enrolledCount(data, c.id);
    const sess = data.sessions.filter((s) => s.classId === c.id && s.status === 'SCHEDULED');
    const att = data.attendances.filter((a) => sess.some((s) => s.id === a.sessionId));
    const rev = items.filter((it) => it.type === 'COURSE_ENROLLMENT' && data.enrollments.some((e) => e.id === it.refId && e.classId === c.id)).reduce((s, it) => s + it.total - it.refundedAmount, 0);
    return { key: c.id, name: c.name, sport: data.sports.find((s) => s.id === c.sportId)?.name, coach: nameOf(c.coachId), n, capacity: c.capacity, rate: Math.round((n / c.capacity) * 100), phase: classPhase(c), attRate: att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0, revenue: rev };
  });
  const coachPerf = data.users.filter((u) => u.role === 'COACH').map((u) => {
    const cls = data.classes.filter((c) => c.coachId === u.id && c.status === 'OPEN');
    const students = new Set(data.enrollments.filter((e) => cls.some((c) => c.id === e.classId) && e.status === 'ENROLLED').map((e) => e.memberId)).size;
    const sess = data.sessions.filter((s) => cls.some((c) => c.id === s.classId) && s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < dayjs().format('YYYY-MM-DD HH:mm'));
    const att = data.attendances.filter((a) => sess.some((s) => s.id === a.sessionId));
    const reviews = data.progressReviews.filter((r) => r.coachId === u.id && !r.deletedAt);
    return { key: u.id, user: u, classes: cls.length, students, sessions: sess.length, attRate: att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0, rating: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—', revenue: items.filter((it) => it.type === 'COURSE_ENROLLMENT' && cls.some((c) => data.enrollments.some((e) => e.id === it.refId && e.classId === c.id))).reduce((s, it) => s + it.total, 0) };
  }).sort((a, b) => b.students - a.students);
  const sportRevenue = data.sports.filter((s) => !s.deletedAt).map((sp) => {
    const cls = items.filter((it) => it.type === 'COURSE_ENROLLMENT' && data.enrollments.some((e) => e.id === it.refId && data.classes.find((c) => c.id === e.classId)?.sportId === sp.id)).reduce((s, it) => s + it.total, 0);
    const court = facilityUtil.filter((f) => f.room.sportIds.includes(sp.id)).reduce((s, f) => s + f.revenue / Math.max(1, f.room.sportIds.length), 0);
    return { key: sp.id, sport: sp, classes: data.classes.filter((c) => c.sportId === sp.id && c.status === 'OPEN').length, students: new Set(data.enrollments.filter((e) => e.status === 'ENROLLED' && data.classes.some((c) => c.id === e.classId && c.sportId === sp.id)).map((e) => e.memberId)).size, cls, court: Math.round(court), total: cls + Math.round(court) };
  }).sort((a, b) => b.total - a.total);

  const exportCsv = () => {
    downloadCsv(`doanh-thu_${range[0].format('YYYYMMDD')}-${range[1].format('YYYYMMDD')}.csv`, items.map((it) => ({ 'Số HĐ': it.order.orderNumber, 'Ngày': it.order.paidAt, 'Người mua': it.order.buyerId ? nameOf(it.order.buyerId) : `Guest ${it.order.guestName}`, 'SĐT': userById(it.order.buyerId)?.phone ?? it.order.guestPhone, 'Loại': labelOf(it.type), 'Dịch vụ': it.name, 'Giá gốc': it.unitPrice, 'Ưu đãi gói': it.membershipDiscount, 'Coupon': it.couponDiscount, 'Thành tiền': it.total, 'Đã hoàn': it.refundedAmount, 'PT': labelOf(it.order.paymentMethod) })));
    message.success(`Đã xuất ${items.length} dòng (Excel mở được file CSV)`);
  };

  return (
    <Page title="Báo cáo & thống kê" subtitle={`Kỳ ${range[0].format('DD/MM/YYYY')} – ${range[1].format('DD/MM/YYYY')} · doanh số theo order, mốc = thời điểm thanh toán · không gồm nạp ví`} extra={
      <Space wrap>
        <DatePicker.RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} presets={[
          { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
          { label: 'Tuần này', value: [dayjs().startOf('week'), dayjs().endOf('day')] },
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] },
          { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
          { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs()] },
          { label: '6 tháng', value: [dayjs().subtract(5, 'month').startOf('month'), dayjs()] },
        ]} />
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất Excel (CSV)</Button>
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Xuất PDF</Button>
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Doanh số" value={fmtMoney(gross)} icon={<DollarOutlined />} color="#0f4d34" hint={`${orders.length} hóa đơn · hoàn ${fmtMoney(refunded)} (${refunds.length})`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Gói thành viên" value={fmtMoney(byType[0].value)} icon={<GiftOutlined />} color="#9333ea" hint={`${byType[0].count} kỳ · ${Math.round((byType[0].value / Math.max(1, gross)) * 100)}%`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Học phí lớp" value={fmtMoney(byType[1].value)} icon={<ReadOutlined />} color="#c94a1e" hint={`${byType[1].count} đăng ký · ${Math.round((byType[1].value / Math.max(1, gross)) * 100)}%`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Đặt sân + gói định kỳ" value={fmtMoney(byType[2].value + byType[3].value)} icon={<FieldTimeOutlined />} color="#06b6d4" hint={`${byType[2].count} lượt · ${byType[3].count} gói`} /></Col>
      </Row>
      <Card>
        <Tabs items={[
          { key: 'rev', label: 'Doanh thu', children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <b>Doanh thu theo thời gian (order_items.type)</b>
                  <Radio.Group size="small" value={gran} onChange={(e) => setGran(e.target.value)} options={[{ value: 'day', label: 'Ngày' }, { value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' }]} optionType="button" />
                </div>
                <Column data={revenueSeries} xField="period" yField="revenue" colorField="type" group height={300} style={{ radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 36 }} scale={{ color: { range: COLORS } }} axis={{ y: { labelFormatter: (v: number) => (v / 1e6).toFixed(1) + 'tr', grid: true, gridLineDash: [4, 4] } }} legend={{ color: { position: 'top' } }} tooltip={{ items: [{ channel: 'y', valueFormatter: (v: number) => fmtMoney(v) }] }} />
              </Col>
              <Col xs={24} xl={8}>
                <b>Theo loại dịch vụ</b>
                <div style={{ margin: '12px 0 20px' }}>
                  <Donut size={120} thickness={18} items={byType.map((t, i) => ({ label: t.type, value: t.value, color: COLORS[i] }))} format={(v) => fmtMoney(v)} center={<div style={{ fontSize: 11, color: '#9a968c' }}>Tổng<br /><b style={{ color: '#14130f', fontSize: 13 }}>{(gross / 1e6).toFixed(1)}tr</b></div>} />
                </div>
                <b>Theo phương thức</b>
                <div style={{ marginTop: 12 }}>
                  <Donut size={120} thickness={18} items={byMethod.map((m, i) => ({ label: m.method, value: m.value, color: ['#16a34a', '#7a776f', '#0f4d34', '#06b6d4'][i], hint: `${m.count} HĐ` }))} format={(v) => fmtMoney(v)} center={<div style={{ fontSize: 11, color: '#9a968c' }}>{orders.length}<br />HĐ</div>} />
                </div>
              </Col>
            </Row>
          ) },
          { key: 'members', label: 'Thành viên', children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={8}>
                <Row gutter={[12, 12]}>
                  <Col span={12}><Card size="small"><div style={{ fontSize: 12, color: '#7a776f' }}>Tổng thành viên</div><b style={{ fontSize: 22 }}>{members.length}</b></Card></Col>
                  <Col span={12}><Card size="small"><div style={{ fontSize: 12, color: '#7a776f' }}>Gói còn hiệu lực</div><b style={{ fontSize: 22 }}>{data.subscriptions.filter((s) => s.status === 'ACTIVE' && s.endDate > dayjs().format('YYYY-MM-DD')).length}</b></Card></Col>
                  <Col span={12}><Card size="small"><div style={{ fontSize: 12, color: '#7a776f' }}>Tỷ lệ gia hạn</div><b style={{ fontSize: 22 }}>{renewRate}%</b><div style={{ fontSize: 11, color: '#9a968c' }}>member mua ≥ 2 kỳ</div></Card></Col>
                  <Col span={12}><Card size="small"><div style={{ fontSize: 12, color: '#7a776f' }}>Bật auto-renew</div><b style={{ fontSize: 22 }}>{autoRenew}</b></Card></Col>
                </Row>
                <div style={{ marginTop: 16 }}><b>Thành viên mới theo tháng</b><Column data={newMembers} xField="month" yField="count" height={200} style={{ fill: '#16a34a', radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 36 }} /></div>
              </Col>
              <Col xs={24} xl={8}>
                <b>Trạng thái tài khoản</b>
                <Table size="small" pagination={false} style={{ marginTop: 8 }} rowKey="s" dataSource={['ACTIVE', 'INACTIVE', 'BANNED'].map((s) => ({ s, n: members.filter((u) => u.status === s).length }))} columns={[{ title: 'Trạng thái', dataIndex: 's', render: (v) => <StatusTag value={v} /> }, { title: 'Số lượng', dataIndex: 'n', align: 'right' }]} />
                <b style={{ display: 'block', marginTop: 16 }}>Gói đang dùng</b>
                <Table size="small" pagination={false} style={{ marginTop: 8 }} rowKey="id" dataSource={data.plans.filter((p) => !p.deletedAt).map((p) => ({ id: p.id, name: p.name, n: data.subscriptions.filter((s) => s.planId === p.id && s.status === 'ACTIVE').length, sold: items.filter((it) => it.type === 'MEMBERSHIP' && it.name.includes(p.name)).length })).filter((x) => x.n || x.sold)} columns={[{ title: 'Gói', dataIndex: 'name' }, { title: 'Đang dùng', dataIndex: 'n', align: 'right' }, { title: 'Bán trong kỳ', dataIndex: 'sold', align: 'right' }]} />
              </Col>
              <Col xs={24} xl={8}><b>Top chi tiêu trong kỳ</b><Table size="small" pagination={false} dataSource={topMembers} style={{ marginTop: 8 }} columns={[{ title: '#', render: (_, __, i) => i + 1, width: 40 }, { title: 'Thành viên', render: (_, r) => <UserCell user={r.user} sub={r.user.phone} size={28} /> }, { title: 'HĐ', dataIndex: 'count', align: 'right' }, { title: 'Tổng', dataIndex: 'total', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b> }]} /></Col>
            </Row>
          ) },
          { key: 'facility', label: 'Sử dụng facility', children: (
            <Table size="middle" pagination={false} dataSource={facilityUtil} columns={[
              { title: 'Facility', render: (_, r) => <><b>{r.room.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}><StatusTag value={r.room.type} /> {r.room.location} · {r.room.capacity} chỗ/slot</div></> },
              { title: 'Lượt đặt', dataIndex: 'bookings', align: 'center', render: (v, r) => <span>{v} <span style={{ fontSize: 11, color: '#9a968c' }}>({r.guests} guest)</span></span> },
              { title: 'Buổi học', dataIndex: 'sessions', align: 'center' },
              { title: 'Hủy', dataIndex: 'cancelled', align: 'center', render: (v) => v ? <Tag color="red" style={{ margin: 0 }}>{v}</Tag> : '0' },
              { title: 'Giờ cao điểm', dataIndex: 'peakHour', align: 'center' },
              { title: 'Tỷ lệ lấp đầy', dataIndex: 'util', width: 220, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 40 ? '#16a34a' : v >= 20 ? '#0f4d34' : '#f59e0b'} /> },
              { title: 'Doanh thu booking', dataIndex: 'revenue', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b>, sorter: (a, b) => a.revenue - b.revenue },
            ]} />
          ) },
          { key: 'classes', label: 'Khóa học & lớp', children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={14}>
                <b>Số học viên / lớp, tỷ lệ lấp đầy, chuyên cần (F4)</b>
                <Table size="small" pagination={{ pageSize: 8 }} dataSource={classRows} style={{ marginTop: 8 }} columns={[
                  { title: 'Lớp', dataIndex: 'name', render: (v, r) => <><b>{v}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{r.sport} · <StatusTag value={r.phase} /></div></> },
                  { title: 'HLV', dataIndex: 'coach' },
                  { title: 'Sĩ số', render: (_, r) => `${r.n}/${r.capacity}` },
                  { title: 'Lấp đầy', dataIndex: 'rate', width: 150, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 80 ? '#16a34a' : v >= 40 ? '#0f4d34' : '#f59e0b'} /> },
                  { title: 'Chuyên cần', dataIndex: 'attRate', render: (v) => v ? <Tag color={v >= 85 ? 'green' : v >= 70 ? 'blue' : 'orange'}>{v}%</Tag> : '—' },
                  { title: 'Doanh thu kỳ', dataIndex: 'revenue', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b>, sorter: (a, b) => a.revenue - b.revenue },
                ]} />
              </Col>
              <Col xs={24} xl={10}>
                <b>HLV theo số học viên</b>
                <Table size="small" pagination={false} dataSource={coachPerf} style={{ marginTop: 8 }} columns={[
                  { title: 'HLV', render: (_, r) => <UserCell user={r.user} sub={coachSportIds(data, r.user.id).map((id) => data.sports.find((s) => s.id === id)?.name).filter(Boolean).join(' · ')} size={28} /> },
                  { title: 'Lớp', dataIndex: 'classes', align: 'center' },
                  { title: 'HV', dataIndex: 'students', align: 'center', render: (v, _, i) => i === 0 && v ? <Tag color="gold" style={{ margin: 0 }}>★ {v}</Tag> : v },
                  { title: 'Chuyên cần', dataIndex: 'attRate', render: (v) => v ? `${v}%` : '—' },
                  { title: 'Đánh giá', dataIndex: 'rating' },
                ]} />
                <b style={{ display: 'block', marginTop: 16 }}>Theo bộ môn</b>
                <Table size="small" pagination={false} dataSource={sportRevenue} style={{ marginTop: 8 }} columns={[
                  { title: 'Bộ môn', render: (_, r) => <SportTag id={r.sport.id} /> },
                  { title: 'Lớp', dataIndex: 'classes', align: 'center' },
                  { title: 'HV', dataIndex: 'students', align: 'center' },
                  { title: 'Học phí', dataIndex: 'cls', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
                  { title: 'Booking', dataIndex: 'court', align: 'right', render: (v) => <span className="sc-nowrap">{v ? fmtMoney(v) : '—'}</span> },
                ]} />
              </Col>
            </Row>
          ) },
        ]} />
      </Card>
    </Page>
  );
}
