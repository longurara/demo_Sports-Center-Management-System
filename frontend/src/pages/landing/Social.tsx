import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRightOutlined, CheckOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { initialData } from '../../mock/data';
import ctaImg from '../../assets/sports/tennis.jpg';
import { Item, Reveal, SplitWords, Stagger } from './ui';

/* ===== Bảng giá ===== */
const FEATURED = ['p1', 'p3', 'p5'];
const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';
/** Tách chuỗi quyền lợi theo dấu phẩy (bỏ qua dấu phẩy trong ngoặc); bỏ dòng "giảm % thuê sân" vì đã hiển thị riêng. */
const benefitsOf = (text: string) => text.split(/,(?![^(]*\))/).map((b) => b.trim()).filter((b) => b && !/thuê sân/i.test(b)).map((b) => b.charAt(0).toUpperCase() + b.slice(1));

export function Pricing() {
  const plans = FEATURED.map((id) => initialData.plans.find((p) => p.id === id)!);
  // Gói "được chọn nhiều nhất" tính theo số đăng ký trong mock data — trùng với trang Gói thành viên trong app.
  const count = (id: string) => initialData.subscriptions.filter((s) => s.planId === id).length;
  const hotId = plans.reduce((best, p) => (count(p.id) > count(best.id) ? p : best), plans[1]).id;
  const sportName = (ids: string[]) => ids.length === 0 ? 'Mọi bộ môn' : ids.map((id) => initialData.sports.find((s) => s.id === id)?.name).join(', ');
  const courts = initialData.rooms.filter((r) => r.type === 'COURT');
  const minRate = Math.min(...courts.map((c) => c.hourlyRate ?? Infinity));
  return (
    <section className="lp-section" id="pricing">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Bảng giá</span></Reveal>
        <SplitWords as="h2" onView className="lp-h2" text="Gói theo môn hoặc All-access" em="All-access" />
        <Reveal delay={0.1}><p className="lp-sub">Không có gói vẫn thuê sân được — từ {money(minRate)}/giờ. Có gói thì được giảm giá sân, mức giảm tăng theo thời hạn gói.</p></Reveal>
        <Stagger className="lp-pricing">
          {plans.map((p) => (
            <Item key={p.id}>
              <div className={`lp-plan ${p.id === hotId ? 'hot' : ''}`}>
                {p.id === hotId && <span className="lp-plan-badge">Được chọn nhiều nhất</span>}
                <div className="lp-plan-name">{p.name}</div>
                <div className="lp-plan-scope">{sportName(p.sportIds)} · {p.durationDays} ngày</div>
                <div className="lp-plan-price">{money(p.price)}<small>/{p.durationDays >= 365 ? 'năm' : p.durationDays >= 90 ? `${p.durationDays / 30} tháng` : 'tháng'}</small></div>
                <ul>
                  {benefitsOf(p.benefits).map((b) => <li key={b}><CheckOutlined /> {b}</li>)}
                  {p.courtDiscount > 0 && <li className="hl"><CheckOutlined /> Giảm {p.courtDiscount}% giá thuê sân</li>}
                </ul>
                <Link to="/register" className={`lp-btn ${p.id === hotId ? 'lp-btn-primary' : 'lp-btn-ghost'}`} style={{ width: '100%' }}>Đăng ký gói này</Link>
              </div>
            </Item>
          ))}
        </Stagger>
        <Reveal delay={0.2}><p className="lp-pricing-more">Còn {initialData.plans.filter((p) => p.active).length - 3} gói khác (Bơi 1 tháng, Yoga & Zumba 3 tháng, All-access 1 & 6 tháng) — <Link to="/login">đăng nhập để xem đầy đủ</Link>.</p></Reveal>
      </div>
    </section>
  );
}

/* ===== Giờ mở cửa & liên hệ ===== */
const HOURS = [
  { n: 'Sân cầu lông · tennis · pickleball', t: '06:00 – 22:00', d: 'Hằng ngày · khung 1 giờ' },
  { n: 'Sân bóng rổ · bóng đá mini', t: '06:00 – 22:00', d: 'Hằng ngày · đặt tối thiểu 1 giờ' },
  { n: 'Hồ bơi', t: '06:00 – 21:00', d: 'Nghỉ vệ sinh hồ 13:00 – 14:00' },
  { n: 'Phòng gym', t: '06:00 – 22:00', d: 'Hằng ngày, kể cả lễ' },
  { n: 'Phòng Yoga · Zumba · Boxing', t: 'Theo lịch lớp', d: 'Xem lịch tuần sau khi đăng nhập' },
  { n: 'Quầy tiếp đón', t: '06:00 – 22:00', d: 'Đăng ký, gia hạn gói, thanh toán tại chỗ' },
];

