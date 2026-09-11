import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Reveal, SplitWords } from './ui';

const BENEFITS = [
  { key: 'court', tag: 'Sân', title: 'Đặt sân online, giảm tới 40%',
    desc: 'Mở app, chọn sân, chọn giờ — 24/7. Thành viên có gói được giảm 10–40% giá thuê sân tùy gói; hủy trước giờ chơi không mất phí.',
    items: ['4 sân cầu lông · 2 tennis · 2 pickleball', 'Sân bóng rổ, sân bóng đá mini 5 người', 'Thấy ngay sân nào trống giờ nào', 'Nhận sân bằng mã, không cần giấy tờ'] },
  { key: 'class', tag: 'Lớp', title: 'Lớp nhóm không giới hạn',
    desc: 'Gói All-access vào được mọi lớp đang mở: gym, yoga, boxing, bơi, zumba, cầu lông, tennis… Gói theo môn thì không giới hạn số buổi của môn đó.',
    items: ['11 lớp đang mở, khai giảng liên tục', 'Biết trước HLV, phòng, giờ, còn bao nhiêu chỗ', 'Điểm danh bằng mã thành viên', 'Đổi lớp nếu lịch cá nhân thay đổi'] },
  { key: 'coach', tag: 'HLV', title: 'HLV theo dõi từng buổi tập',
    desc: 'Mỗi buổi HLV ghi lại chỉ số của bạn — tạ, thời gian, quãng đường, độ gắng sức. Bạn xem lại biểu đồ tiến bộ và kỷ lục cá nhân bất cứ lúc nào.',
    items: ['HLV có chứng chỉ đúng bộ môn', 'Kết quả từng buổi, lưu vĩnh viễn', 'Biểu đồ tiến bộ theo tuần / tháng', 'Đánh giá định kỳ từ HLV'] },
  { key: 'ai', tag: 'Kế hoạch', title: 'Kế hoạch tuần cho riêng bạn',
    desc: 'Dựa trên mục tiêu và kết quả gần nhất, hệ thống đề xuất lịch tập tuần; HLV xem và chỉnh trước khi gửi cho bạn. Có trợ lý trả lời thắc mắc 24/7.',
    items: ['Kế hoạch theo mục tiêu: giảm mỡ, tăng cơ, thi đấu', 'HLV duyệt trước khi gửi', 'Nhắc lịch tập và lịch sân', 'Hỏi đáp về bài tập, dinh dưỡng cơ bản'] },
];

/** Section "ghim" màn hình rồi cuộn ngang qua các quyền lợi (desktop); mobile xếp dọc. */
export default function Benefits() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const bgX = useTransform(scrollYProgress, [0, 1], ['10%', '-60%']); // chữ nền khổng lồ trôi chậm hơn track
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const measure = () => { const t = trackRef.current; if (t) setDist(Math.max(0, t.scrollWidth - t.clientWidth)); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section ref={ref} className="lp-roles" id="benefits">
      <div className="lp-roles-sticky">
        <div className="lp-grain" />
        <motion.div className="lp-roles-bg" style={{ x: bgX }} aria-hidden>THÀNH VIÊN</motion.div>
        <div className="lp-container lp-roles-head">
          <Reveal><span className="lp-eyebrow light">Quyền lợi thành viên</span></Reveal>
          <SplitWords as="h2" onView className="lp-h2 light" text="Bạn nhận được gì khi có gói." em="khi có gói." />
          <div className="lp-roles-progress"><motion.i style={{ width: progress }} /></div>
        </div>
        <motion.div ref={trackRef} className="lp-roles-track" style={{ x }}>
          {BENEFITS.map((b, i) => (
            <div key={b.key} className="lp-role">
              <div className="lp-role-top"><span className="lp-role-tag">{b.tag}</span><span className="lp-role-idx">0{i + 1}</span></div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
              <ul>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
          <div className="lp-role lp-role-end">
            <h3>Chưa có gói vẫn thuê sân được</h3>
            <p>Tạo tài khoản miễn phí, đặt sân theo giá thường. Muốn giảm giá sân và vào lớp thì mua gói sau, lúc nào cũng được.</p>
            <Link to="/register" className="lp-btn lp-btn-ink">Tạo tài khoản <ArrowRightOutlined /></Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
