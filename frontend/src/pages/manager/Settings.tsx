import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, InputNumber, List, Row, Select, TimePicker, message } from 'antd';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { useApp } from '../../store/AppContext';
import { onGrid, slotsOf } from '../../utils/slots';
import type { SystemSettings } from '../../types';

/** System Settings (UC_2.3). Đổi lưới slot / giờ hoạt động chỉ khi không còn lịch tương lai bị lệch (BR_2.21). */
export default function Settings() {
  const { data, updateSettings, log } = useApp();
  const [form] = Form.useForm();
  const [blocked, setBlocked] = useState<string[]>([]);
  const s = data.settings;
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  const save = (v: Record<string, unknown>) => {
    const next: SystemSettings = { ...s, openTime: (v.open as dayjs.Dayjs).format('HH:mm'), closeTime: (v.close as dayjs.Dayjs).format('HH:mm'), slotMinutes: v.slotMinutes as number, maxAdvanceBookingDays: v.maxAdvanceBookingDays as number, bookingCancelDeadlineHours: v.bookingCancelDeadlineHours as number, courseCancelDeadlineDays: v.courseCancelDeadlineDays as number, timezone: v.timezone as string };
    if (next.openTime >= next.closeTime) { message.error('Giờ mở phải trước giờ đóng (không hỗ trợ ca qua đêm)'); return; }
    // BR_2.21: liệt kê booking / session tương lai không khớp lưới mới
    const bad: string[] = [];
    for (const b of data.bookings.filter((x) => x.status === 'CONFIRMED' && `${x.date} ${x.startTime}` >= now)) if (!onGrid(next, b.startTime, b.endTime)) bad.push(`Booking ${data.rooms.find((r) => r.id === b.roomId)?.name} ${dayjs(b.date).format('DD/MM')} ${b.startTime}–${b.endTime}`);
    for (const ss of data.sessions.filter((x) => x.status === 'SCHEDULED' && `${x.date} ${x.startTime}` >= now && data.classes.find((c) => c.id === x.classId)?.status !== 'CANCELLED')) if (!onGrid(next, ss.startTime, ss.endTime)) bad.push(`Buổi ${data.classes.find((c) => c.id === ss.classId)?.name} ${dayjs(ss.date).format('DD/MM')} ${ss.startTime}–${ss.endTime}`);
    if (bad.length) { setBlocked(bad); message.error(`Từ chối: ${bad.length} lịch tương lai lệch lưới mới`); return; }
    setBlocked([]);
    updateSettings(next);
    log('UPDATE_SETTINGS', 'SystemSettings', '1', `Giờ ${next.openTime}–${next.closeTime}, slot ${next.slotMinutes}', đặt trước ${next.maxAdvanceBookingDays} ngày, hủy booking ${next.bookingCancelDeadlineHours}h, hủy khóa ${next.courseCancelDeadlineDays} ngày`);
    message.success('Đã lưu cấu hình');
  };

  return (
    <Page title="Cấu hình hệ thống" subtitle="Giờ hoạt động, thời lượng slot, giới hạn đặt trước, deadline hủy — áp dụng toàn trung tâm (system_settings id = 1)" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Thiết lập">
            <Form form={form} layout="vertical" onFinish={save} initialValues={{ open: dayjs(s.openTime, 'HH:mm'), close: dayjs(s.closeTime, 'HH:mm'), slotMinutes: s.slotMinutes, maxAdvanceBookingDays: s.maxAdvanceBookingDays, bookingCancelDeadlineHours: s.bookingCancelDeadlineHours, courseCancelDeadlineDays: s.courseCancelDeadlineDays, timezone: s.timezone }}>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="open" label="Giờ mở cửa" rules={[{ required: true }]}><TimePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="close" label="Giờ đóng cửa" rules={[{ required: true }]}><TimePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="slotMinutes" label="Thời lượng slot" rules={[{ required: true }]}><Select options={[30, 45, 60, 90, 120].map((m) => ({ value: m, label: `${m} phút` }))} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="maxAdvanceBookingDays" label="Đặt trước tối đa (ngày)" extra="BR_2.4 — chỉ booking lẻ" rules={[{ required: true }]}><InputNumber min={0} max={90} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="bookingCancelDeadlineHours" label="Deadline hủy booking (giờ)" extra="BR_2.6 — hoàn 100% nếu hủy trước" rules={[{ required: true }]}><InputNumber min={0} max={72} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="courseCancelDeadlineDays" label="Deadline hủy khóa (ngày)" extra="BR_2.7 — trước buổi đầu" rules={[{ required: true }]}><InputNumber min={0} max={30} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <Form.Item name="timezone" label="Múi giờ"><Select options={['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore'].map((t) => ({ value: t, label: t }))} /></Form.Item>
              {blocked.length > 0 && <Alert type="error" showIcon style={{ marginBottom: 12 }} title={`Không thể đổi lưới: ${blocked.length} lịch tương lai bị lệch (BR_2.21)`} description={<List size="small" dataSource={blocked.slice(0, 8)} renderItem={(x) => <List.Item style={{ padding: '2px 0' }}>{x}</List.Item>} footer={blocked.length > 8 ? `… và ${blocked.length - 8} lịch khác` : undefined} />} />}
              <Button type="primary" htmlType="submit">Lưu cấu hình</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Lưới slot hiện tại">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Giờ hoạt động">{s.openTime} – {s.closeTime}</Descriptions.Item>
              <Descriptions.Item label="Số slot / ngày">{slotsOf(s).length} slot × {s.slotMinutes} phút</Descriptions.Item>
              <Descriptions.Item label="Booking tương lai">{data.bookings.filter((b) => b.status === 'CONFIRMED' && `${b.date} ${b.startTime}` >= now).length}</Descriptions.Item>
              <Descriptions.Item label="Buổi học tương lai">{data.sessions.filter((x) => x.status === 'SCHEDULED' && `${x.date} ${x.startTime}` >= now).length}</Descriptions.Item>
            </Descriptions>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
              {slotsOf(s).map((sl) => <span key={sl.start} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 999, background: '#f3f1ec', fontFamily: 'ui-monospace, monospace' }}>{sl.start}</span>)}
            </div>
            <div style={{ fontSize: 12, color: '#9a968c', marginTop: 12 }}>Booking và buổi học phải bắt đầu tại mốc slot và dài bội số slot. Đổi lưới sẽ bị từ chối nếu còn lịch tương lai lệch.</div>
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
