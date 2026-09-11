import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { MANIFESTO, SPORTS, STATS, type Sport } from './content';
import { Counter, Item, Reveal, Stagger } from './ui';

/* ===== Số liệu đếm lên ===== */
export function Stats() {
  return (
    <section className="lp-stats">
      <div className="lp-container">
        <Stagger className="lp-stats-grid">
          {STATS.map((s) => (
            <Item key={s.label} className="lp-stat">
              <div className="lp-stat-v"><Counter to={s.value} /></div>
              <div className="lp-stat-l">{s.label}</div>
              <div className="lp-stat-h">{s.hint}</div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ===== Đoạn văn "sáng dần" theo cuộn + ảnh lộ dần ===== */
export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = MANIFESTO.text.split(' ');
  const clip = useTransform(scrollYProgress, [0, 0.6], ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  return (
    <section className="lp-manifesto">
      <div className="lp-container lp-manifesto-grid" ref={ref}>
        <p className="lp-manifesto-text">
          {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}
        </p>
        <motion.figure className="lp-manifesto-fig" style={{ clipPath: clip }}>
          <motion.img src={MANIFESTO.image} alt="" style={{ scale: imgScale }} />
          <figcaption>{MANIFESTO.caption}</figcaption>
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
export function Sports() {
  return (
    <section className="lp-section" id="sports">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Bộ môn</span></Reveal>
        <Reveal delay={0.05}><h2 className="lp-h2">Chọn môn của bạn. <span className="lp-em">Hoặc thử hết.</span></h2></Reveal>
        <Reveal delay={0.1}><p className="lp-sub">Từ gym đến bơi, từ cầu lông đến pickleball — {SPORTS.length} bộ môn, mỗi môn có sân riêng, HLV riêng và lịch riêng. Một thẻ thành viên là chơi được tất cả.</p></Reveal>
        <Stagger className="lp-bento" amount={0.1}>
          {SPORTS.map((s, i) => <Item key={s.id} className={`lp-bento-cell ${s.span ?? ''}`}><SportCard sport={s} index={i} /></Item>)}
        </Stagger>
      </div>
    </section>
  );
}

function SportCard({ sport, index }: { sport: Sport; index: number }) {
  const isCourt = sport.kind === 'COURT';
  return (
    <div className="lp-sport">
      <img className="lp-sport-img" src={sport.image} alt={sport.name} loading="lazy" />
      <div className="lp-sport-shade" />
      <span className="lp-sport-idx">{String(index + 1).padStart(2, '0')}</span>
      <span className="lp-sport-type">{isCourt ? 'Thuê theo giờ' : 'Theo lớp'}</span>
      <div className="lp-sport-body">
        <div className="lp-sport-name">{sport.name}</div>
        <div className="lp-sport-desc">{sport.description}</div>
        <div className="lp-sport-meta">
          <span>{sport.venues} {isCourt ? 'sân' : 'phòng'}{isCourt && sport.fromPrice ? ` · từ ${sport.fromPrice / 1000}k/giờ` : ''}</span>
          {sport.classes > 0 && <span>{sport.classes} lớp đang mở</span>}
          {sport.coaches > 0 && <span>{sport.coaches} HLV</span>}
        </div>
      </div>
    </div>
  );
}
