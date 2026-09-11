/**
 * Toàn bộ nội dung landing ở một chỗ — sửa file này, không cần đụng component.
 * Khi có backend, có thể thay bằng dữ liệu fetch về (cùng shape).
 */
import gym from './assets/gym.jpg';
import yoga from './assets/yoga.jpg';
import boxing from './assets/boxing.jpg';
import swim from './assets/swim.jpg';
import badminton from './assets/badminton.jpg';
import tennis from './assets/tennis.jpg';
import pickleball from './assets/pickleball.jpg';
import basketball from './assets/basketball.jpg';
import zumba from './assets/zumba.jpg';
import football from './assets/football.jpg';
import heroGym from './assets/hero-gym.jpg';

export const BRAND_NAME = 'Sports Center';

export const HERO = {
  image: heroGym,               // đổi ảnh hero ở đây
  kicker: 'Trung tâm thể thao đa môn · Mở cửa 06:00 – 22:00, 7 ngày/tuần',
  title: 'Chơi hết mình, mỗi ngày.',
  lead: 'Gym, yoga, bơi, boxing, cầu lông, tennis, pickleball, bóng rổ, bóng đá — 10 bộ môn dưới một mái nhà. Buổi đầu tiên miễn phí, đặt sân online chỉ mất 30 giây.',
  facts: [
    { title: 'Tập thử miễn phí', desc: 'Buổi đầu tiên ở bất kỳ bộ môn nào, không cần mua gói trước' },
    { title: '15 sân & phòng tập', desc: 'Sân thuê theo giờ, phòng tập theo lớp với HLV có chứng chỉ, hồ bơi' },
    { title: 'Ưu đãi tháng {month}', desc: 'Mua gói All-access 1 năm tặng thêm 1 tháng và 2 buổi PT' },
  ],
};

export interface Sport { id: string; name: string; description: string; image: string; kind: 'COURT' | 'ROOM'; venues: number; fromPrice?: number; classes: number; coaches: number; span?: 'big' | 'wide' | 'tall' }
export const SPORTS: Sport[] = [
  { id: 'gym', name: 'Gym', description: 'Thể hình với máy và tạ tự do', image: gym, kind: 'ROOM', venues: 1, classes: 1, coaches: 2, span: 'big' },
  { id: 'yoga', name: 'Yoga', description: 'Yoga, Pilates, thiền', image: yoga, kind: 'ROOM', venues: 1, classes: 2, coaches: 1 },
  { id: 'boxing', name: 'Boxing', description: 'Quyền anh và Kickboxing', image: boxing, kind: 'ROOM', venues: 1, classes: 1, coaches: 1 },
  { id: 'swim', name: 'Bơi lội', description: 'Bơi cơ bản, nâng cao, bơi trẻ em', image: swim, kind: 'ROOM', venues: 1, classes: 1, coaches: 1, span: 'wide' },
  { id: 'badminton', name: 'Cầu lông', description: 'Sân cầu lông tiêu chuẩn, lớp kỹ thuật', image: badminton, kind: 'COURT', venues: 4, fromPrice: 100000, classes: 1, coaches: 1, span: 'tall' },
  { id: 'tennis', name: 'Tennis', description: 'Sân cứng, lớp thiếu niên & người lớn', image: tennis, kind: 'COURT', venues: 2, fromPrice: 250000, classes: 1, coaches: 1 },
  { id: 'pickleball', name: 'Pickleball', description: 'Sân pickleball, đặt theo giờ', image: pickleball, kind: 'COURT', venues: 2, fromPrice: 150000, classes: 1, coaches: 1 },
  { id: 'basketball', name: 'Bóng rổ', description: 'Sân trong nhà, lớp trẻ em & giao lưu', image: basketball, kind: 'COURT', venues: 1, fromPrice: 300000, classes: 1, coaches: 1, span: 'wide' },
  { id: 'zumba', name: 'Zumba', description: 'Nhảy Zumba, Aerobic đốt mỡ', image: zumba, kind: 'ROOM', venues: 1, classes: 1, coaches: 1 },
  { id: 'football', name: 'Bóng đá mini', description: 'Sân 5 người cỏ nhân tạo', image: football, kind: 'COURT', venues: 1, fromPrice: 400000, classes: 0, coaches: 1 },
];

