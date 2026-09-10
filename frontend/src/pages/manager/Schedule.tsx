import { useState } from 'react';
import { Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import WeekTimetable from '../../components/WeekTimetable';
import { useApp } from '../../store/AppContext';

export default function ManagerSchedule() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [room, setRoom] = useState<string | undefined>();
  const [coach, setCoach] = useState<string | undefined>();

  const openIds = data.classes.filter((c) => c.status === 'OPEN' && (!room || c.roomId === room) && (!coach || c.coachId === coach)).map((c) => c.id);
  const schedules = data.schedules.filter((s) => openIds.includes(s.classId));

  return (
    <Page title="Lịch hoạt động trung tâm" subtitle="Thời khóa biểu tuần của tất cả lớp đang mở" extra={
      <Space>
        <Select placeholder="Lọc theo phòng" allowClear style={{ width: 160 }} onChange={setRoom} options={data.rooms.map((r) => ({ value: r.id, label: r.name }))} />
        <Select placeholder="Lọc theo HLV" allowClear style={{ width: 180 }} onChange={setCoach} options={data.users.filter((u) => u.role === 'COACH').map((u) => ({ value: u.id, label: u.fullName }))} />
      </Space>
    }>
      <WeekTimetable schedules={schedules} onClick={(id) => navigate(`/manager/classes/${id}`)} />
    </Page>
  );
}
