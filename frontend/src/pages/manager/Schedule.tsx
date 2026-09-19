import { useState } from 'react';
import { Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import WeekTimetable from '../../components/WeekTimetable';
import { useApp } from '../../store/AppContext';

/** Lịch hoạt động: buổi học thật (class_sessions) của các lớp không hủy, lọc theo facility / HLV. */
export default function ManagerSchedule() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [room, setRoom] = useState<string | undefined>();
  const [coach, setCoach] = useState<string | undefined>();

  const classIds = data.classes.filter((c) => c.status !== 'CANCELLED' && (!coach || c.coachId === coach)).map((c) => c.id);
  const sessions = data.sessions.filter((s) => classIds.includes(s.classId) && (!room || s.roomId === room));

  return (
    <Page title="Lịch hoạt động trung tâm" subtitle="Thời khóa biểu tuần từ buổi học đã sinh (kể cả DRAFT đang giữ slot); buổi dời/đổi phòng hiển thị theo lịch thật" extra={
      <Space>
        <Select placeholder="Lọc theo facility" allowClear style={{ width: 180 }} onChange={setRoom} options={data.rooms.filter((r) => !r.deletedAt).map((r) => ({ value: r.id, label: r.name }))} />
        <Select placeholder="Lọc theo HLV" allowClear style={{ width: 180 }} onChange={setCoach} options={data.users.filter((u) => u.role === 'COACH').map((u) => ({ value: u.id, label: u.fullName }))} />
      </Space>
    }>
      <WeekTimetable sessions={sessions} showCoach onClick={(id) => navigate(`/manager/classes/${id}`)} />
    </Page>
  );
}
