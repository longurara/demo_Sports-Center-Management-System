import { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import Page from '../../components/Page';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { classPrice, enrollable } from '../../utils/classes';

interface Msg { role: 'user' | 'ai'; text: string; at: string }

/** Gợi ý theo chủ đề — hiện dạng thẻ ở màn hình chào, dạng chip khi đã có hội thoại. */
const SUGGESTIONS: { topic: string; q: string }[] = [
  { topic: 'Lịch tập', q: 'Lịch tập tuần này của tôi?' },
  { topic: 'Gói thành viên', q: 'Gói của tôi còn bao lâu?' },
  { topic: 'Lớp học', q: 'Có lớp Yoga nào còn chỗ không?' },
  { topic: 'Bài tập', q: 'Bài tập về nhà của tôi là gì?' },
  { topic: 'Trung tâm', q: 'Trung tâm có những gói nào?' },
  { topic: 'Giờ mở cửa', q: 'Trung tâm mở cửa mấy giờ?' },
];

/** Câu trả lời dạng text: dòng đầu là câu dẫn, các dòng "• …" thành danh sách có kẻ trái. */
function AnswerBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const items = lines.filter((l) => l.startsWith('• ')).map((l) => l.slice(2));
  const rest = lines.filter((l) => !l.startsWith('• ')).join('\n');
  return (
    <>
      {rest && <p>{rest}</p>}
      {items.length > 0 && <ul className="sc-chat-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
    </>
  );
}

export default function AiChat() {
  const { data, currentUser, activeSubscription, nameOf } = useApp();
  const me = currentUser!;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing]);

  // Ngữ cảnh trợ lý đang dùng — hiện ở cột phải để người dùng biết câu trả lời dựa trên gì
  const myClassIds = data.enrollments.filter((e) => e.memberId === me.id && e.status === 'ENROLLED').map((e) => e.classId);
  const sub = activeSubscription(me.id);
  const plan = sub ? data.plans.find((p) => p.id === sub.planId) : undefined;
  const hwCount = data.homeworks.filter((h) => myClassIds.includes(h.classId)).length;
  const next = (() => {
    const now = dayjs(); const dow = now.day() === 0 ? 7 : now.day();
    const cands = data.schedules.filter((x) => myClassIds.includes(x.classId)).map((x) => {
      let delta = (x.dayOfWeek - dow + 7) % 7;
      if (delta === 0 && x.startTime <= now.format('HH:mm')) delta = 7;
      return { x, delta };
    }).sort((a, b) => a.delta - b.delta || a.x.startTime.localeCompare(b.x.startTime));
    if (!cands.length) return null;
    const { x, delta } = cands[0];
    const c = data.classes.find((y) => y.id === x.classId)!;
    return { label: delta === 0 ? 'Hôm nay' : delta === 1 ? 'Ngày mai' : DAY_NAMES[x.dayOfWeek], time: x.startTime, name: c.name };
  })();

  // Prototype: trả lời theo rule trên dữ liệu thật của member. Bản chính thức: gọi Claude API từ backend với context này.
  const answer = (q: string): string => {
    const s = q.toLowerCase();
    if (s.includes('lịch')) {
      const sc = data.schedules.filter((x) => myClassIds.includes(x.classId)).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      if (!sc.length) return 'Bạn chưa đăng ký lớp nào. Vào mục "Lớp học" để xem các lớp đang mở nhé.';
      return 'Lịch tập tuần này của bạn:\n' + sc.map((x) => { const c = data.classes.find((y) => y.id === x.classId)!; return `• ${DAY_NAMES[x.dayOfWeek]} ${x.startTime}–${x.endTime} · ${c.name} — ${data.rooms.find((r) => r.id === c.roomId)?.name}, HLV ${nameOf(c.coachId)}`; }).join('\n');
    }
    if (s.includes('gói') && (s.includes('tôi') || s.includes('còn') || s.includes('hạn'))) {
      if (!sub || !plan) return 'Bạn chưa có gói thành viên còn hiệu lực. Bạn có thể đăng ký tại mục "Gói thành viên".';
      return `Bạn đang dùng ${plan.name}, hết hạn ngày ${dayjs(sub.endDate).format('DD/MM/YYYY')} (còn ${dayjs(sub.endDate).diff(dayjs(), 'day')} ngày).\nQuyền lợi: ${plan.gymAccess ? 'gym miễn phí, ' : ''}giảm ${plan.bookingDiscountPct}% đặt sân, giảm ${plan.classDiscountPct}% học phí, ${plan.freeBookingSlotsPerMonth} slot miễn phí/tháng. Ví: ${fmtMoney(me.walletBalance ?? 0)}.`;
    }
    if (s.includes('gói')) return 'Các gói hiện có:\n' + data.plans.filter((p) => p.active).map((p) => `• ${p.name} — ${fmtMoney(p.price)} / ${p.durationDays} ngày. ${p.description}`).join('\n');
    if (s.includes('bài tập')) {
      const hw = data.homeworks.filter((h) => myClassIds.includes(h.classId));
      return hw.length ? 'Bài tập về nhà của bạn:\n' + hw.map((h) => `• ${h.title} — ${h.content}`).join('\n') : 'Hiện chưa có bài tập về nhà nào.';
    }
    if (s.includes('lớp')) {
      const sport = data.sports.find((sp) => s.includes(sp.name.toLowerCase()));
      const list = data.classes.filter((c) => enrollable(data, c) && (!sport || c.sportId === sport.id)).map((c) => ({ c, left: c.capacity - data.enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED').length }));
      if (!list.length) return `Hiện chưa có lớp${sport ? ' ' + sport.name : ''} nào đang mở.`;
      return `Các lớp${sport ? ' ' + sport.name : ''} đang mở:\n` + list.map(({ c, left }) => `• ${c.name} — HLV ${nameOf(c.coachId)} · còn ${left} chỗ · ${fmtMoney(classPrice(data, c))}`).join('\n');
    }
    if (s.includes('giờ') || s.includes('mở cửa')) return 'Trung tâm mở cửa 06:00 – 22:00, 7 ngày trong tuần. Lễ Tết mở 08:00 – 20:00.';
    return 'Tôi có thể trả lời về lịch tập, gói thành viên, lớp còn chỗ, bài tập về nhà và giờ mở cửa. Bạn muốn hỏi gì?';
  };

  const send = (q: string) => {
    const t = q.trim();
    if (!t || typing) return;
    const at = dayjs().format('HH:mm');
    setMsgs((m) => [...m, { role: 'user', text: t, at }]); setInput(''); setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { role: 'ai', text: answer(t), at: dayjs().format('HH:mm') }]); setTyping(false); }, 700);
  };

  const empty = msgs.length === 0;
  const firstName = me.fullName.split(' ').slice(-1)[0];

  return (
    <Page title="Trợ lý AI" subtitle="Hỏi về lịch tập, bài tập, gói thành viên hoặc dịch vụ của trung tâm" noCard>
      <div className="sc-chat">
        {/* Khung hội thoại */}
        <div className="sc-chat-main">
          <div className="sc-chat-scroll">
            <div className="sc-chat-inner">
              {empty ? (
                <div className="sc-chat-welcome sc-fade">
                  <small>Trợ lý · Sports Center</small>
                  <h2>Chào {firstName}.<br />Hôm nay tập gì?</h2>
                  <p>Tôi biết lịch, lớp, gói và bài tập của bạn — hỏi thẳng, không cần mở từng trang.</p>
                  <div className="sc-chat-cards">
                    {SUGGESTIONS.map((s) => (
                      <button key={s.q} type="button" className="sc-chat-card" onClick={() => send(s.q)}>
                        <small>{s.topic}</small>
                        <span>{s.q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="sc-chat-thread">
                  {msgs.map((m, i) => m.role === 'user' ? (
                    <div key={i} className="sc-chat-msg user sc-fade">
                      <div className="sc-chat-bubble">{m.text}</div>
                      <time>{m.at}</time>
                    </div>
                  ) : (
                    <div key={i} className="sc-chat-msg ai sc-fade">
                      <i className="sc-chat-mark">SC</i>
                      <div className="sc-chat-body">
                        <div className="sc-chat-meta"><span>Trợ lý</span><time>{m.at}</time></div>
                        <AnswerBody text={m.text} />
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="sc-chat-msg ai">
                      <i className="sc-chat-mark">SC</i>
                      <div className="sc-chat-body"><div className="sc-chat-meta"><span>Trợ lý</span></div><div className="sc-chat-typing"><span /><span /><span /></div></div>
                    </div>
                  )}
                  <div ref={bottom} />
                </div>
              )}
            </div>
          </div>

          {/* Ô nhập */}
          <div className="sc-chat-composer-wrap">
            <div className="sc-chat-inner">
              {!empty && (
                <div className="sc-chat-chips">
                  {SUGGESTIONS.map((s) => <button key={s.q} type="button" onClick={() => send(s.q)}>{s.q}</button>)}
                </div>
              )}
              <div className="sc-chat-composer">
                <Input.TextArea variant="borderless" autoSize={{ minRows: 1, maxRows: 5 }} value={input} onChange={(e) => setInput(e.target.value)}
                  onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(input); } }} placeholder="Hỏi về lịch tập, gói, lớp hoặc bài tập của bạn…" />
                <button type="button" className="sc-chat-send" onClick={() => send(input)} disabled={!input.trim() || typing} aria-label="Gửi"><ArrowUpOutlined /></button>
              </div>
              <div className="sc-chat-hint">Enter để gửi · Shift + Enter xuống dòng. Câu trả lời dựa trên dữ liệu tài khoản của bạn và không được chia sẻ ra ngoài.</div>
            </div>
          </div>
        </div>

        {/* Cột phải: trợ lý đang biết gì về bạn */}
        <aside className="sc-chat-side">
          <small>Trợ lý đang dùng</small>
          <div className="sc-chat-fact">
            <span>Gói thành viên</span>
            {plan && sub ? <><b>{plan.name}</b><em>còn {dayjs(sub.endDate).diff(dayjs(), 'day')} ngày · hết hạn {dayjs(sub.endDate).format('DD/MM')}</em></> : <><b>Chưa có gói</b><em><Link to="/member/plans">Xem các gói →</Link></em></>}
          </div>
          <div className="sc-chat-fact">
            <span>Lớp đang học</span>
            <b>{myClassIds.length} lớp</b>
            <em>{myClassIds.length ? data.classes.filter((c) => myClassIds.includes(c.id)).map((c) => c.name).join(' · ') : 'Chưa đăng ký lớp nào'}</em>
          </div>
          <div className="sc-chat-fact">
            <span>Buổi kế tiếp</span>
            {next ? <><b>{next.label} · {next.time}</b><em>{next.name}</em></> : <><b>—</b><em>Không có buổi nào sắp tới</em></>}
          </div>
          <div className="sc-chat-fact">
            <span>Bài tập về nhà</span>
            <b>{hwCount} bài</b>
            <em><Link to="/member/training-plan">Xem bài tập →</Link></em>
          </div>
          <p className="sc-chat-side-note">Trợ lý chỉ đọc dữ liệu trong tài khoản của bạn để trả lời. Cần người hỗ trợ? Gọi quầy lễ tân <a href="tel:02838123456">028 3812 3456</a>.</p>
        </aside>
      </div>
    </Page>
  );
}
