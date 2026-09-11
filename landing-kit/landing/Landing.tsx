import { useEffect } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'motion/react';
import './landing.css';
import { DEFAULT_CONFIG, LandingConfigProvider, type LandingConfig } from './config';
import Nav from './Nav';
import Hero, { Showcase } from './Hero';
import { Manifesto, Sports, Stats } from './Sections';
import Features from './Features';
import Benefits from './Benefits';
import { Cta, Footer, Info, Pricing } from './Social';

export type LandingProps = Partial<LandingConfig> & { title?: string };

/**
 * Landing page tự chứa. Truyền `Link` của router đang dùng, đường dẫn login/register và user hiện tại (nếu có).
 *   <Landing Link={RouterLink} links={{ login: '/login', register: '/register', forgot: '/forgot' }} user={me ? { dashboardHref: '/member' } : null} />
 */
export default function Landing({ title = 'Sports Center — Sân & phòng tập 10 bộ môn', ...cfg }: LandingProps) {
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  // Smooth scroll (Lenis) chỉ bật khi landing mount; huỷ khi rời trang để không ảnh hưởng phần còn lại của app.
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -72 }, autoRaf: true });
    document.documentElement.classList.add('lp-html');
    const prevTitle = document.title;
    document.title = title;
    return () => { lenis.destroy(); document.documentElement.classList.remove('lp-html'); document.title = prevTitle; };
  }, [title]);

  return (
    <LandingConfigProvider value={{ ...DEFAULT_CONFIG, ...cfg, links: { ...DEFAULT_CONFIG.links, ...cfg.links } }}>
      <div className="lp">
        <motion.div className="lp-progress" style={{ scaleX: bar }} />
        <Nav />
        <main>
          <Hero />
          <Stats />
          <Manifesto />
          <Sports />
          <Showcase />
          <Features />
          <Benefits />
          <Pricing />
          <Info />
          <Cta />
        </main>
        <Footer />
      </div>
    </LandingConfigProvider>
  );
}
