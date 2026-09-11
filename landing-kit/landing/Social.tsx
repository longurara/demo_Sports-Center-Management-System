import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRightOutlined, CheckOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useLanding } from './config';
import { BRAND_NAME, CONTACT, COURT_FROM_PRICE, CTA, FOOTER, HOURS, PLANS, PRICING_NOTE } from './content';
import { Item, Magnetic, Reveal, SplitWords, Stagger } from './ui';

const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const per = (days: number) => days >= 365 ? 'năm' : days >= 90 ? `${days / 30} tháng` : 'tháng';

/* ===== Bảng giá ===== */
export function Pricing() {
  const { Link, links } = useLanding();
  return (
    <section className="lp-section" id="pricing">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Bảng giá</span></Reveal>
        <SplitWords as="h2" onView className="lp-h2" text="Gói theo môn hoặc All-access" em="All-access" />
        <Reveal delay={0.1}><p className="lp-sub">Không có gói vẫn thuê sân được — từ {money(COURT_FROM_PRICE)}/giờ. Có gói thì được giảm giá sân, mức giảm tăng theo thời hạn gói.</p></Reveal>
        <Stagger className="lp-pricing">
          {PLANS.map((p) => (
            <Item key={p.id}>
              <div className={`lp-plan ${p.hot ? 'hot' : ''}`}>
                {p.hot && <span className="lp-plan-badge">Được chọn nhiều nhất</span>}
                <div className="lp-plan-name">{p.name}</div>
                <div className="lp-plan-scope">{p.scope} · {p.days} ngày</div>
                <div className="lp-plan-price">{money(p.price)}<small>/{per(p.days)}</small></div>
                <ul>
                  {p.benefits.map((b) => <li key={b}><CheckOutlined /> {b}</li>)}
                  {p.courtDiscount > 0 && <li className="hl"><CheckOutlined /> Giảm {p.courtDiscount}% giá thuê sân</li>}
                </ul>
                <Link to={links.register} className={`lp-btn ${p.hot ? 'lp-btn-primary' : 'lp-btn-ghost'}`} style={{ width: '100%' }}>Đăng ký gói này</Link>
              </div>
            </Item>
          ))}
        </Stagger>
        <Reveal delay={0.2}><p className="lp-pricing-more">{PRICING_NOTE} — <Link to={links.login}>đăng nhập để xem đầy đủ</Link>.</p></Reveal>
      </div>
    </section>
  );
}

/* ===== Giờ mở cửa & liên hệ ===== */
export function Info() {
  const { Link, links } = useLanding();
  return (
    <section className="lp-section lp-info" id="info">
      <div className="lp-container">
        <Reveal><span className="lp-eyebrow">Giờ mở cửa & liên hệ</span></Reveal>
        <SplitWords as="h2" onView className="lp-h2" text="Mở cửa từ 6 giờ sáng" />
        <div className="lp-info-grid">
          <Stagger className="lp-hours">
            {HOURS.map((h) => <Item key={h.name} className="lp-hours-row"><b>{h.name}</b><span>{h.time}</span><em>{h.note}</em></Item>)}
          </Stagger>
          <Reveal delay={0.15} className="lp-contact">
            <dl>
              <dt>Địa chỉ</dt><dd>{CONTACT.address}</dd>
              <dt>Điện thoại</dt><dd>{CONTACT.phone}</dd>
              <dt>Email</dt><dd>{CONTACT.email}</dd>
              <dt>Gửi xe</dt><dd>{CONTACT.parking}</dd>
            </dl>
            <Link to={links.login} className="lp-btn lp-btn-ink">Xem lịch sân hôm nay <ArrowRightOutlined /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ===== CTA cuối trang ===== */
export function Cta() {
  const { Link, links } = useLanding();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '0%']);
  return (
    <section ref={ref} className="lp-cta-wrap">
      <motion.div className="lp-cta" style={{ scale, borderRadius: radius }}>
        <motion.img className="lp-cta-img" src={CTA.image} alt="" style={{ y: imgY }} />
        <div className="lp-grain" />
        <div className="lp-container">
          <SplitWords as="h2" onView className="lp-cta-title" text={`${CTA.title} ${CTA.titleEm}`} em={CTA.titleEm} />
          <Reveal delay={0.1}><p className="lp-lead">{CTA.lead}</p></Reveal>
          <Reveal delay={0.2}>
            <div className="lp-hero-actions">
              <Magnetic><Link to={links.login} className="lp-btn lp-btn-primary lg">Đặt sân <ArrowRightOutlined /></Link></Magnetic>
              <Magnetic strength={0.18}><Link to={links.register} className="lp-btn lp-btn-ghost light lg">Đăng ký thành viên</Link></Magnetic>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

/* ===== Footer ===== */
export function Footer() {
  const { Link, links } = useLanding();
  const cols = [
    { t: 'Trang', l: [['Bộ môn', '#sports'], ['Đặt sân & lớp học', '#features'], ['Quyền lợi thành viên', '#benefits'], ['Bảng giá', '#pricing'], ['Giờ mở cửa', '#info']] },
    { t: 'Tài khoản', l: [['Đăng nhập', links.login], ['Đăng ký thành viên', links.register], ['Quên mật khẩu', links.forgot]] },
    { t: 'Cơ sở', l: FOOTER.extra.map(([l]) => [l, '']) },
  ];
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-grid">
        <div>
          <Link to="/" className="lp-brand"><span className="lp-brand-logo"><ThunderboltFilled /></span>{BRAND_NAME}</Link>
          <p>{FOOTER.blurb}</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}><b>{c.t}</b>{c.l.map(([l, h]) => !h ? <span key={l}>{l}</span> : h.startsWith('#') ? <a key={l} href={h}>{l}</a> : <Link key={l} to={h}>{l}</Link>)}</div>
        ))}
      </div>
      <div className="lp-container lp-footer-bottom"><span>{FOOTER.copyright}</span><span>{CONTACT.phone} · {CONTACT.email}</span></div>
      <div className="lp-footer-mark" aria-hidden>{BRAND_NAME}</div>
    </footer>
  );
}
