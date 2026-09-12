import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useLanding } from './config';
import { BRAND_NAME, HERO, SPORTS } from './content';
import { EASE, Marquee, Reveal, SplitWords } from './ui';

export default function Hero() {
  const { Link, links } = useLanding();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Ảnh nền trôi chậm hơn nội dung (parallax), chữ mờ dần khi cuộn qua.
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  // Hero được "ghim" lại, phần sau cuộn đè lên: hero thu nhỏ, bo góc và tối dần như một tấm card lùi ra sau.
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroRadius = useTransform(scrollYProgress, [0, 1], [0, 32]);
  const heroDim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);

  // Hero có thể cao hơn màn hình (màn nhỏ): ghim theo ĐÁY thay vì đỉnh để phần dưới vẫn lộ ra khi cuộn.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const pin = el.parentElement!; // .lp-pin — wrapper sticky, cao đúng bằng hero
    const fit = () => { pin.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  return (
    <motion.section ref={ref} className="lp-hero" style={{ scale: heroScale, borderRadius: heroRadius }}>
        <motion.img className="lp-hero-img" src={HERO.image} alt="" style={{ y: imgY }} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: EASE }} />
        <div className="lp-hero-shade" />
        <div className="lp-grain" />
        <motion.div className="lp-hero-dim" style={{ opacity: heroDim }} />
        <motion.div className="lp-container lp-hero-content" style={{ y: textY, opacity: textOpacity }}>
          <motion.p className="lp-kicker" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE }}><i /> {HERO.kicker}</motion.p>
          <SplitWords className="lp-h1" text={HERO.title} delay={0.15} />
          <motion.p className="lp-lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: EASE }}>{HERO.lead}</motion.p>
          <motion.div className="lp-hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85, ease: EASE }}>
            <Link to={links.register} className="lp-btn lp-btn-primary lg">Đăng ký tập thử miễn phí <ArrowRightOutlined /></Link>
            <Link to={links.login} className="lp-btn lp-btn-ghost light lg">Đặt sân</Link>
          </motion.div>
        </motion.div>
        <motion.div className="lp-hero-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }}>
          <div className="lp-container">
            {HERO.facts.map((f) => <div key={f.title} className="lp-fact"><b>{f.title.replace('{month}', dayjs().format('M'))}</b>{f.desc}</div>)}
          </div>
        </motion.div>
    </motion.section>
  );
}

/** Dải tên bộ môn chạy ngang, nằm ngay dưới hero. */
export function Ticker() {
  return (
    <div className="lp-ticker">
      <Marquee speed={40}>
        {SPORTS.map((s) => <span key={s.id} className="lp-marquee-item">{s.name}<i /></span>)}
      </Marquee>
    </div>
  );
}

/** Khối giới thiệu ứng dụng thành viên: mockup "dựng" từ nghiêng 3D lên khi cuộn tới. */
export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  return (
    <section className="lp-showcase">
      <div className="lp-grain" />
      <div className="lp-container lp-showcase-head">
        <div>
          <Reveal><span className="lp-eyebrow light">Tài khoản thành viên</span></Reveal>
          <SplitWords as="h2" onView className="lp-h2 light" text="Mọi thứ trong điện thoại của bạn." em="trong điện thoại của bạn." />
        </div>
        <Reveal delay={0.1}>
          <p>Đặt sân lúc 11 giờ đêm cho sáng mai. Xem còn bao nhiêu ngày gói. Biết hôm nay có lớp gì, HLV nào, phòng nào. Không cần gọi điện hỏi.</p>
          <div className="lp-showcase-points"><span>Đặt sân 24/7</span><span>Lịch tập cá nhân</span><span>Kết quả từng buổi</span></div>
        </Reveal>
      </div>
      <div ref={ref} className="lp-hero-stage">
        <motion.div className="lp-mock-wrap" style={{ rotateX, scale, opacity }}><Mockup /></motion.div>
      </div>
    </section>
  );
}

