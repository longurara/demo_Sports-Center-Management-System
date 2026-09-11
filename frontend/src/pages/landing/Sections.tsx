import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { initialData } from '../../mock/data';
import { Counter, Item, Reveal, Stagger } from './ui';
import { SPORT_IMAGES } from './sportImages';
import poolImg from '../../assets/sports/swim.jpg';

/* ===== Số liệu đếm lên ===== */
// Số liệu lấy thẳng từ mock data để không lệch khi dữ liệu đổi.
const STATS = [
  { v: initialData.sports.length, label: 'Bộ môn', hint: initialData.sports.map((s) => s.name).join(', ') },
  { v: initialData.rooms.filter((r) => r.type === 'COURT').length, label: 'Sân thuê theo giờ', hint: '06:00 – 22:00, khung 1 giờ' },
  { v: initialData.rooms.filter((r) => r.type === 'ROOM').length, label: 'Phòng tập & hồ bơi', hint: 'Học theo lớp, có HLV' },
  { v: initialData.users.filter((u) => u.role === 'COACH' && u.status === 'ACTIVE').length, label: 'Huấn luyện viên', hint: 'Chứng chỉ NASM, RYT-500, ITF… đúng bộ môn' },
];

export function Stats() {
  return (
    <section className="lp-stats">
      <div className="lp-container">
        <Stagger className="lp-stats-grid">
          {STATS.map((s) => (
            <Item key={s.label} className="lp-stat">
              <div className="lp-stat-v"><Counter to={s.v} /></div>
              <div className="lp-stat-l">{s.label}</div>
              <div className="lp-stat-h">{s.hint}</div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ===== Đoạn văn "sáng dần" theo cuộn ===== */
const MANIFESTO = 'Không chỉ là một phòng gym. Là nơi bạn ghé sau giờ làm để đánh một trận cầu lông, sáng cuối tuần để bơi vài vòng, và tối thứ Ba để kịp lớp yoga. Mọi môn bạn thích — dưới một mái nhà.';

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = MANIFESTO.split(' ');
  // Ảnh bên phải "lộ" dần từ dưới lên theo tiến độ cuộn, đồng thời zoom nhẹ.
  const clip = useTransform(scrollYProgress, [0, 0.6], ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  return (
    <section className="lp-manifesto">
      <div className="lp-container lp-manifesto-grid" ref={ref}>
        <p className="lp-manifesto-text">
          {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}
        </p>
        <motion.figure className="lp-manifesto-fig" style={{ clipPath: clip }}>
          <motion.img src={poolImg} alt="Hồ bơi" style={{ scale: imgScale }} />
          <figcaption>Hồ bơi · tầng hầm · 06:00 – 21:00</figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <span className="lp-manifesto-word"><motion.span style={{ opacity }}>{children}</motion.span> </span>;
}

/* ===== Lưới bộ môn (card ảnh) ===== */
const SPAN: Record<string, string> = { sp1: 'big', sp4: 'wide', sp5: 'tall', sp8: 'wide' };

export function Sports() {
  return (
    <section className="lp-section" id="sports">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Bộ môn</span></Reveal>
        <Reveal delay={0.05}><h2 className="lp-h2">Chọn môn của bạn. <span className="lp-em">Hoặc thử hết.</span></h2></Reveal>
        <Reveal delay={0.1}><p className="lp-sub">Từ gym đến bơi, từ cầu lông đến pickleball — 10 bộ môn, mỗi môn có sân riêng, HLV riêng và lịch riêng. Một thẻ thành viên là chơi được tất cả.</p></Reveal>
        <Stagger className="lp-bento" amount={0.1}>
          {initialData.sports.map((s, i) => <Item key={s.id} className={`lp-bento-cell ${SPAN[s.id] ?? ''}`}><SportCard sport={s} index={i} /></Item>)}
        </Stagger>
      </div>
    </section>
  );
}

function SportCard({ sport, index }: { sport: (typeof initialData.sports)[number]; index: number }) {
  const rooms = initialData.rooms.filter((r) => r.sportId === sport.id);
  const classes = initialData.classes.filter((c) => c.sportId === sport.id && c.status === 'OPEN').length;
  const coaches = initialData.users.filter((u) => u.role === 'COACH' && u.sportIds?.includes(sport.id)).length;
  const isCourt = rooms[0]?.type === 'COURT';
  return (
    <div className="lp-sport">
      <img className="lp-sport-img" src={SPORT_IMAGES[sport.id]} alt={sport.name} loading="lazy" />
      <div className="lp-sport-shade" />
      <span className="lp-sport-idx">{String(index + 1).padStart(2, '0')}</span>
      {rooms.length > 0 && <span className="lp-sport-type">{isCourt ? 'Thuê theo giờ' : 'Theo lớp'}</span>}
      <div className="lp-sport-body">
        <div className="lp-sport-name">{sport.name}</div>
        <div className="lp-sport-desc">{sport.description}</div>
        <div className="lp-sport-meta">
          {rooms.length > 0 && <span>{rooms.length} {isCourt ? 'sân' : 'phòng'}{isCourt ? ` · từ ${Math.min(...rooms.map((r) => r.hourlyRate ?? Infinity)) / 1000}k/giờ` : ''}</span>}
          {classes > 0 && <span>{classes} lớp đang mở</span>}
          {coaches > 0 && <span>{coaches} HLV</span>}
        </div>
      </div>
    </div>
  );
}
