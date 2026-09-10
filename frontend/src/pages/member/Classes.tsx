import { useState } from 'react';
import { Button, Card, Col, Popconfirm, Row, Select, Space, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/Page';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { seatsLeft } from '../../utils/conflicts';

export default function MemberClasses() {
  const { data, currentUser, nameOf, update, log } = useApp();
  const navigate = useNavigate();
  const me = currentUser!;
  const [sport, setSport] = useState<string | undefined>();
  const [coach, setCoach] = useState<string | undefined>();
  const [day, setDay] = useState<number | undefined>();

  const list = data.classes.filter((c) => c.status === 'OPEN' && (!sport || c.sportId === sport) && (!coach || c.coachId === coach) && (!day || data.schedules.some((s) => s.classId === c.id && s.dayOfWeek === day)));
  const myEnroll = (classId: string) => data.enrollments.find((e) => e.memberId === me.id && e.classId === classId && e.status === 'ACTIVE');

  const cancel = (id: string, name: string) => {
    update('enrollments', id, { status: 'CANCELLED' });
    log('CANCEL_ENROLL', 'Enrollment', id, `${me.fullName} hủy lớp ${name}`);
    message.success('Đã hủy đăng ký lớp');
  };

  return (
    <Page title="Lớp học" subtitle="Danh sách lớp đang mở đăng ký" extra={
      <Space wrap>
        <Select placeholder="Bộ môn" allowClear style={{ width: 140 }} onChange={setSport} options={data.sports.map((s) => ({ value: s.id, label: s.name }))} />
        <Select placeholder="Huấn luyện viên" allowClear style={{ width: 170 }} onChange={setCoach} options={data.users.filter((u) => u.role === 'COACH').map((u) => ({ value: u.id, label: u.fullName }))} />
        <Select placeholder="Ngày" allowClear style={{ width: 120 }} onChange={setDay} options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: DAY_NAMES[d] }))} />
      </Space>
    } noCard>
      <Row gutter={[16, 16]}>
        {list.map((c) => {
          const en = myEnroll(c.id);
          const left = seatsLeft(data, c.id);
          return (
            <Col xs={24} md={12} xl={8} key={c.id}>
              <Card title={c.name} extra={<Tag color={en ? 'blue' : left > 0 ? 'green' : 'red'}>{en ? 'Đã đăng ký' : left > 0 ? `Còn ${left} chỗ` : 'Hết chỗ'}</Tag>} hoverable onClick={() => navigate(`/member/classes/${c.id}`)}>
                <div><Tag>{data.sports.find((s) => s.id === c.sportId)?.name}</Tag> HLV <b>{nameOf(c.coachId)}</b></div>
                <div style={{ margin: '8px 0', color: '#666' }}>{data.schedules.filter((s) => s.classId === c.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}`).join(' · ')}</div>
                <div>{data.rooms.find((r) => r.id === c.roomId)?.name} · {c.startDate} → {c.endDate}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                  <b style={{ fontSize: 16 }}>{fmtMoney(c.price)}</b>
                  {en ? (
                    <Popconfirm title="Hủy đăng ký lớp này?" onConfirm={() => cancel(en.id, c.name)}><Button danger size="small">Hủy đăng ký</Button></Popconfirm>
                  ) : (
                    <Button type="primary" size="small" disabled={left <= 0} onClick={() => navigate(`/member/checkout/class/${c.id}`)}>Đăng ký</Button>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Page>
  );
}
