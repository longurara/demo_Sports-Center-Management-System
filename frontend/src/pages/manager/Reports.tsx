import { useState } from 'react';
import { Button, Card, Col, DatePicker, Progress, Radio, Row, Space, Table, Tabs, Tag, message } from 'antd';
import { DollarOutlined, DownloadOutlined, FieldTimeOutlined, GiftOutlined, ReadOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import Donut from '../../components/Donut';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { downloadCsv } from '../../utils/csv';
import { labelOf } from '../../components/StatusTag';

export default function Reports() {
  const { data, nameOf, userById } = useApp();
  const [gran, setGran] = useState<'day' | 'month' | 'year'>('month');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(5, 'month').startOf('month'), dayjs().endOf('day')]);

  const inRange = data.payments.filter((p) => p.paidAt >= range[0].format('YYYY-MM-DD') && p.paidAt <= range[1].format('YYYY-MM-DD') + ' 23:59');
  const total = inRange.reduce((s, p) => s + p.amount, 0);
  const byType = [
    { type: 'Gói thành viên', value: inRange.filter((p) => p.type === 'PLAN').reduce((s, p) => s + p.amount, 0) },
    { type: 'Học phí lớp', value: inRange.filter((p) => p.type === 'CLASS').reduce((s, p) => s + p.amount, 0) },
    { type: 'Thuê sân', value: inRange.filter((p) => p.type === 'COURT').reduce((s, p) => s + p.amount, 0) },
  ];
  const byMethod = (['CASH', 'BANK', 'VNPAY', 'MOMO'] as const).map((m) => ({ method: labelOf(m), value: inRange.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0), count: inRange.filter((p) => p.method === m).length }));

  const fmt = gran === 'day' ? 'DD/MM' : gran === 'month' ? 'MM/YYYY' : 'YYYY';
  const keyFmt = gran === 'day' ? 'YYYY-MM-DD' : gran === 'month' ? 'YYYY-MM' : 'YYYY';
  const buckets: string[] = [];
  for (let d = range[0].startOf(gran); d.isBefore(range[1]); d = d.add(1, gran)) buckets.push(d.format(keyFmt));
  const revenueSeries = buckets.slice(-24).flatMap((key) => {
    const pays = inRange.filter((p) => p.paidAt.startsWith(key));
    return [
      { period: dayjs(key).format(fmt), type: 'Gói thành viên', revenue: pays.filter((p) => p.type === 'PLAN').reduce((s, p) => s + p.amount, 0) },
      { period: dayjs(key).format(fmt), type: 'Học phí lớp', revenue: pays.filter((p) => p.type === 'CLASS').reduce((s, p) => s + p.amount, 0) },
      { period: dayjs(key).format(fmt), type: 'Thuê sân', revenue: pays.filter((p) => p.type === 'COURT').reduce((s, p) => s + p.amount, 0) },
    ];
  });

  const newMembers = Array.from({ length: 6 }).map((_, i) => {
    const m = dayjs().subtract(5 - i, 'month');
    return { month: m.format('MM/YYYY'), count: data.users.filter((u) => u.role === 'MEMBER' && u.createdAt.startsWith(m.format('YYYY-MM'))).length };
  });

  const classFill = data.classes.filter((c) => c.status === 'OPEN').map((c) => {
    const n = data.enrollments.filter((e) => e.classId === c.id && e.status === 'ACTIVE').length;
    const sessions = data.sessions.filter((s) => s.classId === c.id);
    const att = data.attendances.filter((a) => sessions.some((s) => s.id === a.sessionId));
    return { key: c.id, name: c.name, sport: data.sports.find((s) => s.id === c.sportId)?.name, coach: nameOf(c.coachId), n, capacity: c.capacity, rate: Math.round((n / c.capacity) * 100), sessions: sessions.length, attRate: att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0, revenue: data.payments.filter((p) => p.type === 'CLASS' && p.refName === c.name).reduce((s, p) => s + p.amount, 0) };
  });

  const coachPerf = data.users.filter((u) => u.role === 'COACH').map((u) => {
    const cls = data.classes.filter((c) => c.coachId === u.id && c.status === 'OPEN');
    const students = new Set(data.enrollments.filter((e) => cls.some((c) => c.id === e.classId) && e.status === 'ACTIVE').map((e) => e.memberId)).size;
    const sessions = data.sessions.filter((s) => cls.some((c) => c.id === s.classId));
    const att = data.attendances.filter((a) => sessions.some((s) => s.id === a.sessionId));
    const reviews = data.progressReviews.filter((r) => r.coachId === u.id);
    return { key: u.id, user: u, classes: cls.length, students, sessions: sessions.length, attRate: att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0, plans: data.trainingPlans.filter((p) => p.coachId === u.id).length, results: data.trainingResults.filter((r) => r.coachId === u.id).length, rating: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—', revenue: data.payments.filter((p) => p.type === 'CLASS' && cls.some((c) => c.name === p.refName)).reduce((s, p) => s + p.amount, 0) };
  });

  const roomUtil = data.rooms.filter((r) => r.type === 'ROOM').map((r) => {
    const scs = data.schedules.filter((s) => data.classes.some((c) => c.id === s.classId && c.roomId === r.id && c.status === 'OPEN'));
    const minutes = scs.reduce((s, sc) => s + dayjs(`2000-01-01 ${sc.endTime}`).diff(dayjs(`2000-01-01 ${sc.startTime}`), 'minute'), 0);
    const hoursPerWeek = minutes / 60;
    return { key: r.id, name: r.name, location: r.location, capacity: r.capacity, slots: scs.length, hours: Math.round(hoursPerWeek * 10) / 10, util: Math.min(100, Math.round((hoursPerWeek / (7 * 16)) * 100)), days: Array.from(new Set(scs.map((s) => s.dayOfWeek))).sort().map((d) => DAY_NAMES[d].replace('Thứ ', 'T')).join(' ') };
  });

  const rangeDays = Math.max(1, range[1].diff(range[0], 'day') + 1);
  const courtUtil = data.rooms.filter((r) => r.type === 'COURT').map((r) => {
    const bks = data.courtBookings.filter((b) => b.courtId === r.id && b.status !== 'CANCELLED' && b.date >= range[0].format('YYYY-MM-DD') && b.date <= range[1].format('YYYY-MM-DD'));
    const hours = bks.reduce((s, b) => s + (Number(b.endTime.slice(0, 2)) - Number(b.startTime.slice(0, 2))), 0);
    const cancelled = data.courtBookings.filter((b) => b.courtId === r.id && b.status === 'CANCELLED' && b.date >= range[0].format('YYYY-MM-DD') && b.date <= range[1].format('YYYY-MM-DD')).length;
    const peak = bks.reduce<Record<string, number>>((acc, b) => { acc[b.startTime] = (acc[b.startTime] ?? 0) + 1; return acc; }, {});
    const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { key: r.id, name: r.name, sportId: r.sportId, location: r.location, rate: r.hourlyRate ?? 0, bookings: bks.length, hours, cancelled, util: Math.min(100, Math.round(hours / (rangeDays * 16) * 100)), revenue: bks.reduce((s, b) => s + b.price, 0), peakHour: peakHour ?? '—', online: bks.filter((b) => b.createdBy === b.memberId).length };
  }).sort((a, b) => b.revenue - a.revenue);
  const sportRevenue = data.sports.map((sp) => {
    const cls = inRange.filter((p) => p.type === 'CLASS' && data.classes.some((c) => c.name === p.refName && c.sportId === sp.id)).reduce((s, p) => s + p.amount, 0);
    const court = courtUtil.filter((c) => c.sportId === sp.id).reduce((s, c) => s + c.revenue, 0);
    const planOnly = inRange.filter((p) => p.type === 'PLAN' && data.plans.some((pl) => pl.name === p.refName && pl.sportIds.length > 0 && pl.sportIds.includes(sp.id))).reduce((s, p) => s + p.amount, 0);
    return { key: sp.id, sport: sp, classes: data.classes.filter((c) => c.sportId === sp.id && c.status === 'OPEN').length, students: new Set(data.enrollments.filter((e) => e.status === 'ACTIVE' && data.classes.some((c) => c.id === e.classId && c.sportId === sp.id)).map((e) => e.memberId)).size, cls, court, planOnly, total: cls + court + planOnly };
  }).sort((a, b) => b.total - a.total);

  const topMembers = data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ key: u.id, user: u, total: inRange.filter((p) => p.memberId === u.id).reduce((s, p) => s + p.amount, 0), count: inRange.filter((p) => p.memberId === u.id).length })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  const exportPayments = () => {
    downloadCsv(`doanh-thu_${range[0].format('YYYYMMDD')}-${range[1].format('YYYYMMDD')}.csv`, inRange.map((p) => ({ 'Số HĐ': p.invoiceNo, 'Ngày': p.paidAt, 'Thành viên': nameOf(p.memberId), 'SĐT': userById(p.memberId)?.phone, 'Loại': labelOf(p.type), 'Nội dung': p.refName, 'Số tiền': p.amount, 'Phương thức': labelOf(p.method), 'Thu bởi': nameOf(p.createdBy) })));
    message.success(`Đã xuất ${inRange.length} giao dịch`);
  };

  return (
    <Page title="Báo cáo & thống kê" subtitle={`Kỳ báo cáo ${range[0].format('DD/MM/YYYY')} – ${range[1].format('DD/MM/YYYY')}`} extra={
      <Space>
        <DatePicker.RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} presets={[
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] },
          { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
          { label: '3 tháng', value: [dayjs().subtract(2, 'month').startOf('month'), dayjs()] },
          { label: '6 tháng', value: [dayjs().subtract(5, 'month').startOf('month'), dayjs()] },
        ]} />
        <Button icon={<DownloadOutlined />} onClick={exportPayments}>Xuất CSV</Button>
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Tổng doanh thu" value={fmtMoney(total)} icon={<DollarOutlined />} color="#0f4d34" hint={`${inRange.length} giao dịch`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Gói thành viên" value={fmtMoney(byType[0].value)} icon={<GiftOutlined />} color="#9333ea" hint={`${Math.round((byType[0].value / Math.max(1, total)) * 100)}% tổng doanh thu`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Học phí lớp" value={fmtMoney(byType[1].value)} icon={<ReadOutlined />} color="#c94a1e" hint={`${Math.round((byType[1].value / Math.max(1, total)) * 100)}% tổng doanh thu`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Thuê sân" value={fmtMoney(byType[2].value)} icon={<FieldTimeOutlined />} color="#06b6d4" hint={`${inRange.filter((p) => p.type === 'COURT').length} lượt · ${Math.round((byType[2].value / Math.max(1, total)) * 100)}% doanh thu`} /></Col>
      </Row>
      <Card>
        <Tabs items={[
          {
            key: 'rev', label: 'Doanh thu', children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <b>Doanh thu theo thời gian</b>
                    <Radio.Group size="small" value={gran} onChange={(e) => setGran(e.target.value)} options={[{ value: 'day', label: 'Ngày' }, { value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' }]} optionType="button" />
                  </div>
                  <Column data={revenueSeries} xField="period" yField="revenue" colorField="type" group height={300} style={{ radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 44 }} scale={{ color: { range: ['#0f4d34', '#c94a1e', '#06b6d4'] } }} axis={{ y: { labelFormatter: (v: number) => (v / 1e6).toFixed(1) + 'tr', grid: true, gridLineDash: [4, 4] } }} legend={{ color: { position: 'top' } }} tooltip={{ items: [{ channel: 'y', valueFormatter: (v: number) => fmtMoney(v) }] }} />
                </Col>
                <Col xs={24} xl={8}>
                  <b>Theo loại doanh thu</b>
                  <div style={{ margin: '12px 0 20px' }}>
                    <Donut size={120} thickness={18} items={byType.map((t, i) => ({ label: t.type, value: t.value, color: ['#0f4d34', '#c94a1e', '#06b6d4'][i] }))} format={(v) => fmtMoney(v)} center={<div style={{ fontSize: 11, color: '#9a968c' }}>Tổng<br /><b style={{ color: '#14130f', fontSize: 13 }}>{(total / 1e6).toFixed(1)}tr</b></div>} />
                  </div>
                  <b>Theo phương thức thanh toán</b>
                  <div style={{ marginTop: 12 }}>
                    <Donut size={120} thickness={18} items={byMethod.map((m, i) => ({ label: m.method, value: m.value, color: ['#7a776f', '#0f4d34', '#06b6d4', '#db2777'][i], hint: `${m.count} GD` }))} format={(v) => fmtMoney(v)} center={<div style={{ fontSize: 11, color: '#9a968c' }}>{inRange.length}<br />GD</div>} />
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: 'classes', label: 'Lớp học', children: (
              <Table size="middle" pagination={false} dataSource={classFill} columns={[
                { title: 'Lớp', dataIndex: 'name', render: (v, r) => <><b>{v}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{r.sport}</div></> },
                { title: 'HLV', dataIndex: 'coach' },
                { title: 'Sĩ số', render: (_, r) => `${r.n}/${r.capacity}` },
                { title: 'Lấp đầy', dataIndex: 'rate', width: 180, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 80 ? '#16a34a' : v >= 40 ? '#0f4d34' : '#f59e0b'} /> },
                { title: 'Buổi đã dạy', dataIndex: 'sessions', align: 'right' },
                { title: 'Chuyên cần', dataIndex: 'attRate', render: (v) => <Tag color={v >= 85 ? 'green' : v >= 70 ? 'blue' : 'orange'}>{v}%</Tag> },
                { title: 'Doanh thu', dataIndex: 'revenue', align: 'right', render: (v) => <b>{fmtMoney(v)}</b>, sorter: (a, b) => a.revenue - b.revenue },
              ]} />
            ),
          },
          {
            key: 'coaches', label: 'Huấn luyện viên', children: (
              <Table size="middle" pagination={false} dataSource={coachPerf} columns={[
                { title: 'Huấn luyện viên', render: (_, r) => <UserCell user={r.user} sub={(r.user.sportIds ?? []).map((id) => data.sports.find((s) => s.id === id)?.name).filter(Boolean).join(' · ')} /> },
                { title: 'Lớp', dataIndex: 'classes', align: 'center' },
                { title: 'Học viên', dataIndex: 'students', align: 'center' },
                { title: 'Buổi dạy', dataIndex: 'sessions', align: 'center' },
                { title: 'Chuyên cần lớp', dataIndex: 'attRate', render: (v) => <Progress percent={v} size="small" style={{ width: 120 }} /> },
                { title: 'Kế hoạch / KQ', render: (_, r) => `${r.plans} / ${r.results}` },
                { title: 'Đánh giá TB', dataIndex: 'rating', render: (v) => v === '—' ? v : <Tag color="gold">★ {v}</Tag> },
                { title: 'Doanh thu lớp', dataIndex: 'revenue', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> },
              ]} />
            ),
          },
          {
            key: 'sports', label: 'Bộ môn', children: (
              <Table size="middle" pagination={false} dataSource={sportRevenue} columns={[
                { title: 'Bộ môn', render: (_, r) => <SportTag id={r.sport.id} /> },
                { title: 'Lớp mở', dataIndex: 'classes', align: 'center' },
                { title: 'Học viên', dataIndex: 'students', align: 'center' },
                { title: 'Học phí lớp', dataIndex: 'cls', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
                { title: 'Thuê sân', dataIndex: 'court', align: 'right', render: (v) => <span className="sc-nowrap">{v ? fmtMoney(v) : '—'}</span> },
                { title: 'Gói theo môn', dataIndex: 'planOnly', align: 'right', render: (v) => <span className="sc-nowrap">{v ? fmtMoney(v) : '—'}</span> },
                { title: 'Tổng', dataIndex: 'total', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b>, sorter: (a, b) => a.total - b.total },
                { title: 'Tỷ trọng', dataIndex: 'total', width: 160, render: (v) => <Progress percent={Math.round(v / Math.max(1, sportRevenue.reduce((s, x) => s + x.total, 0)) * 100)} size="small" /> },
              ]} />
            ),
          },
          {
            key: 'courts', label: 'Sân', children: (
              <Table size="middle" pagination={false} dataSource={courtUtil} columns={[
                { title: 'Sân', render: (_, r) => <><b>{r.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}><SportTag id={r.sportId} size="small" /> · {r.location}</div></> },
                { title: 'Giá/giờ', dataIndex: 'rate', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
                { title: 'Lượt đặt', dataIndex: 'bookings', align: 'center', render: (v, r) => <span>{v} <span style={{ fontSize: 11, color: '#9a968c' }}>({r.online} online)</span></span> },
                { title: 'Giờ sử dụng', dataIndex: 'hours', align: 'center' },
                { title: 'Hủy', dataIndex: 'cancelled', align: 'center', render: (v) => v ? <Tag color="red" style={{ margin: 0 }}>{v}</Tag> : '0' },
                { title: 'Giờ cao điểm', dataIndex: 'peakHour', align: 'center' },
                { title: 'Công suất (6h–22h)', dataIndex: 'util', width: 200, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 40 ? '#16a34a' : v >= 20 ? '#0f4d34' : '#f59e0b'} /> },
                { title: 'Doanh thu', dataIndex: 'revenue', align: 'right', render: (v) => <b className="sc-nowrap">{fmtMoney(v)}</b>, sorter: (a, b) => a.revenue - b.revenue },
              ]} />
            ),
          },
          {
            key: 'rooms', label: 'Phòng tập', children: (
              <Table size="middle" pagination={false} dataSource={roomUtil} columns={[
                { title: 'Phòng', dataIndex: 'name', render: (v, r) => <><b>{v}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{r.location} · {r.capacity} chỗ</div></> },
                { title: 'Ca / tuần', dataIndex: 'slots', align: 'center' },
                { title: 'Giờ / tuần', dataIndex: 'hours', align: 'center' },
                { title: 'Ngày hoạt động', dataIndex: 'days' },
                { title: 'Công suất (5:30–21:30)', dataIndex: 'util', width: 240, render: (v) => <Progress percent={v} size="small" strokeColor={v >= 50 ? '#16a34a' : '#f59e0b'} /> },
              ]} />
            ),
          },
          { key: 'members', label: 'Thành viên', children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}><b>Thành viên mới theo tháng</b><Column data={newMembers} xField="month" yField="count" height={280} style={{ fill: '#16a34a', radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 44 }} /></Col>
              <Col xs={24} xl={12}><b>Top chi tiêu trong kỳ</b><Table size="small" pagination={false} dataSource={topMembers} style={{ marginTop: 8 }} columns={[{ title: '#', render: (_, __, i) => i + 1, width: 40 }, { title: 'Thành viên', render: (_, r) => <UserCell user={r.user} sub={r.user.phone} size={28} /> }, { title: 'Gói', render: (_, r) => <StatusTag value={(() => { const s = data.subscriptions.find((x) => x.memberId === r.user.id && x.status === 'ACTIVE'); return s ? 'ACTIVE' : 'EXPIRED'; })()} /> }, { title: 'GD', dataIndex: 'count', align: 'right' }, { title: 'Tổng', dataIndex: 'total', align: 'right', render: (v) => <b>{fmtMoney(v)}</b> }]} /></Col>
            </Row>
          ) },
        ]} />
      </Card>
    </Page>
  );
}
