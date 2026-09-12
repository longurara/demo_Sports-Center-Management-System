/* eslint-disable react-refresh/only-export-components */
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, type Variants } from 'motion/react';

export const EASE = [0.22, 1, 0.36, 1] as const; // easeOutQuint — "cảm giác" mượt kiểu Apple

/** Fade + trượt lên khi cuộn tới (chạy 1 lần). `delay` tính bằng giây. */
export function Reveal({ children, delay = 0, y = 28, className, style, once = true, amount = 0.3 }: {
  children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties; once?: boolean; amount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className} style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Container stagger: các con dùng `<Item>` sẽ lần lượt hiện. */
const listVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 28, scale: 0.985 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE } } };

export function Stagger({ children, className, style, amount = 0.2 }: { children: ReactNode; className?: string; style?: CSSProperties; amount?: number }) {
  return <motion.div className={className} style={style} variants={listVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>{children}</motion.div>;
}
export function Item({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <motion.div className={className} style={style} variants={itemVariants}>{children}</motion.div>;
}

const wordVariants: Variants = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.9, ease: EASE } } };

/**
 * Tiêu đề hiện từng chữ, mỗi chữ trượt lên từ sau "mặt nạ".
 * `onView` = chỉ chạy khi cuộn tới (dùng cho h2 giữa trang); mặc định chạy ngay khi mount (hero).
 * Cho phép truyền JSX: chữ trong <em> sẽ giữ class nhấn màu.
 */
export function SplitWords({ text, className, delay = 0, as: Tag = 'h1', onView = false, em }: {
  text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'p'; onView?: boolean; em?: string;
}) {
  const words = text.split(' ');
  const MTag = motion[Tag];
  const reduce = useReducedMotion();
  const emStart = em ? text.indexOf(em) : -1;
  // vị trí ký tự bắt đầu mỗi chữ → biết chữ nào nằm trong phần nhấn màu
  const starts = words.reduce<number[]>((acc, _w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + words[i - 1].length + 1], []);
  const anim = onView ? { whileInView: 'show', viewport: { once: true, amount: 0.6 } } : { animate: 'show' };
  return (
    <MTag className={className} initial={reduce ? false : 'hidden'} {...anim} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: delay } } }} aria-label={text}>
      {words.map((w, i) => {
        const inEm = emStart >= 0 && starts[i] >= emStart && starts[i] < emStart + em!.length;
        return (
          <Fragment key={i}>
            <span className="lp-word" aria-hidden>
              <motion.span className={inEm ? 'lp-em' : undefined} style={{ display: 'inline-block' }} variants={wordVariants}>{w}</motion.span>
            </span>{' '}
          </Fragment>
        );
      })}
    </MTag>
  );
}

/** Đếm số từ 0 → `to` khi cuộn tới. */
export function Counter({ to, suffix = '', prefix = '', duration = 1.8, decimals = 0 }: { to: number; suffix?: string; prefix?: string; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, { duration, ease: EASE, onUpdate: (v) => setVal(v) });
    return () => ctrl.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString('vi-VN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

/** Dải chạy vô tận (marquee). `reverse` chạy ngược chiều; dừng khi hover. */
export function Marquee({ children, speed = 40, reverse = false, className }: { children: ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  return (
    <div className={`lp-marquee ${className ?? ''}`}>
      <div className="lp-marquee-track" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        <div className="lp-marquee-group">{children}</div>
        <div className="lp-marquee-group" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/** Ảnh trong khung: nghiêng/dịch nhẹ theo chuột — dùng cho card bộ môn. */
export function useHoverParallax(max = 10) {
  const x = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * -max);
    y.set(((e.clientY - r.top) / r.height - 0.5) * -max);
  };
  const onMouseLeave = () => { x.set(0); y.set(0); };
  return { x, y, onMouseMove, onMouseLeave };
}
