import { useMemo, useState } from 'react';
import { Alert, Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Steps, Table, Tag, TimePicker, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';
import { bookableRooms, overlap, sessionAt, bookingsAt, maintenanceAt } from '../../utils/slots';
import type { Booking, Session } from '../../types';

type Plan = { action: 'ROOM'; roomId: string } | { action: 'MOVE'; date: string; startTime: string; endTime: string } | { action: 'CANCEL' };

/** Lịch bảo trì facility (UC_2.4/2.5, BR_2.19): preview ảnh hưởng → phương án cho từng buổi → commit atomic. */
export default function Maintenance() {
  const { data, add, update, log, notify, nameOf, cancelBooking, cancelSession, recomputeClass } = useApp();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [draft, setDraft] = useState<{ roomId: string; from: string; to: string; reason: string } | null>(null);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  const rows = data.maintenances.filter((m) => !m.deletedAt).sort((a, b) => b.from.localeCompare(a.from));
  const phase = (m: { from: string; to: string }) => (m.to < now ? 'DONE' : m.from <= now ? 'RUNNING' : 'PLANNED');

  // Ảnh hưởng của bản nháp
  const affected = useMemo(() => {
    if (!draft) return { bookings: [] as Booking[], sessions: [] as Session[] };
    const hit = (date: string, s: string, e: string) => draft.from < `${date} ${e}` && `${date} ${s}` < draft.to;
    return {
      bookings: data.bookings.filter((b) => b.roomId === draft.roomId && b.status === 'CONFIRMED' && hit(b.date, b.startTime, b.endTime)),
      sessions: data.sessions.filter((s) => s.roomId === draft.roomId && s.status === 'SCHEDULED' && hit(s.date, s.startTime, s.endTime) && data.classes.find((c) => c.id === s.classId)?.status !== 'CANCELLED'),
    };
  }, [draft, data]);

  const preview = (v: Record<string, unknown>) => {
    const [f, t] = v.range as [dayjs.Dayjs, dayjs.Dayjs];
    const from = `${f.format('YYYY-MM-DD')} ${(v.fromTime as dayjs.Dayjs).format('HH:mm')}`, to = `${t.format('YYYY-MM-DD')} ${(v.toTime as dayjs.Dayjs).format('HH:mm')}`;
    if (from >= to) { message.error('Thời điểm kết thúc phải sau bắt đầu'); return; }
    if (data.maintenances.some((m) => !m.deletedAt && m.roomId === v.roomId && m.from < to && from < m.to && m.to >= now)) { message.error('Facility đã có lịch bảo trì chồng lấn'); return; }
    setDraft({ roomId: v.roomId as string, from, to, reason: v.reason as string }); setPlans({}); setStep(1);
  };

  /** Kiểm tra phương án một buổi có khả thi không */
  const planError = (s: Session, p?: Plan): string | null => {
    if (!p) return 'Chưa chọn phương án';
    const cls = data.classes.find((c) => c.id === s.classId)!;
    if (p.action === 'ROOM') {
      const r = data.rooms.find((x) => x.id === p.roomId);
      if (!r || !r.isActive || r.deletedAt || !r.sportIds.includes(cls.sportId)) return 'Facility không hỗ trợ bộ môn';
      if (sessionAt(data, p.roomId, s.date, s.startTime, s.endTime, s.id)) return 'Facility có buổi khác';
      if (bookingsAt(data, p.roomId, s.date, s.startTime, s.endTime).length) return 'Facility có booking lẻ';
      if (maintenanceAt(data, p.roomId, s.date, s.startTime, s.endTime)) return 'Facility đang bảo trì';
      return null;
    }
    if (p.action === 'MOVE') {
      if (`${p.date} ${p.startTime}` < now) return 'Thời điểm mới đã qua';
      if (draft && draft.from < `${p.date} ${p.endTime}` && `${p.date} ${p.startTime}` < draft.to) return 'Vẫn nằm trong khoảng bảo trì';
      if (sessionAt(data, s.roomId, p.date, p.startTime, p.endTime, s.id)) return 'Trùng buổi khác';
      if (bookingsAt(data, s.roomId, p.date, p.startTime, p.endTime).length) return 'Có booking lẻ';
      if (cls.coachId && data.sessions.some((x) => x.id !== s.id && x.status === 'SCHEDULED' && x.date === p.date && overlap(p.startTime, p.endTime, x.startTime, x.endTime) && data.classes.find((c) => c.id === x.classId)?.coachId === cls.coachId)) return 'HLV trùng giờ';
      return null;
    }
    return null;
  };
  const allOk = affected.sessions.every((s) => !planError(s, plans[s.id]));

  const commit = () => {
    if (!draft || !allOk) return;
    const m = add('maintenances', { ...draft, createdBy: 'u1', createdAt: now });
    let refunded = 0;
    for (const b of affected.bookings) refunded += cancelBooking(b.id, 'SYSTEM', `bảo trì ${data.rooms.find((r) => r.id === draft.roomId)?.name}`).refunded;
    for (const s of affected.sessions) {
      const p = plans[s.id]; const cls = data.classes.find((c) => c.id === s.classId)!;
      const students = data.enrollments.filter((e) => e.classId === cls.id && e.status === 'ENROLLED').map((e) => e.memberId);
      if (p.action === 'ROOM') { update('sessions', s.id, { roomId: p.roomId, note: `Đổi sang ${data.rooms.find((r) => r.id === p.roomId)?.name} do bảo trì` }); [...students, cls.coachId].filter(Boolean).forEach((uid) => notify(uid!, 'Buổi học đổi phòng', `${cls.name} — ${dayjs(s.date).format('DD/MM')} ${s.startTime} chuyển sang ${data.rooms.find((r) => r.id === p.roomId)?.name} (bảo trì).`)); }
      else if (p.action === 'MOVE') { update('sessions', s.id, { date: p.date, startTime: p.startTime, endTime: p.endTime, note: `Dời từ ${dayjs(s.date).format('DD/MM')} ${s.startTime} do bảo trì` }); [...students, cls.coachId].filter(Boolean).forEach((uid) => notify(uid!, 'Buổi học dời lịch', `${cls.name} — ${dayjs(s.date).format('DD/MM')} ${s.startTime} dời sang ${dayjs(p.date).format('DD/MM')} ${p.startTime}–${p.endTime} (bảo trì).`)); recomputeClass(cls.id); }
      else refunded += cancelSession(s.id, `bảo trì ${data.rooms.find((r) => r.id === draft.roomId)?.name}`).refunded;
    }
    log('CREATE_MAINTENANCE', 'FacilityMaintenance', m.id, `Bảo trì ${data.rooms.find((r) => r.id === draft.roomId)?.name} ${draft.from} → ${draft.to}: hủy ${affected.bookings.length} booking, xử lý ${affected.sessions.length} buổi, hoàn ${fmtMoney(refunded)}`);
    message.success(`Đã ghi nhận bảo trì · hủy ${affected.bookings.length} booking · ${affected.sessions.length} buổi đã xử lý`);
    setOpen(false); setStep(0); setDraft(null); form.resetFields();
  };

  return (
    <Page title="Lịch bảo trì facility" subtitle="Trong khoảng bảo trì facility không nhận booking; booking bị ảnh hưởng hủy + hoàn 100% (guest không hoàn), buổi học phải đổi phòng / dời / hủy" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setStep(0); setDraft(null); setOpen(true); }}>Đặt lịch bảo trì</Button>}>
      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: 'Facility', render: (_, m) => <b>{data.rooms.find((r) => r.id === m.roomId)?.name}</b> },
        { title: 'Từ', dataIndex: 'from', render: (v) => <span className="sc-nowrap">{dayjs(v).format('HH:mm DD/MM/YYYY')}</span> },
        { title: 'Đến', dataIndex: 'to', render: (v) => <span className="sc-nowrap">{dayjs(v).format('HH:mm DD/MM/YYYY')}</span> },
        { title: 'Lý do', dataIndex: 'reason' },
        { title: 'Trạng thái', render: (_, m) => { const p = phase(m); return <Tag color={p === 'RUNNING' ? 'orange' : p === 'PLANNED' ? 'blue' : 'default'}>{p === 'RUNNING' ? 'Đang bảo trì' : p === 'PLANNED' ? 'Đã lên lịch' : 'Đã xong'}</Tag>; } },
        { title: 'Người đặt', render: (_, m) => nameOf(m.createdBy) },
        { title: '', render: (_, m) => phase(m) === 'PLANNED' ? <Popconfirm title="Hủy lịch bảo trì này?" onConfirm={() => { update('maintenances', m.id, { deletedAt: now }); log('DELETE_MAINTENANCE', 'FacilityMaintenance', m.id, `Hủy lịch bảo trì ${data.rooms.find((r) => r.id === m.roomId)?.name}`); }}><Button size="small" danger>Hủy lịch</Button></Popconfirm> : <span style={{ fontSize: 12, color: '#9a968c' }}>Không sửa/xóa</span> },
      ]} />

      <Modal title="Đặt lịch bảo trì" open={open} onCancel={() => setOpen(false)} width={860} footer={step === 0
        ? [<Button key="c" onClick={() => setOpen(false)}>Đóng</Button>, <Button key="n" type="primary" onClick={() => form.submit()}>Xem ảnh hưởng</Button>]
        : [<Button key="b" onClick={() => setStep(0)}>Quay lại</Button>, <Button key="ok" type="primary" disabled={!allOk} onClick={commit}>Xác nhận bảo trì</Button>]}>
        <Steps current={step} size="small" items={[{ title: 'Thời gian & lý do' }, { title: 'Preview ảnh hưởng & phương án' }]} style={{ marginBottom: 20 }} />
        {step === 0 && (
          <Form form={form} layout="vertical" onFinish={preview} initialValues={{ fromTime: dayjs('06:00', 'HH:mm'), toTime: dayjs('22:00', 'HH:mm') }}>
            <Form.Item name="roomId" label="Facility" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={bookableRooms(data).map((r) => ({ value: r.id, label: `${r.name} · ${r.location}` }))} /></Form.Item>
            <Space size={12} wrap>
              <Form.Item name="range" label="Ngày" rules={[{ required: true }]}><DatePicker.RangePicker format="DD/MM/YYYY" /></Form.Item>
              <Form.Item name="fromTime" label="Giờ bắt đầu"><TimePicker format="HH:mm" minuteStep={30} /></Form.Item>
              <Form.Item name="toTime" label="Giờ kết thúc"><TimePicker format="HH:mm" minuteStep={30} /></Form.Item>
            </Space>
            <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input placeholder="VD: thay mặt sân, sửa điều hòa" /></Form.Item>
          </Form>
        )}
        {step === 1 && draft && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Alert type="info" showIcon title={`${data.rooms.find((r) => r.id === draft.roomId)?.name} · ${dayjs(draft.from).format('HH:mm DD/MM')} → ${dayjs(draft.to).format('HH:mm DD/MM')} · ${draft.reason}`} />
            <Card size="small" title={`Booking bị hủy (${affected.bookings.length}) — member hoàn 100% về ví, guest không hoàn`}>
              <Table size="small" rowKey="id" pagination={false} dataSource={affected.bookings} locale={{ emptyText: 'Không có booking nào' }} columns={[
                { title: 'Khách', render: (_, b) => b.memberId ? nameOf(b.memberId) : <span><Tag>Guest</Tag>{b.guestName}</span> },
                { title: 'Thời gian', render: (_, b) => <span className="sc-nowrap">{dayjs(b.date).format('DD/MM')} {b.startTime}–{b.endTime}</span> },
                { title: 'Gói', render: (_, b) => b.packageId ? <Tag>Định kỳ</Tag> : '—' },
                { title: 'Hoàn', align: 'right', render: (_, b) => <b className="sc-nowrap">{b.memberId ? fmtMoney(b.price - b.refundedAmount) : '0 ₫'}</b> },
              ]} />
            </Card>
            <Card size="small" title={`Buổi học cần xử lý (${affected.sessions.length}) — chọn phương án cho từng buổi`}>
              <Table size="small" rowKey="id" pagination={false} dataSource={affected.sessions} locale={{ emptyText: 'Không có buổi học nào' }} columns={[
                { title: 'Lớp', render: (_, s) => { const c = data.classes.find((x) => x.id === s.classId)!; return <><b>{c.name}</b><div style={{ fontSize: 12, color: '#7a776f' }}>{dayjs(s.date).format('DD/MM')} {s.startTime}–{s.endTime} · HLV {nameOf(c.coachId)} · <StatusTag value={c.status} /></div></>; } },
                { title: 'Phương án', width: 420, render: (_, s) => {
                  const p = plans[s.id]; const cls = data.classes.find((x) => x.id === s.classId)!;
                  const rooms = bookableRooms(data).filter((r) => r.id !== draft.roomId && r.sportIds.includes(cls.sportId));
                  return (
                    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                      <Select size="small" style={{ width: 200 }} placeholder="Chọn phương án" value={p?.action} onChange={(a: Plan['action']) => setPlans({ ...plans, [s.id]: a === 'ROOM' ? { action: 'ROOM', roomId: rooms[0]?.id ?? '' } : a === 'MOVE' ? { action: 'MOVE', date: s.date, startTime: s.startTime, endTime: s.endTime } : { action: 'CANCEL' } })}
                        options={[{ value: 'ROOM', label: 'Đổi facility' }, { value: 'MOVE', label: 'Dời ngày giờ' }, { value: 'CANCEL', label: 'Hủy buổi (hoàn allocation)' }]} />
                      {p?.action === 'ROOM' && <Select size="small" style={{ width: 260 }} value={p.roomId} onChange={(roomId) => setPlans({ ...plans, [s.id]: { action: 'ROOM', roomId } })} options={rooms.map((r) => ({ value: r.id, label: `${r.name} · ${r.location}` }))} />}
                      {p?.action === 'MOVE' && <Space size={6}><DatePicker size="small" value={dayjs(p.date)} format="DD/MM" onChange={(d) => d && setPlans({ ...plans, [s.id]: { ...p, date: d.format('YYYY-MM-DD') } })} /><TimePicker.RangePicker size="small" format="HH:mm" minuteStep={data.settings.slotMinutes as 30} value={[dayjs(p.startTime, 'HH:mm'), dayjs(p.endTime, 'HH:mm')]} onChange={(v) => v && v[0] && v[1] && setPlans({ ...plans, [s.id]: { ...p, startTime: v[0].format('HH:mm'), endTime: v[1].format('HH:mm') } })} /></Space>}
                      {(() => { const e = planError(s, p); return e ? <span style={{ fontSize: 12, color: '#dc2626' }}>{e}</span> : <span style={{ fontSize: 12, color: '#16a34a' }}>Khả thi — sẽ thông báo HLV & học viên</span>; })()}
                    </Space>
                  );
                } },
              ]} />
            </Card>
            <div style={{ fontSize: 12, color: '#9a968c' }}>Khi xác nhận, hệ thống lock facility, kiểm tra lại, rồi ghi maintenance + hủy/hoàn/dời trong một transaction; email gửi sau commit (BR_2.19).</div>
          </Space>
        )}
      </Modal>
    </Page>
  );
}
