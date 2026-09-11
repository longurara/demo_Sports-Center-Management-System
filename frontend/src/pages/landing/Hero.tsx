import { useRef } from 'react';
import dayjs from 'dayjs';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { initialData } from '../../mock/data';
import fallbackImg from '../../assets/sports/badminton.jpg';
import { EASE, Marquee, Reveal, SplitWords } from './ui';

// Ảnh hero tùy chọn: thả file `src/assets/hero-gym.jpg|png|webp` vào là tự dùng, không có thì lấy ảnh cầu lông.
const custom = import.meta.glob<string>('../../assets/hero-gym.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const heroImg = Object.values(custom)[0] ?? fallbackImg;

const SPORTS = initialData.sports;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Ảnh nền trôi chậm hơn nội dung (parallax), chữ mờ dần khi cuộn qua.
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <>
      <section ref={ref} className="lp-hero">
        <motion.img className="lp-hero-img" src={heroImg} alt="" style={{ y: imgY }} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: EASE }} />
        <div className="lp-hero-shade" />
        <motion.div className="lp-container lp-hero-content" style={{ y: textY, opacity: textOpacity }}>
          <motion.p className="lp-kicker" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE }}><i /> Trung tâm thể thao đa môn · Mở cửa 06:00 – 22:00, 7 ngày/tuần</motion.p>
          <SplitWords className="lp-h1" text="Chơi hết mình, mỗi ngày." delay={0.15} />
          <motion.p className="lp-lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: EASE }}>
            Gym, yoga, bơi, boxing, cầu lông, tennis, pickleball, bóng rổ, bóng đá — 10 bộ môn dưới một mái nhà. Buổi đầu tiên miễn phí, đặt sân online chỉ mất 30 giây.
          </motion.p>
          <motion.div className="lp-hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85, ease: EASE }}>
            <Link to="/register" className="lp-btn lp-btn-primary lg">Đăng ký tập thử miễn phí <ArrowRightOutlined /></Link>
            <Link to="/login" className="lp-btn lp-btn-ghost light lg">Đặt sân</Link>
          </motion.div>
        </motion.div>
        <motion.div className="lp-hero-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }}>
          <div className="lp-container">
            <div className="lp-fact"><b>Tập thử miễn phí</b>Buổi đầu tiên ở bất kỳ bộ môn nào, không cần mua gói trước</div>
            <div className="lp-fact"><b>15 sân & phòng tập</b>Sân thuê theo giờ, phòng tập theo lớp với HLV có chứng chỉ, hồ bơi</div>
            <div className="lp-fact"><b>Ưu đãi tháng {dayjs().format('M')}</b>Mua gói All-access 1 năm tặng thêm 1 tháng và 2 buổi PT</div>
          </div>
        </motion.div>
      </section>
      <div className="lp-ticker">
        <Marquee speed={40}>
          {SPORTS.map((s) => <span key={s.id} className="lp-marquee-item">{s.name}<i /></span>)}
        </Marquee>
      </div>
    </>
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
      <div className="lp-container lp-showcase-head">
        <div>
          <Reveal><span className="lp-eyebrow light">Tài khoản thành viên</span></Reveal>
          <Reveal delay={0.05}><h2 className="lp-h2 light">Mọi thứ <span className="lp-em">trong điện thoại của bạn.</span></h2></Reveal>
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

/** Mockup trang chủ thành viên, dựng bằng HTML/CSS thuần (không dùng ảnh). */
function Mockup() {
  const week = [
    { d: 'T2', items: [['06:30', 'Gym cơ bản', '#2563eb']] },
    { d: 'T3', items: [] },
    { d: 'T4', items: [['06:30', 'Gym cơ bản', '#2563eb'], ['18:00', 'Sân cầu lông 2', '#16a34a']] },
    { d: 'T5', items: [['19:00', 'Yoga tối', '#9333ea']] },
    { d: 'T6', items: [['06:30', 'Gym cơ bản', '#2563eb'], ['18:00', 'Sân cầu lông 2', '#16a34a']] },
    { d: 'T7', items: [['09:00', 'Bơi tự do', '#0891b2']] },
    { d: 'CN', items: [] },
  ];
  const hours = Array.from({ length: 16 }, (_, i) => String(6 + i).padStart(2, '0'));
  const today = (dayjs().day() + 6) % 7; // 0 = Thứ Hai
  return (
    <div className="lp-mock">
      <div className="lp-mock-bar"><i /><i /><i /><span>sportscenter.vn / member</span></div>
      <div className="lp-mock-body">
        <aside className="lp-mock-side">
          <div className="lp-mock-logo" />
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className={`lp-mock-nav ${i === 1 ? 'on' : ''}`} />)}
        </aside>
        <div className="lp-mock-main">
          <div className="lp-mock-head"><b>Xin chào, Dũng</b><span style={{ textTransform: 'capitalize' }}>{dayjs().format('dddd, DD/MM/YYYY')}</span></div>
          <div className="lp-mock-stats">
            {[['Gói của bạn', 'All-access 3 tháng', '#2563eb', 'Còn 47 ngày · giảm 25% sân'], ['Buổi tập tháng này', '12', '#16a34a', '+3 so với tháng trước'], ['Kỷ lục mới', 'Squat 40 kg', '#9333ea', 'Tuần trước: 37,5 kg'], ['Sân đã đặt', 'Tối nay 18:00', '#f97316', 'Sân cầu lông 2 · 2 giờ']].map(([t, v, c, h]) => (
              <div key={t} className="lp-mock-stat"><i style={{ background: c }} /><div><small>{t}</small><b>{v}</b><em>{h}</em></div></div>
            ))}
          </div>
          <div className="lp-mock-row">
            <div className="lp-mock-card">
              <small>Lịch tuần của bạn</small>
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
              <small>Đặt sân nhanh — Sân cầu lông 1 · hôm nay</small>
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