export function Info() {
  return (
    <section className="lp-section lp-info" id="info">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Giờ mở cửa & liên hệ</span></Reveal>
        <SplitWords as="h2" onView className="lp-h2" text="Mở cửa từ 6 giờ sáng" />
        <div className="lp-info-grid">
          <Stagger className="lp-hours">
            {HOURS.map((h) => <Item key={h.n} className="lp-hours-row"><b>{h.n}</b><span>{h.t}</span><em>{h.d}</em></Item>)}
          </Stagger>
          <Reveal delay={0.15} className="lp-contact">
            <dl>
              <dt>Địa chỉ</dt><dd>Nhà thi đấu A & B, khu sân ngoài trời và tòa nhà 3 tầng (gym tầng 1, yoga & boxing tầng 2, zumba tầng 3). Hồ bơi ở tầng hầm.</dd>
              <dt>Điện thoại</dt><dd>0901 000 002</dd>
              <dt>Email</dt><dd>hello@sc.vn</dd>
              <dt>Gửi xe</dt><dd>Miễn phí cho thành viên có gói; khách thuê sân 5.000đ/lượt.</dd>
            </dl>
            <Link to="/login" className="lp-btn lp-btn-ink">Xem lịch sân hôm nay <ArrowRightOutlined /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ===== CTA cuối trang ===== */
export function Cta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '0%']);
  return (
    <section ref={ref} className="lp-cta-wrap">
      <motion.div className="lp-cta" style={{ scale, borderRadius: radius }}>
        <motion.img className="lp-cta-img" src={ctaImg} alt="" style={{ y: imgY }} />
        <div className="lp-grain" />
        <div className="lp-container">
          <SplitWords as="h2" onView className="lp-cta-title" text="Tối nay sân còn trống?" em="sân còn trống?" />
          <Reveal delay={0.1}><p className="lp-lead">Đăng nhập, chọn sân, chọn giờ. Hệ thống báo ngay nếu trùng lớp hoặc đã có người đặt.</p></Reveal>
          <Reveal delay={0.2}>
            <div className="lp-hero-actions">
              <Link to="/login" className="lp-btn lp-btn-primary lg">Đặt sân <ArrowRightOutlined /></Link>
              <Link to="/register" className="lp-btn lp-btn-ghost light lg">Đăng ký thành viên</Link>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

/* ===== Footer ===== */
export function Footer() {
  const cols = [
    { t: 'Trang', l: [['Bộ môn', '#sports'], ['Đặt sân & lớp học', '#features'], ['Quyền lợi thành viên', '#benefits'], ['Bảng giá', '#pricing'], ['Giờ mở cửa', '#info']] },
    { t: 'Tài khoản', l: [['Đăng nhập', '/login'], ['Đăng ký thành viên', '/register'], ['Quên mật khẩu', '/forgot-password']] },
    { t: 'Dự án', l: [['SWP391 · FA26', ''], ['React + Vite + Ant Design', ''], ['Dữ liệu giả lập trong trình duyệt', '']] },
  ];
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-grid">
        <div>
          <Link to="/" className="lp-brand"><span className="lp-brand-logo"><ThunderboltFilled /></span>Sports Center</Link>
          <p>Không chỉ là một phòng gym. Chơi hết mình, mỗi ngày — 10 bộ môn dưới một mái nhà, mở cửa từ 6 giờ sáng.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}><b>{c.t}</b>{c.l.map(([l, h]) => !h ? <span key={l}>{l}</span> : h.startsWith('/') ? <Link key={l} to={h}>{l}</Link> : <a key={l} href={h}>{l}</a>)}</div>
        ))}
      </div>
      <div className="lp-container lp-footer-bottom"><span>© 2026 Sports Center Management System</span><span>SWP391 · FA26</span></div>
      <div className="lp-footer-mark" aria-hidden>Sports Center</div>
    </footer>
  );
}
