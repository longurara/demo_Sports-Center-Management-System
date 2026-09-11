import { useEffect } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'motion/react';
import './landing.css';
import Nav from './Nav';
import Hero, { Showcase } from './Hero';
import { Manifesto, Sports, Stats } from './Sections';
import Features from './Features';
import Benefits from './Benefits';
import { Cta, Footer, Info, Pricing } from './Social';

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  // Smooth scroll (Lenis) chỉ bật trên landing; huỷ khi rời trang để không ảnh hưởng app.
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -72 }, autoRaf: true });
    document.documentElement.classList.add('lp-html');
    const prevTitle = document.title;
    document.title = 'Sports Center — Sân & phòng tập 10 bộ môn';
    return () => { lenis.destroy(); document.documentElement.classList.remove('lp-html'); document.title = prevTitle; };
  }, []);

  return (
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
  );
}
