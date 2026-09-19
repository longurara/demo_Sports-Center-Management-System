import { useState } from 'react';
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Space, Table, Tag, TimePicker, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import SportTag from '../../components/SportTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPhase, classSessions, enrolledCount, generateSessions, sessionsFacilityConflict } from '../../utils/classes';
import { bookableRooms, onGrid } from '../../utils/slots';

/** Lớp học (UC_2.12/2.15/2.18): tạo từ Course, sinh session từ lịch tuần, giữ slot từ DRAFT; duyệt mở lớp khi có HLV. */
export default function Classes() {
  const { data, add, update, log, notify, nameOf, cancelClass } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [form] = Form.useForm();
  const [warn, setWarn] = useState<string | null>(null);
  const courseId = Form.useWatch('courseId', form);
  const course = data.courses.find((c) => c.id === courseId);

  const rows = data.classes.filter((c) => !c.deletedAt).map((c) => ({ ...c, phase: classPhase(c) })).filter((c) => filter === 'ALL' ? true : filter === 'PENDING' ? c.phase === 'PENDING_APPROVAL' : filter === 'NEED_COACH' ? !c.coachId && c.status !== 'CANCELLED' : c.phase === filter)
    .sort((a, b) => (a.phase === 'PENDING_APPROVAL' ? -1 : 1) - (b.phase === 'PENDING_APPROVAL' ? -1 : 1) || b.startDate.localeCompare(a.startDate));

  const create = (v: Record<string, unknown>) => {
    const co = data.courses.find((c) => c.id === v.courseId)!;
    const sched = ((v.schedule as { dayOfWeek: number; time: [dayjs.Dayjs, dayjs.Dayjs] }[]) ?? []).map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.time[0].format('HH:mm'), endTime: s.time[1].format('HH:mm') }));
    if (!sched.length) { setWarn('Cần ít nhất một khung giờ trong tuần'); return; }
    if (sched.some((s) => !onGrid(data.settings, s.startTime, s.endTime))) { setWarn(`Giờ học phải khớp lưới slot ${data.settings.slotMinutes} phút trong ${data.settings.openTime}–${data.settings.closeTime}`); return; }
    if ((v.minStudents as number) > (v.capacity as number)) { setWarn('min_students phải ≤ max_students'); return; }
    const gen = generateSessions('tmp', sched, co.totalSessions, v.roomId as string, (v.startDate as dayjs.Dayjs).format('YYYY-MM-DD'));
    const cf = sessionsFacilityConflict(data, gen);
    if (cf) { setWarn(`Facility bận: ${cf}`); return; }
    const cls = add('classes', { courseId: co.id, name: v.name as string, sportId: co.sportId, roomId: v.roomId as string, minStudents: v.minStudents as number, capacity: v.capacity as number, minStudentsOverride: false, startDate: gen[0].date, endDate: gen[gen.length - 1].date, status: 'DRAFT' });
    sched.forEach((s) => add('schedules', { classId: cls.id, ...s }));
    gen.forEach((s) => add('sessions', { ...s, classId: cls.id }));
    log('CREATE_CLASS', 'Class', cls.id, `Tạo lớp ${cls.name} (DRAFT): ${gen.length} buổi ${gen[0].date} → ${gen[gen.length - 1].date}, giữ slot ${data.rooms.find((r) => r.id === v.roomId)?.name}`);
    message.success(`Đã tạo lớp DRAFT với ${gen.length} buổi — slot facility đã được giữ`); setWarn(null); setOpen(false);
    navigate(`/manager/classes/${cls.id}`);
  };

  const approve = (id: string) => {
    const c = data.classes.find((x) => x.id === id)!;
    if (!c.coachId) { message.error('Lớp chưa có HLV — chọn HLV trong chi tiết lớp trước'); return; }
    update('classes', id, { status: 'OPEN' });
    log('APPROVE_CLASS', 'Class', id, `Duyệt mở lớp ${c.name}, HLV ${nameOf(c.coachId)}`);
    notify(c.coachId, 'Lớp đã được duyệt mở', `Lớp ${c.name} đã OPEN, nhận đăng ký từ ${dayjs(c.startDate).format('DD/MM/YYYY')}.`);
    message.success('Lớp đã OPEN — member đăng ký được');
  };
  const reject = (id: string) => {
    const c = data.classes.find((x) => x.id === id)!;
    update('classes', id, { status: 'DRAFT' });
    if (c.coachId) notify(c.coachId, 'Lớp bị từ chối mở', `Lớp ${c.name} chưa được duyệt, Manager sẽ liên hệ.`);
    log('REJECT_CLASS', 'Class', id, `Từ chối mở lớp ${c.name} → DRAFT`);
  };

  return (
    <Page title="Lớp học" subtitle="Lớp = section của khóa học. Sinh buổi học từ lịch tuần, giữ slot facility từ DRAFT, cần HLV + duyệt để OPEN."
      extra={<Space wrap><Segmented value={filter} onChange={(v) => setFilter(v as string)} options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'PENDING', label: `Chờ duyệt (${data.classes.filter((c) => c.status === 'PENDING_APPROVAL').length})` }, { value: 'NEED_COACH', label: 'Cần HLV' }, { value: 'OPEN', label: 'Đang mở' }, { value: 'ONGOING', label: 'Đang học' }, { value: 'COMPLETED', label: 'Kết thúc' }, { value: 'CANCELLED', label: 'Đã hủy' }]} /><Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ minStudents: 4, capacity: 12, schedule: [{ dayOfWeek: 1 }], startDate: dayjs().add(7, 'day') }); setWarn(null); setOpen(true); }}>Tạo lớp học</Button></Space>}>
      <Table rowKey="id" dataSource={rows} pagination={{ pageSize: 10 }} columns={[
        { title: 'Tên lớp', dataIndex: 'name', render: (v, r) => <><a onClick={() => navigate(`/manager/classes/${r.id}`)}><b>{v}</b></a><div style={{ fontSize: 12, color: '#7a776f' }}>{data.courses.find((c) => c.id === r.courseId)?.name} · {fmtMoney(data.courses.find((c) => c.id === r.courseId)?.price ?? 0)}</div></> },
        { title: 'Bộ môn', render: (_, r) => <SportTag id={r.sportId} /> },
        { title: 'Facility', render: (_, r) => data.rooms.find((s) => s.id === r.roomId)?.name },
        { title: 'HLV', render: (_, r) => r.coachId ? nameOf(r.coachId) : <span style={{ color: '#fa8c16' }}>Chưa có · {data.coachRegistrations.filter((x) => x.classId === r.id && x.status === 'PENDING').length} đăng ký</span> },
        { title: 'Sĩ số', render: (_, r) => <span className="sc-nowrap">{enrolledCount(data, r.id)}/{r.capacity} <small style={{ color: '#9a968c' }}>(min {r.minStudents}{r.minStudentsOverride ? ', override' : ''})</small></span> },
        { title: 'Lịch', render: (_, r) => <Space wrap size={[4, 4]}>{data.schedules.filter((s) => s.classId === r.id).map((s) => <Tag key={s.id} style={{ margin: 0 }}>{DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T')} {s.startTime}</Tag>)}</Space> },
        { title: 'Thời gian', render: (_, r) => <span className="sc-nowrap">{dayjs(r.startDate).format('DD/MM')} → {dayjs(r.endDate).format('DD/MM/YY')} · {classSessions(data, r.id).length} buổi</span> },
        { title: 'Trạng thái', dataIndex: 'phase', render: (v) => <StatusTag value={v} /> },
        { title: '', render: (_, r) => (
          <Space>
            {r.status === 'PENDING_APPROVAL' && <><Button size="small" type="primary" onClick={() => approve(r.id)}>Duyệt mở</Button><Popconfirm title="Từ chối → về DRAFT?" onConfirm={() => reject(r.id)}><Button size="small">Từ chối</Button></Popconfirm></>}
            {(r.status === 'DRAFT' || r.status === 'OPEN' || r.status === 'PENDING_APPROVAL') && r.phase !== 'COMPLETED' && (
              <Popconfirm title="Hủy lớp? Học viên được hoàn theo BR_2.7b và nhận thông báo." onConfirm={() => { const res = cancelClass(r.id, 'Manager hủy lớp'); message.success(`Đã hủy lớp, hoàn ${fmtMoney(res.refunded)} cho ${res.members} HV`); }}><Button size="small" danger>Hủy</Button></Popconfirm>
            )}
          </Space>
        ) },
      ]} />
      <Modal title="Tạo lớp học (chia lớp cho khóa)" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Tạo lớp DRAFT" width={720}>
        {warn && <Alert type="error" showIcon title={warn} style={{ marginBottom: 12 }} />}
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="courseId" label="Khóa học" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={data.courses.filter((c) => c.active && !c.deletedAt).map((c) => ({ value: c.id, label: `${c.name} · ${data.sports.find((s) => s.id === c.sportId)?.name} · ${c.totalSessions} buổi · ${fmtMoney(c.price)}` }))} onChange={() => form.setFieldsValue({ roomId: undefined })} /></Form.Item>
          <Form.Item name="name" label="Tên lớp" rules={[{ required: true }]}><Input placeholder={course ? `${course.name} K…` : 'VD: Boxing cơ bản K3'} /></Form.Item>
          <Form.Item name="roomId" label="Facility mặc định" rules={[{ required: true }]}>
            <Select disabled={!course} placeholder={course ? 'Chọn facility hỗ trợ bộ môn' : 'Chọn khóa học trước'} options={bookableRooms(data).filter((r) => course && r.sportIds.includes(course.sportId)).map((r) => ({ value: r.id, label: `${r.name} · ${r.location} (${r.capacity} chỗ/slot)` }))} />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" minDate={dayjs()} /></Form.Item>
            <Form.Item name="minStudents" label="Sĩ số tối thiểu" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="capacity" label="Sĩ số tối đa" rules={[{ required: true }]}><InputNumber min={1} style={{ width: 120 }} /></Form.Item>
          </Space>
          <Form.List name="schedule">
            {(fields, { add: addRow, remove: removeRow }) => (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Lịch tuần (day_of_week + giờ bắt đầu/kết thúc, khớp lưới slot {data.settings.slotMinutes}')</div>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline">
                    <Form.Item name={[f.name, 'dayOfWeek']} rules={[{ required: true }]}><Select style={{ width: 130 }} options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: DAY_NAMES[d] }))} /></Form.Item>
                    <Form.Item name={[f.name, 'time']} rules={[{ required: true, message: 'Chọn giờ' }]}><TimePicker.RangePicker format="HH:mm" minuteStep={data.settings.slotMinutes as 30} /></Form.Item>
                    <MinusCircleOutlined onClick={() => removeRow(f.name)} />
                  </Space>
                ))}
                <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addRow({ dayOfWeek: 1 })}>Thêm khung giờ</Button>
              </div>
            )}
          </Form.List>
          <div style={{ fontSize: 12, color: '#9a968c', marginTop: 12 }}>Hệ thống sinh đủ <b>{course?.totalSessions ?? '…'}</b> buổi theo thứ tự ngày từ ngày bắt đầu, kiểm tra facility trống cho từng buổi và giữ slot ngay khi lớp ở DRAFT (BR_2.3). HLV đăng ký / được phân công sau.</div>
        </Form>
      </Modal>
    </Page>
  );
}