export const STATS = [
  { value: SPORTS.length, label: 'Bộ môn', hint: SPORTS.map((s) => s.name).join(', ') },
  { value: SPORTS.filter((s) => s.kind === 'COURT').reduce((n, s) => n + s.venues, 0), label: 'Sân thuê theo giờ', hint: '06:00 – 22:00, khung 1 giờ' },
  { value: SPORTS.filter((s) => s.kind === 'ROOM').reduce((n, s) => n + s.venues, 0), label: 'Phòng tập & hồ bơi', hint: 'Học theo lớp, có HLV' },
  { value: 6, label: 'Huấn luyện viên', hint: 'Chứng chỉ NASM, RYT-500, ITF… đúng bộ môn' },
];

export const MANIFESTO = {
  text: 'Không chỉ là một phòng gym. Là nơi bạn ghé sau giờ làm để đánh một trận cầu lông, sáng cuối tuần để bơi vài vòng, và tối thứ Ba để kịp lớp yoga. Mọi môn bạn thích — dưới một mái nhà.',
  image: swim,
  caption: 'Hồ bơi · tầng hầm · 06:00 – 21:00',
};

export interface Plan { id: string; name: string; scope: string; days: number; price: number; benefits: string[]; courtDiscount: number; hot?: boolean }
export const PLANS: Plan[] = [
  { id: 'gym-1m', name: 'Gym 1 tháng', scope: 'Gym', days: 30, price: 400000, benefits: ['Phòng gym không giới hạn', '1 buổi PT thử'], courtDiscount: 10 },
  { id: 'all-3m', name: 'All-access 3 tháng', scope: 'Mọi bộ môn', days: 90, price: 1650000, benefits: ['Mọi bộ môn + lớp nhóm', 'Tủ đồ riêng'], courtDiscount: 25, hot: true },
  { id: 'all-1y', name: 'All-access 1 năm', scope: 'Mọi bộ môn', days: 365, price: 4900000, benefits: ['Toàn bộ quyền lợi + xông hơi', 'Đo InBody hàng tháng'], courtDiscount: 40 },
];
export const PRICING_NOTE = 'Còn 4 gói khác (Bơi 1 tháng, Yoga & Zumba 3 tháng, All-access 1 & 6 tháng)';
export const COURT_FROM_PRICE = Math.min(...SPORTS.filter((s) => s.fromPrice).map((s) => s.fromPrice!));

export const HOURS = [
  { name: 'Sân cầu lông · tennis · pickleball', time: '06:00 – 22:00', note: 'Hằng ngày · khung 1 giờ' },
  { name: 'Sân bóng rổ · bóng đá mini', time: '06:00 – 22:00', note: 'Hằng ngày · đặt tối thiểu 1 giờ' },
  { name: 'Hồ bơi', time: '06:00 – 21:00', note: 'Nghỉ vệ sinh hồ 13:00 – 14:00' },
  { name: 'Phòng gym', time: '06:00 – 22:00', note: 'Hằng ngày, kể cả lễ' },
  { name: 'Phòng Yoga · Zumba · Boxing', time: 'Theo lịch lớp', note: 'Xem lịch tuần sau khi đăng nhập' },
  { name: 'Quầy tiếp đón', time: '06:00 – 22:00', note: 'Đăng ký, gia hạn gói, thanh toán tại chỗ' },
];

export const CONTACT = {
  address: 'Nhà thi đấu A & B, khu sân ngoài trời và tòa nhà 3 tầng (gym tầng 1, yoga & boxing tầng 2, zumba tầng 3). Hồ bơi ở tầng hầm.',
  phone: '0901 000 002',
  email: 'hello@sc.vn',
  parking: 'Miễn phí cho thành viên có gói; khách thuê sân 5.000đ/lượt.',
};

export const CTA = { image: tennis, title: 'Tối nay', titleEm: 'sân còn trống?', lead: 'Đăng nhập, chọn sân, chọn giờ. Hệ thống báo ngay nếu trùng lớp hoặc đã có người đặt.' };

export const FOOTER = {
  blurb: 'Trung tâm thể thao đa bộ môn: sân thuê theo giờ, lớp có HLV, hồ bơi.',
  copyright: `© ${new Date().getFullYear()} ${BRAND_NAME}`,
  extra: [['Sân thuê theo giờ'], ['Lớp có HLV'], ['Hồ bơi 25m']],
};
