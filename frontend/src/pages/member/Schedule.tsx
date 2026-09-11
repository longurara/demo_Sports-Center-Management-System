import { useMemo, useState, type ReactNode } from 'react';
import { Button, Card, Col, Empty, Grid, Row, Segmented, Space, Tag } from 'antd';
import { CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled, EnvironmentOutlined, FieldTimeOutlined, LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import WeekCalendar, { type CalEvent } from '../../components/WeekCalendar';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, useApp } from '../../store/AppContext';

const monday = () => dayjs().startOf('day').subtract((dayjs().day() + 6) % 7, 'day');

interface Item { key: string; date: string; start: string; end: string; kind: 'CLASS' | 'COURT'; title: string; sportId?: string; room?: string; coachId?: string; classId?: string; att?: string; status?: string; color: string; icon?: string }

export default function MySchedule() {
  const { data, currentUser, userById } = useApp();
  const navigate = useNavigate();
  const me = currentUser!.id;
  const [weekStart, setWeekStart] = useState(monday());
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [view, setView] = useState<'week' | 'day' | 'list'>('week');
  const [dayIdx, setDayIdx] = useState((dayjs().day() + 6) % 7); // ngày đang chọn ở chế độ 1 ngày (mobile)
  const today = dayjs().format('YYYY-MM-DD');
  const effView = isMobile && view === 'week' ? 'day' : view; // mobile không dùng lưới 7 cột

  const enrolled = data.enrollments.filter((e) => e.memberId === me && e.status === 'ACTIVE').map((e) => data.classes.find((c) => c.id === e.classId)!).filter((c) => c && c.status === 'OPEN');

  /** Sinh danh sách hoạt động trong tuần: buổi học theo lịch lớp + lượt đặt sân. */
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (let i = 0; i < 7; i++) {
      const d = weekStart.add(i, 'day');
      const ds = d.format('YYYY-MM-DD');
      const dow = i + 1;
      for (const c of enrolled) {
        if (ds < c.startDate || ds > c.endDate) continue;
        const sport = data.sports.find((s) => s.id === c.sportId);
        for (const sc of data.schedules.filter((s) => s.classId === c.id && s.dayOfWeek === dow)) {
          const session = data.sessions.find((s) => s.classId === c.id && s.date === ds);
          const att = session ? data.attendances.find((a) => a.sessionId === session.id && a.memberId === me)?.status : undefined;
          out.push({ key: `${sc.id}_${ds}`, date: ds, start: sc.startTime, end: sc.endTime, kind: 'CLASS', title: c.name, sportId: c.sportId, room: data.rooms.find((r) => r.id === c.roomId)?.name, coachId: c.coachId, classId: c.id, att, color: sport?.color ?? '#0f4d34', icon: sport?.icon });
        }
      }
      for (const b of data.courtBookings.filter((x) => x.memberId === me && x.date === ds && x.status !== 'CANCELLED')) {
        const court = data.rooms.find((r) => r.id === b.courtId);
        const sport = data.sports.find((s) => s.id === court?.sportId);
        out.push({ key: b.id, date: ds, start: b.startTime, end: b.endTime, kind: 'COURT', title: court?.name ?? 'Sân', sportId: court?.sportId, room: court?.location, status: b.status, color: sport?.color ?? '#0891b2', icon: sport?.icon });
      }
    }
    return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }, [weekStart, enrolled, data, me]);

  const events: CalEvent[] = items.map((it) => ({
    id: it.key, date: it.date, start: it.start, end: it.end, title: it.title, color: it.color, icon: it.icon,
    sub: it.kind === 'CLASS' ? `${it.room} · HLV ${userById(it.coachId)?.fullName?.split(' ').slice(-1)[0] ?? '—'}` : it.room,
    dashed: it.kind === 'COURT',
    badge: it.att === 'PRESENT' || it.att === 'LATE' ? <CheckCircleFilled style={{ color: it.att === 'LATE' ? '#f59e0b' : '#16a34a', fontSize: 12 }} /> : it.att === 'ABSENT' ? <CloseCircleFilled style={{ color: '#dc2626', fontSize: 12 }} /> : it.kind === 'COURT' ? <FieldTimeOutlined style={{ color: it.color, fontSize: 11 }} /> : undefined,
    onClick: it.kind === 'CLASS' ? () => navigate(`/member/classes/${it.classId}`) : () => navigate('/member/courts'),
  }));

  // Buổi tiếp theo (tính từ hiện tại, không phụ thuộc tuần đang xem)
  const next = useMemo(() => {
    const now = dayjs();
    for (let i = 0; i < 14; i++) {
      const d = now.add(i, 'day'); const ds = d.format('YYYY-MM-DD'); const dow = ((d.day() + 6) % 7) + 1;
      const cands: { start: string; end: string; title: string; classId?: string; room?: string; coachId?: string; sportId?: string; kind: 'CLASS' | 'COURT' }[] = [];
      for (const c of enrolled) if (ds >= c.startDate && ds <= c.endDate) for (const sc of data.schedules.filter((s) => s.classId === c.id && s.dayOfWeek === dow)) cands.push({ start: sc.startTime, end: sc.endTime, title: c.name, classId: c.id, room: data.rooms.find((r) => r.id === c.roomId)?.name, coachId: c.coachId, sportId: c.sportId, kind: 'CLASS' });
      for (const b of data.courtBookings.filter((x) => x.memberId === me && x.date === ds && x.status === 'BOOKED')) { const court = data.rooms.find((r) => r.id === b.courtId); cands.push({ start: b.startTime, end: b.endTime, title: court?.name ?? 'Sân', room: court?.location, sportId: court?.sportId, kind: 'COURT' }); }
      const hit = cands.filter((x) => dayjs(`${ds} ${x.end}`).isAfter(now)).sort((a, b) => a.start.localeCompare(b.start))[0];
      if (hit) return { ...hit, date: ds, at: dayjs(`${ds} ${hit.start}`) };
    }
    return null;
  }, [enrolled, data, me]);

  const weekClasses = items.filter((i) => i.kind === 'CLASS');
  const weekHours = items.reduce((s, i) => s + (dayjs(`2000-01-01 ${i.end}`).diff(dayjs(`2000-01-01 ${i.start}`), 'minute')), 0) / 60;
  const attended = weekClasses.filter((i) => i.att && i.att !== 'ABSENT').length;
  const isThisWeek = weekStart.isSame(monday(), 'day');
  const todayItems = items.filter((i) => i.date === today);
  const countdown = next ? (next.at.diff(dayjs(), 'minute') <= 0 ? 'Đang diễn ra' : next.at.diff(dayjs(), 'hour') < 1 ? `Còn ${next.at.diff(dayjs(), 'minute')} phút` : next.at.diff(dayjs(), 'hour') < 24 ? `Còn ${next.at.diff(dayjs(), 'hour')} giờ` : `Còn ${next.at.diff(dayjs().startOf('day'), 'day')} ngày`) : '';

  const dayGroups = Array.from({ length: 7 }).map((_, i) => { const d = weekStart.add(i, 'day'); const ds = d.format('YYYY-MM-DD'); return { d, ds, list: items.filter((x) => x.date === ds) }; });

  return (
    <Page title="Lịch tập của tôi" subtitle={`${enrolled.length} lớp đang theo · tuần ${weekStart.format('DD/MM')} – ${weekStart.add(6, 'day').format('DD/MM/YYYY')}`} noCard
      extra={<Space>
        <Segmented value={effView} onChange={(v) => setView(v as typeof view)} options={isMobile ? [{ value: 'day', label: 'Theo ngày' }, { value: 'list', label: 'Danh sách' }] : [{ value: 'week', label: 'Lịch tuần' }, { value: 'list', label: 'Danh sách' }]} />
        <Space.Compact>
          <Button icon={<LeftOutlined />} onClick={() => setWeekStart(weekStart.subtract(7, 'day'))} />
          <Button type={isThisWeek ? 'primary' : 'default'} onClick={() => setWeekStart(monday())}>Tuần này</Button>
          <Button icon={<RightOutlined />} onClick={() => setWeekStart(weekStart.add(7, 'day'))} />
        </Space.Compact>
      </Space>}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xxl={17}>
          <Card size="small" styles={{ body: { padding: effView !== 'list' ? '4px 8px 8px' : 16 } }}>
            {items.length === 0 && enrolled.length === 0 ? (
              <Empty description="Bạn chưa đăng ký lớp nào" style={{ padding: 40 }}><Button type="primary" onClick={() => navigate('/member/classes')}>Xem lớp học</Button></Empty>
            ) : effView === 'week' ? (
              <WeekCalendar weekStart={weekStart} events={events} hourFrom={6} hourTo={22} hourHeight={56} />
            ) : effView === 'day' ? (
              <div>
                {/* Dải chọn ngày trong tuần */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '8px 0 4px' }}>
                  {dayGroups.map(({ d, ds, list }, i) => {
                    const on = i === dayIdx;
                    return (
                      <div key={ds} onClick={() => setDayIdx(i)} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 10, cursor: 'pointer', background: on ? '#0f4d34' : ds === today ? '#e3efe8' : '#f3f1ec', color: on ? '#fff' : '#14130f' }}>
                        <div style={{ fontSize: 10, opacity: .75 }}>{DAY_NAMES[d.day() === 0 ? 7 : d.day()].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{d.format('DD')}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2, height: 5 }}>{list.slice(0, 3).map((x) => <span key={x.key} style={{ width: 5, height: 5, borderRadius: 999, background: on ? '#fff' : x.color }} />)}</div>
                      </div>
                    );
                  })}
                </div>
                <WeekCalendar weekStart={weekStart.add(dayIdx, 'day')} dayCount={1} events={events} hourFrom={6} hourTo={22} hourHeight={56} minHours={10} />
              </div>
            ) : (
              <div>
                {dayGroups.map(({ d, ds, list }) => (
                  <div key={ds} style={{ display: 'grid', gridTemplateColumns: isMobile ? '52px 1fr' : '90px 1fr', gap: isMobile ? 8 : 12, padding: '10px 0', borderBottom: '1px solid #f3f1ec' }}>
                    <div style={{ textAlign: 'center', paddingTop: 4 }}>
                      <div style={{ fontSize: 11, color: ds === today ? '#0f4d34' : '#9a968c', fontWeight: 600 }}>{DAY_NAMES[d.day() === 0 ? 7 : d.day()].replace('Chủ nhật', 'CN')}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: ds === today ? '#0f4d34' : '#14130f', lineHeight: 1.1 }}>{d.format('DD')}</div>
                      <div style={{ fontSize: 11, color: '#9a968c' }}>{d.format(isMobile ? 'MM' : 'MM/YYYY')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                      {list.length === 0 && <div style={{ color: '#cbd5e1', fontSize: 13, paddingTop: 10 }}>Nghỉ</div>}
                      {list.map((it) => (
                        <div key={it.key} className="sc-hover-row" onClick={() => navigate(it.kind === 'CLASS' ? `/member/classes/${it.classId}` : '/member/courts')}
                          style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ece8df', borderLeft: `4px solid ${it.color}`, cursor: 'pointer', background: '#fff', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: it.color, fontSize: 13, whiteSpace: 'nowrap' }}><ClockCircleOutlined /> {it.start}–{it.end}</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <SportTag id={it.sportId} size="small" />
                              {it.att && <StatusTag value={it.att} />}
                              {it.status && it.kind === 'COURT' && <StatusTag value={it.status} />}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.icon} {it.title} {it.kind === 'COURT' && <Tag color="cyan" style={{ marginLeft: 6 }}>Đặt sân</Tag>}</div>
                          <div style={{ fontSize: 12, color: '#7a776f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><EnvironmentOutlined /> {it.room}{it.coachId && <> · <UserOutlined /> HLV {userById(it.coachId)?.fullName}</>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: '#7a776f', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 10, borderRadius: 3, background: '#0f4d3422', borderLeft: '3px solid #0f4d34' }} />Buổi học lớp</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 10, borderRadius: 3, border: '1px dashed #0891b2', borderLeft: '3px solid #0891b2' }} />Sân đã đặt</span>
            <span><CheckCircleFilled style={{ color: '#16a34a' }} /> có mặt · <CheckCircleFilled style={{ color: '#f59e0b' }} /> muộn · <CloseCircleFilled style={{ color: '#dc2626' }} /> vắng</span>
            <span style={{ marginLeft: 'auto' }}>Màu theo bộ môn: {enrolled.map((c) => <SportTag key={c.id} id={c.sportId} size="small" />).reduce<ReactNode[]>((acc, x, i) => [...acc, i ? ' ' : null, x], [])}</span>
          </div>
        </Col>

        <Col xs={24} xxl={7}>
          <Row gutter={[16, 16]}>
            {/* Buổi tiếp theo */}
            <Col xs={24} md={12} xl={6} xxl={24}>
            <div style={{ borderRadius: 14, padding: 18, background: 'linear-gradient(135deg,#14130f 0%,#0f4d34 140%)', color: '#fff', height: '100%' }}>
              <div style={{ fontSize: 11, letterSpacing: '.08em', opacity: .7 }}>BUỔI TIẾP THEO</div>
              {next ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{next.title}</div>
                    <Tag color={next.at.diff(dayjs(), 'hour') < 3 ? 'orange' : 'blue'} style={{ margin: 0 }}>{countdown}</Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: .85, lineHeight: 1.8 }}>
                    <div><CalendarOutlined /> {next.at.format('dddd, DD/MM')} · <b>{next.start}–{next.end}</b></div>
                    <div><EnvironmentOutlined /> {next.room}</div>
                    {next.coachId && <div><UserOutlined /> HLV {userById(next.coachId)?.fullName}</div>}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SportTag id={next.sportId} size="small" />
                    <Button size="small" style={{ marginLeft: 8, background: 'rgba(255,255,255,.14)', border: 'none', color: '#fff' }} onClick={() => navigate(next.kind === 'CLASS' ? `/member/classes/${next.classId}` : '/member/courts')}>Chi tiết</Button>
                  </div>
                </>
              ) : <div style={{ marginTop: 8, opacity: .8 }}>Không có buổi nào trong 2 tuần tới.</div>}
            </div>
            </Col>

            {/* Thống kê tuần */}
            <Col xs={24} md={12} xl={6} xxl={24}>
            <Card size="small" title={isThisWeek ? 'Tuần này' : `Tuần ${weekStart.format('DD/MM')}`} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Buổi học', v: weekClasses.length, c: '#0f4d34' },
                  { l: 'Giờ hoạt động', v: `${Math.round(weekHours * 10) / 10}h`, c: '#9333ea' },
                  { l: 'Sân đã đặt', v: items.filter((i) => i.kind === 'COURT').length, c: '#0891b2' },
                  { l: 'Đã điểm danh', v: `${attended}/${weekClasses.filter((i) => i.date <= today).length}`, c: '#16a34a' },
                ].map((x) => <div key={x.l} style={{ background: '#f7f5f0', borderRadius: 10, padding: '8px 10px' }}><div style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{x.v}</div><div style={{ fontSize: 11, color: '#9a968c' }}>{x.l}</div></div>)}
              </div>
            </Card>
            </Col>

            {/* Hôm nay */}
            <Col xs={24} md={12} xl={6} xxl={24}>
            <Card size="small" title={`Hôm nay · ${dayjs().format('DD/MM')}`} style={{ height: '100%' }}>
              {todayItems.length === 0 ? <div style={{ color: '#9a968c', fontSize: 13 }}>Hôm nay không có lịch — nghỉ ngơi hoặc <a onClick={() => navigate('/member/courts')}>đặt sân</a> nhé.</div>
                : todayItems.map((it) => (
                  <div key={it.key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #f3f1ec' }}>
                    <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: it.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{it.title}</div><div style={{ fontSize: 12, color: '#7a776f' }}>{it.start}–{it.end} · {it.room}</div></div>
                    {it.att ? <StatusTag value={it.att} /> : dayjs(`${today} ${it.end}`).isBefore(dayjs()) ? <Tag style={{ margin: 0 }}>Đã qua</Tag> : <Tag color="blue" style={{ margin: 0 }}>Sắp tới</Tag>}
                  </div>
                ))}
            </Card>
            </Col>

            {/* Lớp đang theo */}
            <Col xs={24} md={12} xl={6} xxl={24}>
            <Card size="small" title="Lớp đang theo" style={{ height: '100%' }}>
              {enrolled.map((c) => (
                <div key={c.id} onClick={() => navigate(`/member/classes/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: `${data.sports.find((s) => s.id === c.sportId)?.color ?? '#0f4d34'}18`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{data.sports.find((s) => s.id === c.sportId)?.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: '#7a776f' }}>{data.schedules.filter((s) => s.classId === c.id).map((s) => `${DAY_NAMES[s.dayOfWeek].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')} ${s.startTime}`).join(' · ')} · HLV {userById(c.coachId)?.fullName?.split(' ').slice(-1)[0] ?? '—'}</div>
                  </div>
                </div>
              ))}
            </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Page>
  );
}
