import { useState } from 'react';
import { Button, Card, Col, DatePicker, Radio, Row, Select, Space, Table, Tag, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';
import type { Attendance as Att } from '../../types';

type St = Att['status'];

export default function Attendance() {
  const { data, currentUser, add, update, nameOf, log } = useApp();
  const [params] = useSearchParams();
  const myClasses = data.classes.filter((c) => c.coachId === currentUser!.id && c.status === 'OPEN');
  const [classId, setClassId] = useState<string | undefined>(params.get('class') ?? myClasses[0]?.id);
  const [date, setDate] = useState(dayjs());
  const [draft, setDraft] = useState<Record<string, St>>({});

  const students = data.enrollments.filter((e) => e.classId === classId && e.status === 'ACTIVE');
  const session = data.sessions.find((s) => s.classId === classId && s.date === date.format('YYYY-MM-DD'));
  const existing = (mid: string) => data.attendances.find((a) => a.sessionId === session?.id && a.memberId === mid)?.status;
  const value = (mid: string) => draft[mid] ?? existing(mid) ?? 'PRESENT';

  const save = () => {
    if (!classId) return;
    const sess = session ?? add('sessions', { classId, date: date.format('YYYY-MM-DD') });
    students.forEach((e) => {
      const st = value(e.memberId);
      const ex = data.attendances.find((a) => a.sessionId === sess.id && a.memberId === e.memberId);
      if (ex) update('attendances', ex.id, { status: st }); else add('attendances', { sessionId: sess.id, memberId: e.memberId, status: st });
    });
    log('ATTENDANCE', 'Session', sess.id, `Điểm danh lớp ${myClasses.find((c) => c.id === classId)?.name} ngày ${date.format('DD/MM')}`);
    message.success('Đã lưu điểm danh'); setDraft({});
  };

  const history = data.sessions.filter((s) => s.classId === classId).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Page title="Điểm danh học viên" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<Space><Select value={classId} style={{ width: 220 }} onChange={(v) => { setClassId(v); setDraft({}); }} options={myClasses.map((c) => ({ value: c.id, label: c.name }))} /><DatePicker value={date} onChange={(d) => { setDate(d!); setDraft({}); }} format="DD/MM/YYYY" /></Space>}
            extra={session ? <Tag color="blue">Đã điểm danh buổi này</Tag> : <Tag>Buổi mới</Tag>}>
            <Table rowKey="id" pagination={false} dataSource={students} columns={[
              { title: 'Học viên', render: (_, r) => nameOf(r.memberId) },
              { title: 'Trạng thái', render: (_, r) => (
                <Radio.Group value={value(r.memberId)} onChange={(e) => setDraft({ ...draft, [r.memberId]: e.target.value })} optionType="button" buttonStyle="solid" size="small"
                  options={[{ value: 'PRESENT', label: 'Có mặt' }, { value: 'LATE', label: 'Muộn' }, { value: 'ABSENT', label: 'Vắng' }]} />
              ) },
            ]} />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button onClick={() => setDraft(Object.fromEntries(students.map((s) => [s.memberId, 'PRESENT' as St])))}>Tất cả có mặt</Button>
                <Button type="primary" onClick={save} disabled={!students.length}>Lưu điểm danh</Button>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Các buổi đã điểm danh">
            <Table size="small" rowKey="id" pagination={false} dataSource={history} onRow={(r) => ({ onClick: () => setDate(dayjs(r.date)), style: { cursor: 'pointer' } })} columns={[
              { title: 'Ngày', dataIndex: 'date' },
              { title: 'Có mặt', render: (_, r) => { const a = data.attendances.filter((x) => x.sessionId === r.id); return <Space size={4}><StatusTag value="PRESENT" />{a.filter((x) => x.status !== 'ABSENT').length}/{a.length}</Space>; } },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
