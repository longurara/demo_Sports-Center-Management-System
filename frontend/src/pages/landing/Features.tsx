import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import dayjs from 'dayjs';
import { CheckCircleFilled, RobotOutlined } from '@ant-design/icons';
import { EASE, Reveal } from './ui';

interface Step { key: string; title: string; desc: string; bullets: string[]; visual: ReactNode }

const STEPS: Step[] = [
  {
    key: 'court', title: 'Đặt sân theo giờ',
    desc: 'Chọn ngày, nhìn lưới sân × khung giờ, bấm vào ô trống là xong. Giá hiện ngay, đã trừ ưu đãi theo gói của bạn. Không gọi điện, không chờ xác nhận.',
    bullets: ['Đặt trước tới 14 ngày, 24/7', 'Thấy ngay giờ nào trống, giờ nào có lớp', 'Hủy trước giờ chơi, hoàn tiền vào tài khoản'],
    visual: <CourtVisual />,
  },
  {
    key: 'class', title: 'Đăng ký lớp, biết trước HLV',
    desc: 'Mỗi lớp ghi rõ HLV phụ trách, chứng chỉ, phòng, lịch trong tuần và còn bao nhiêu chỗ. Gói của bạn vào được lớp nào, hệ thống báo ngay khi đăng ký.',
    bullets: ['HLV đúng chuyên môn từng bộ môn', 'Lịch tuần rõ ràng, nhắc trước giờ học', 'Điểm danh bằng mã thành viên'],
    visual: <ClassVisual />,
  },
  {
    key: 'progress', title: 'Xem mình tiến bộ đến đâu',
    desc: 'Sau mỗi buổi, HLV ghi lại chỉ số của bạn: tạ, thời gian, quãng đường, độ gắng sức. Bạn mở app là thấy biểu đồ và kỷ lục cá nhân — không cần tự ghi sổ.',
    bullets: ['Chỉ số theo từng bộ môn', 'Biểu đồ tiến bộ tuần / tháng', 'Kỷ lục cá nhân tự động cập nhật'],
    visual: <ProgressVisual />,
  },
  {
    key: 'ai', title: 'Kế hoạch tuần cho riêng bạn',
    desc: 'Nói mục tiêu của bạn, hệ thống gợi ý lịch tập tuần dựa trên kết quả gần nhất; HLV xem và chỉnh trước khi gửi. Thắc mắc gì hỏi trợ lý bất cứ lúc nào.',
    bullets: ['Theo mục tiêu: giảm mỡ, tăng cơ, thi đấu', 'HLV duyệt trước khi gửi cho bạn', 'Trợ lý trả lời 24/7'],
    visual: <AiVisual />,
  },
  {
    key: 'invoice', title: 'Thanh toán rõ ràng, có hóa đơn',
    desc: 'Mua gói, đăng ký lớp hay thuê sân đều có hóa đơn điện tử gửi về tài khoản: mã tra cứu, QR, số tiền bằng chữ. Lịch sử thanh toán xem lại bất cứ lúc nào.',
    bullets: ['Hóa đơn điện tử hợp lệ, in được A4', 'Lịch sử thanh toán đầy đủ', 'Chuyển khoản, thẻ hoặc tiền mặt tại quầy'],
    visual: <InvoiceVisual />,
  },
];

