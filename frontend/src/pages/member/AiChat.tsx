import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Card, Input, Space, Tag } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';

interface Msg { role: 'user' | 'ai'; text: string }

const SUGGESTIONS = ['Lịch tập tuần này của tôi?', 'Gói của tôi còn bao lâu?', 'Có lớp Yoga nào còn chỗ không?', 'Bài tập về nhà của tôi là gì?', 'Trung tâm có những gói nào?'];

export default function AiChat() {
  const { data, currentUser, activeSubscription, nameOf } = useApp();
  const me = currentUser!;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'ai', text: `Xin chào ${me.fullName}! Tôi là trợ lý AI của Sports Center. Tôi có thể trả lời về lịch tập, bài tập, gói thành viên và dịch vụ của trung tâm.` }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  // Prototype: trả lời theo rule trên dữ liệu thật của member. Bản chính thức: gọi Claude API từ backend với context này.
  const answer = (q: string): string => {
    const s = q.toLowerCase();
    const myClassIds = data.enrollments.filter((e) => e.memberId === me.id && e.status === 'ACTIVE').map((e) => e.classId);
    if (s.includes('lịch')) {
      const sc = data.schedules.filter((x) => myClassIds.includes(x.classId)).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      if (!sc.length) return 'Bạn chưa đăng ký lớp nào. Vào mục "Lớp học" để xem các lớp đang mở nhé!';
      return 'Lịch tập tuần này của bạn:\n' + sc.map((x) => { const c = data.classes.find((y) => y.id === x.classId)!; return `• ${DAY_NAMES[x.dayOfWeek]} ${x.startTime}-${x.endTime}: ${c.name} (${data.rooms.find((r) => r.id === c.roomId)?.name}, HLV ${nameOf(c.coachId)})`; }).join('\n');
    }
    if (s.includes('gói') && (s.includes('tôi') || s.includes('còn') || s.includes('hạn'))) {
      const sub = activeSubscription(me.id);
      if (!sub) return 'Bạn chưa có gói thành viên còn hiệu lực. Bạn có thể đăng ký tại mục "Gói thành viên".';
      const p = data.plans.find((x) => x.id === sub.planId)!;
      return `Bạn đang dùng ${p.name}, hết hạn ngày ${dayjs(sub.endDate).format('DD/MM/YYYY')} (còn ${dayjs(sub.endDate).diff(dayjs(), 'day')} ngày). Quyền lợi: ${p.benefits}.`;
    }
    if (s.includes('gói')) return 'Các gói hiện có:\n' + data.plans.filter((p) => p.active).map((p) => `• ${p.name}: ${fmtMoney(p.price)} / ${p.durationDays} ngày — ${p.benefits}`).join('\n');
    if (s.includes('bài tập')) {
      const hw = data.homeworks.filter((h) => myClassIds.includes(h.classId));
      return hw.length ? 'Bài tập về nhà của bạn:\n' + hw.map((h) => `• ${h.title}: ${h.content}`).join('\n') : 'Hiện chưa có bài tập về nhà nào.';
    }
    if (s.includes('lớp')) {
      const sport = data.sports.find((sp) => s.includes(sp.name.toLowerCase()));
      const list = data.classes.filter((c) => c.status === 'OPEN' && (!sport || c.sportId === sport.id)).map((c) => ({ c, left: c.capacity - data.enrollments.filter((e) => e.classId === c.id && e.status === 'ACTIVE').length }));
      return `Các lớp${sport ? ' ' + sport.name : ''} đang mở:\n` + list.map(({ c, left }) => `• ${c.name} — HLV ${nameOf(c.coachId)} — còn ${left} chỗ — ${fmtMoney(c.price)}`).join('\n');
    }
    if (s.includes('giờ') || s.includes('mở cửa')) return 'Trung tâm mở cửa 05:30 – 22:00 tất cả các ngày trong tuần.';
    return 'Tôi có thể giúp bạn về: lịch tập, gói thành viên, lớp học còn chỗ, bài tập về nhà, giờ mở cửa. Bạn muốn hỏi gì?';
  };

  const send = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: 'user', text: q }]); setInput(''); setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { role: 'ai', text: answer(q) }]); setTyping(false); }, 700);
  };

  return (
    <Page title="Trợ lý AI" subtitle="Hỏi về lịch tập, bài tập, gói thành viên hoặc dịch vụ của trung tâm" noCard>
      <Card style={{ height: 'calc(100vh - 230px)', minHeight: 480, display: 'flex', flexDirection: 'column' }} styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {msgs.map((m, i) => (
            <div key={i} className="sc-fade" style={{ display: 'flex', gap: 10, marginBottom: 14, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              <Avatar icon={m.role === 'user' ? <UserOutlined /> : <RobotOutlined />} style={{ background: m.role === 'user' ? '#0f4d34' : 'linear-gradient(135deg,#0f4d34,#2f7d55)', flexShrink: 0 }} />
              <div style={{ background: m.role === 'user' ? '#0f4d34' : '#f3f1ec', color: m.role === 'user' ? '#fff' : '#14130f', padding: '10px 14px', borderRadius: 14, borderBottomRightRadius: m.role === 'user' ? 4 : 14, borderBottomLeftRadius: m.role === 'user' ? 14 : 4, maxWidth: '72%', whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.55, boxShadow: m.role === 'user' ? '0 4px 12px rgba(15,77,52,.25)' : undefined }}>{m.text}</div>
            </div>
          ))}
          {typing && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar icon={<RobotOutlined />} style={{ background: 'linear-gradient(135deg,#0f4d34,#2f7d55)' }} /><div className="sc-typing"><span /><span /><span /></div></div>}
          <div ref={bottom} />
        </div>
        <Space wrap style={{ margin: '10px 0' }}>{SUGGESTIONS.map((s) => <Tag key={s} style={{ cursor: 'pointer', background: '#fff', border: '1px solid #e2ddd2', padding: '4px 12px', fontWeight: 500 }} onClick={() => send(s)}>{s}</Tag>)}</Space>
        <Space.Compact style={{ width: '100%' }}>
          <Input size="large" value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={() => send(input)} placeholder="Nhập câu hỏi cho trợ lý..." />
          <Button size="large" type="primary" icon={<SendOutlined />} onClick={() => send(input)}>Gửi</Button>
        </Space.Compact>
      </Card>
    </Page>
  );
}