/** Mockup trang chủ thành viên — dựng bằng HTML/CSS theo bố cục app (sidebar mực, logo vàng chanh, nền giấy). */
function Mockup() {
  const week = [
    { d: 'T2', items: [['06:30', 'Gym cơ bản K12', '#0f4d34']] },
    { d: 'T3', items: [] },
    { d: 'T4', items: [['06:30', 'Gym cơ bản K12', '#0f4d34'], ['18:00', 'Sân cầu lông 2', '#16a34a']] },
    { d: 'T5', items: [['19:00', 'Yoga tối', '#7c5cbf']] },
    { d: 'T6', items: [['06:30', 'Gym cơ bản K12', '#0f4d34'], ['18:00', 'Sân cầu lông 2', '#16a34a']] },
    { d: 'T7', items: [['09:00', 'Bơi tự do', '#0891b2']] },
    { d: 'CN', items: [] },
  ];
  const nav = [['Trang chủ', true], ['Gói thành viên', false], ['Lớp học', false], ['Đặt sân', false], ['Lịch tập của tôi', false], ['Kết quả & tiến độ', false]] as const;
  const hours = Array.from({ length: 16 }, (_, i) => String(6 + i).padStart(2, '0'));
  const today = (dayjs().day() + 6) % 7; // 0 = Thứ Hai
  return (
    <div className="lp-mock">
      <div className="lp-mock-body">
        <aside className="lp-mock-side">
          <div className="lp-mock-brand"><i /><div><b>{BRAND_NAME}</b><small>Management System</small></div></div>
          <div className="lp-mock-role"><i />Thành viên<span>{dayjs().format('dd, DD/MM')}</span></div>
          {nav.map(([label, on]) => <div key={label} className={`lp-mock-nav ${on ? 'on' : ''}`}><i /><span>{label}</span></div>)}
          <div className="lp-mock-user"><i>HD</i><div><b>Hoàng Thị Dung</b><small>member.dung@gmail.com</small></div></div>
        </aside>
        <div className="lp-mock-main">
          <div className="lp-mock-top"><span className="lp-mock-search">Tìm thành viên, lớp học, hóa đơn…<kbd>Ctrl K</kbd></span><span className="lp-mock-bell" /><span className="lp-mock-me"><i>HD</i>Hoàng Thị Dung</span></div>
          <div className="lp-mock-head"><b>Xin chào, Dung 👋</b><span style={{ textTransform: 'capitalize' }}>{dayjs().format('dddd, DD/MM/YYYY')}</span></div>
          <div className="lp-mock-stats">
            {[['Gói của bạn', 'All-access 3 tháng', '#0f4d34', 'Còn 47 ngày · giảm 25% sân'], ['Buổi tập tháng này', '12', '#16a34a', '+3 so với tháng trước'], ['Kỷ lục mới', 'Squat 40 kg', '#7c5cbf', 'Tuần trước: 37,5 kg'], ['Sân đã đặt', 'Tối nay 18:00', '#c94a1e', 'Sân cầu lông 2 · 2 giờ']].map(([t, v, c, h]) => (
              <div key={t} className="lp-mock-stat"><i style={{ background: `color-mix(in srgb, ${c} 12%, #fff)`, color: c }} /><div><small>{t}</small><b>{v}</b><em>{h}</em></div></div>
            ))}
          </div>
          <div className="lp-mock-row">
            <div className="lp-mock-card">
              <div className="lp-mock-card-h">Lịch tập tuần này<span>Xem lịch đầy đủ →</span></div>
              <div className="lp-mock-week">
                {week.map((w, i) => (
                  <motion.div key={w.d} className={`lp-mock-day ${i === today ? 'today' : ''}`} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06, ease: EASE }}>
                    <b>{w.d}</b>
                    {w.items.map(([t, n, c]) => <span key={n} style={{ borderLeftColor: c }}><i>{t}</i>{n}</span>)}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-h">Đặt sân nhanh<span>Sân cầu lông 1 · hôm nay</span></div>
              <div className="lp-mock-slots">
                {hours.map((h, i) => (
                  <motion.b key={h} className={[2, 3, 7, 12, 13].includes(i) ? 'bk' : [8, 9].includes(i) ? 'cl' : ''} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.03 }}>{h}</motion.b>
                ))}
              </div>
              <div className="lp-mock-legend"><i className="f" /> Trống <i className="b" /> Đã có người <i className="c" /> Lớp học</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
