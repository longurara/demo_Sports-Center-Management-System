import { useState } from 'react';
import { Alert, Button, Card, Col, Radio, Row, Select, Space, Table, Tag, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, useApp } from '../../store/AppContext';
import { classPhase } from '../../utils/classes';
import type { Attendance as Att } from '../../types';

type St = Att['status'];

/** Điểm danh theo buổi (UC_4.2, BR_4.2/4.3): chọn lớp → chọn session không hủy → PRESENT/LATE/ABSENT, sửa được sau; Manager thao tác mọi lớp. */
export default function Attendance({ manager }: { manager?: boolean }) {
  const { data, currentUser, add, update, nameOf, log } = useApp();
  const [params] = useSearchParams();
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const myClasses = data.classes.filter((c) => (manager || c.coachId === currentUser!.id) && c.status === 'OPEN' && classPhase(c) !== 'OPEN').sort((a, b) => a.name.localeCompare(b.name));
  const [classId, setClassId] = useState<string | undefined>(params.get('class') ?? myClasses[0]?.id);
  const sessions = data.sessions.filter((s) => s.classId === classId && s.status === 'SCHEDULED').sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const defaultSession = [...sessions].reverse().find((s) => `${s.date} ${s.startTime}` <= now) ?? sessions[0];
  const [sessionId, setSessionId] = useState<string | undefined>(defaultSession?.id);
  const session = sessions.find((s) => s.id === sessionId) ?? defaultSession;
  const [draft, setDraft] = useState<Record<string, St>>({});

  // Học viên thuộc buổi: enrollment ENROLLED, đăng ký trước ngày buổi học (tư cách tại thời điểm buổi học)
  const students = data.enrollments.filter((e) => e.classId === classId && e.status === 'ENROLLED' && (!session || e.enrolledAt <= session.date));
  const existing = (mid: string) => data.attendances.find((a) => a.sessionId === session?.id && a.memberId === mid)?.status;
  const value = (mid: string) => draft[mid] ?? existing(mid) ?? 'PRESENT';
  const marked = session ? data.attendances.filter((a) => a.sessionId === session.id).length : 0;
  const future = session ? `${session.date} ${session.startTime}` > now : false;

  const save = () => {
    if (!classId || !session) return;
    students.forEach((e) => {
      const st = value(e.memberId);
      const ex = data.attendances.find((a) => a.sessionId === session.id && a.memberId === e.memberId);
      if (ex) { if (ex.status !== st) update('attendances', ex.id, { status: st, updatedAt: now, updatedBy: currentUser!.id }); }
      else add('attendances', { sessionId: session.id, memberId: e.memberId, status: st, updatedAt: now, updatedBy: currentUser!.id });
    });
    log('ATTENDANCE', 'ClassSession', session.id, `Điểm danh lớp ${data.classes.find((c) => c.id === classId)?.name} buổi ${dayjs(session.date).format('DD/MM')} ${session.startTime}${marked ? ' (chỉnh sửa)' : ''}`);
    message.success('Đã lưu điểm danh'); setDraft({});
  };

  return (
    <Page title={manager ? 'Điểm danh (Manager)' : 'Điểm danh học viên'} subtitle="Tối đa một bản ghi / (học viên, buổi). Cron sau buổi chỉ điền ABSENT cho ai chưa có, không ghi đè." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<Space wrap>
            <Select value={classId} style={{ width: 240 }} placeholder="Chọn lớp" onChange={(v) => { setClassId(v); setSessionId(undefined); setDraft({}); }} options={myClasses.map((c) => ({ value: c.id, label: `${c.name}${manager ? ` · ${nameOf(c.coachId)}` : ''}` }))} />
            <Select value={session?.id} style={{ width: 260 }} placeholder="Chọn buổi" onChange={(v) => { setSessionId(v); setDraft({}); }} options={sessions.map((s) => ({ value: s.id, label: `${DAY_NAMES[((dayjs(s.date).day() + 6) % 7) + 1]} ${dayjs(s.date).format('DD/MM')} · ${s.startTime}–${s.endTime}${`${s.date} ${s.startTime}` > now ? ' (sắp tới)' : ''}` }))} />
          </Space>} extra={session ? (marked ? <Tag color="blue">Đã điểm danh {marked}/{students.length}</Tag> : <Tag>Chưa điểm danh</Tag>) : null}>
            {!session ? <Alert type="info" title="Lớp chưa có buổi học" /> : (
              <>
                {future && <Alert type="warning" showIcon style={{ marginBottom: 12 }} title="Buổi này chưa diễn ra — vẫn lưu được nhưng nên điểm danh sau khi buổi bắt đầu." />}
                <Table rowKey="id" pagination={false} dataSource={students} locale={{ emptyText: 'Không có học viên thuộc buổi này' }} columns={[
                  { title: 'Học viên', render: (_, r) => nameOf(r.memberId) },
                  { title: 'Trạng thái', render: (_, r) => (
                    <Radio.Group value={value(r.memberId)} onChange={(e) => setDraft({ ...draft, [r.memberId]: e.target.value })} optionType="button" buttonStyle="solid" size="small"
                      options={[{ value: 'PRESENT', label: 'Có mặt' }, { value: 'LATE', label: 'Muộn' }, { value: 'ABSENT', label: 'Vắng' }]} />
                  ) },
                  { title: 'Cập nhật', render: (_, r) => { const a = data.attendances.find((x) => x.sessionId === session.id && x.memberId === r.memberId); return a?.updatedAt ? <span style={{ fontSize: 12, color: '#9a968c' }}>{a.updatedAt} · {nameOf(a.updatedBy)}</span> : ''; } },
                ]} />
                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Space>
                    <Button onClick={() => setDraft(Object.fromEntries(students.map((s) => [s.memberId, 'PRESENT' as St])))}>Tất cả có mặt</Button>
                    <Button type="primary" onClick={save} disabled={!students.length}>{marked ? 'Cập nhật điểm danh' : 'Lưu điểm danh'}</Button>
                  </Space>
                </div>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Các buổi của lớp">
            <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={[...sessions].reverse()} onRow={(r) => ({ onClick: () => { setSessionId(r.id); setDraft({}); }, style: { cursor: 'pointer', background: r.id === session?.id ? '#f5f8ff' : undefined } })} columns={[
              { title: 'Buổi', render: (_, r) => <span className="sc-nowrap">{dayjs(r.date).format('DD/MM')} {r.startTime}</span> },
              { title: 'Điểm danh', render: (_, r) => { const a = data.attendances.filter((x) => x.sessionId === r.id); return a.length ? <Space size={4}><StatusTag value="PRESENT" />{a.filter((x) => x.status !== 'ABSENT').length}/{a.length}</Space> : `${r.date} ${r.startTime}` > now ? <Tag>Sắp tới</Tag> : <Tag color="orange">Chưa</Tag>; } },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