export default function Features() {
  const [active, setActive] = useState(0);
  return (
    <section className="lp-section lp-features" id="features">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Cách hoạt động</span></Reveal>
        <Reveal delay={0.05}><h2 className="lp-h2">Đặt sân, đăng ký lớp, <span className="lp-em">theo dõi tiến độ.</span></h2></Reveal>
        <Reveal delay={0.1}><p className="lp-sub">Năm việc bạn sẽ làm nhiều nhất — và mỗi việc trông như thế nào trên app. Cuộn để xem.</p></Reveal>
        <div className="lp-feat-layout">
          <div className="lp-feat-steps">
            {STEPS.map((s, i) => <StepBlock key={s.key} step={s} index={i} active={active === i} onActive={setActive} />)}
          </div>
          <div className="lp-feat-sticky">
            <div className="lp-feat-panel">
              <AnimatePresence mode="wait">
                <motion.div key={STEPS[active].key} className="lp-feat-visual" initial={{ opacity: 0, y: 40, scale: 0.96, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, scale: 0.98, filter: 'blur(6px)' }} transition={{ duration: 0.5, ease: EASE }}>
                  {STEPS[active].visual}
                </motion.div>
              </AnimatePresence>
              <div className="lp-feat-dots">{STEPS.map((s, i) => <i key={s.key} className={i === active ? 'on' : ''} />)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepBlock({ step, index, active, onActive }: { step: Step; index: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => { if (inView) onActive(index); }, [inView, index, onActive]);
  return (
    <div ref={ref} className={`lp-feat-step ${active ? 'on' : ''}`}>
      <div className="lp-feat-num">0{index + 1}</div>
      <h3>{step.title}</h3>
      <p>{step.desc}</p>
      <ul>{step.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
      <div className="lp-feat-inline">{step.visual}</div>
    </div>
  );
}

/* ===== Các "màn hình" minh họa — dựng bằng HTML/CSS ===== */
const HOURS = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
const COURTS = [
  { n: 'Cầu lông 1', s: 'F F B B F F C C F F F F F B B F' },
  { n: 'Cầu lông 2', s: 'F F F B B F F F F F F F S S F F' },
  { n: 'Tennis 1', s: 'B B F F F F F F C C C F F F B B' },
  { n: 'Pickleball 1', s: 'F F F F B B F F F F F F F F F B' },
];

function CourtVisual() {
  return (
    <div className="lp-vis">
      <div className="lp-vis-head"><b>Đặt sân · <span style={{ textTransform: 'capitalize' }}>{dayjs().format('dddd DD/MM')}</span></b><span className="lp-chip green">Gói của bạn · giảm 20%</span></div>
      <div className="lp-court">
        <div className="lp-court-row head"><span /> {HOURS.map((h) => <i key={h}>{h}</i>)}</div>
        {COURTS.map((c, r) => (
          <div key={c.n} className="lp-court-row"><span>{c.n}</span>
            {c.s.split(' ').map((st, i) => (
              <motion.i key={i} className={`s-${st}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + r * 0.06 + i * 0.015, duration: 0.35, ease: EASE }} />
            ))}
          </div>
        ))}
      </div>
      <div className="lp-court-legend"><i className="s-F" /> Trống <i className="s-B" /> Đã đặt <i className="s-C" /> Lớp học <i className="s-S" /> Đang chọn</div>
      <motion.div className="lp-vis-foot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div><small>Sân cầu lông 2 · 18:00–20:00</small><b><s>240.000đ</s> 192.000đ</b></div>
        <span className="lp-btn lp-btn-primary sm">Xác nhận đặt sân</span>
      </motion.div>
    </div>
  );
}

function ClassVisual() {
  return (
    <div className="lp-vis">
      <div className="lp-vis-head"><b>🏸 Cầu lông cơ bản K3</b><span className="lp-chip blue">Đang mở</span></div>
      <div className="lp-cls-coach">
        <span className="lp-av" style={{ background: '#16a34a' }}>AD</span>
        <div><b>Nguyễn Anh Duy</b><small>HLV cầu lông cấp 1 · Pickleball</small></div>
        <span className="lp-chip green">Còn 2 chỗ</span>
      </div>
      <div className="lp-cls-cap"><div><small>Sĩ số</small><b>6 / 8</b></div><div className="lp-bar"><motion.i initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }} /></div></div>
      <div className="lp-cls-sched">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
          <motion.div key={d} className={`lp-cls-day ${[0, 2, 4].includes(i) ? 'on' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
            <small>{d}</small>{[0, 2, 4].includes(i) && <b>18:00<br />19:30</b>}
          </motion.div>
        ))}
      </div>
      <motion.div className="lp-vis-note ok" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}><CheckCircleFilled /> Gói All-access của bạn vào được lớp này — không tính thêm phí</motion.div>
    </div>
  );
}

function ProgressVisual() {
  const pts = [[0, 70], [1, 62], [2, 58], [3, 50], [4, 44], [5, 40], [6, 30], [7, 22]];
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${20 + x * 40} ${y}`).join(' ');
  return (
    <div className="lp-vis">
      <div className="lp-vis-head"><b>Tiến độ · Nguyễn Văn Dũng</b><span className="lp-chip orange">🏆 PR mới: Squat 40kg</span></div>
      <svg viewBox="0 0 320 90" className="lp-chart">
        <defs><linearGradient id="lpg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0f4d34" stopOpacity=".35" /><stop offset="1" stopColor="#0f4d34" stopOpacity="0" /></linearGradient></defs>
        {[20, 40, 60].map((y) => <line key={y} x1="10" x2="310" y1={y} y2={y} stroke="#e6eaf2" strokeDasharray="3 3" />)}
        <motion.path d={`${d} L 300 90 L 20 90 Z`} fill="url(#lpg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />
        <motion.path d={d} fill="none" stroke="#0f4d34" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: EASE, delay: 0.2 }} />
        {pts.map(([x, y], i) => <motion.circle key={i} cx={20 + x * 40} cy={y} r="4" fill="#fff" stroke="#0f4d34" strokeWidth="2.5" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.15 }} />)}
      </svg>
      <div className="lp-metrics">
        {[['Squat', '40 kg', '+2.5'], ['Plank', '80 s', '+10'], ['Chạy 3km', '17.8 phút', '−0.4'], ['RPE', '7 / 10', '']].map(([n, v, dlt], i) => (
          <motion.div key={n} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }}><small>{n}</small><b>{v}</b>{dlt && <em>{dlt}</em>}</motion.div>
        ))}
      </div>
    </div>
  );
}

function AiVisual() {
  const plan = ['T2 · Squat 4×8 @ 40kg', 'T4 · Bench 4×6 + core', 'T6 · Chạy interval 6×400m', 'CN · Yoga phục hồi 30′'];
  return (
    <div className="lp-vis">
      <div className="lp-vis-head"><b><RobotOutlined /> Trợ lý AI</b><span className="lp-chip purple">Gym · Trung cấp</span></div>
      <div className="lp-chat">
        <motion.div className="lp-msg me" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>Tuần này mình nên tập gì để cải thiện squat?</motion.div>
        <motion.div className="lp-msg ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          Dựa trên PR 40kg và RPE 7 buổi trước, mình đề xuất kế hoạch 4 buổi:
          <ul>{plan.map((p, i) => <motion.li key={p} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.15 }}>{p}</motion.li>)}</ul>
        </motion.div>
        <motion.div className="lp-vis-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>HLV Lê Văn An đã duyệt · <b>Thêm vào lịch tuần</b></motion.div>
      </div>
    </div>
  );
}

function InvoiceVisual() {
  return (
    <div className="lp-vis lp-inv">
      <div className="lp-inv-head"><div><b>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</b><small>Mẫu số 1/001 · Ký hiệu C26TSC · Số 0001284</small></div><div className="lp-qr" /></div>
      <div className="lp-inv-meta"><span>Mã CQT: <b>M1-26-TSC-00001284</b></span><span>Ngày {dayjs().format('DD/MM/YYYY')}</span></div>
      <table>
        <thead><tr><th>Nội dung</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
        <tbody>
          {[['Gói All-access 3 tháng', 1, 1650000], ['Thuê sân cầu lông 2 (2h)', 2, 96000]].map(([n, q, p], i) => (
            <motion.tr key={String(n)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.15 }}><td>{n}</td><td>{q}</td><td>{Number(p).toLocaleString('vi-VN')}</td><td>{(Number(p) * Number(q)).toLocaleString('vi-VN')}</td></motion.tr>
          ))}
        </tbody>
      </table>
      <motion.div className="lp-inv-total" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div><small>Thuế GTGT 8%</small><b>147.360</b></div>
        <div><small>Tổng thanh toán</small><b className="big">1.989.360đ</b></div>
      </motion.div>
      <motion.div className="lp-inv-words" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>Bằng chữ: <i>Một triệu chín trăm tám mươi chín nghìn ba trăm sáu mươi đồng</i></motion.div>
    </div>
  );
}
