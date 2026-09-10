import dayjs from 'dayjs';
import type { AppData } from '../types';

const d = (offsetDays: number) => dayjs().add(offsetDays, 'day').format('YYYY-MM-DD');
const dt = (offsetDays: number, h = 9) => dayjs().add(offsetDays, 'day').hour(h).minute(0).format('YYYY-MM-DD HH:mm');

const base: AppData = {
  users: [
    { id: 'u1', email: 'manager@sc.vn', fullName: 'Trần Thị Hồng Minh', phone: '0901000001', role: 'MANAGER', status: 'ACTIVE', createdAt: d(-200) },
    { id: 'u2', email: 'reception@sc.vn', fullName: 'Nguyễn Lễ Tân', phone: '0901000002', role: 'RECEPTIONIST', status: 'ACTIVE', createdAt: d(-150) },
    { id: 'u3', email: 'coach.an@sc.vn', fullName: 'Lê Văn An', phone: '0901000003', role: 'COACH', status: 'ACTIVE', specialty: 'Gym / Bodybuilding', bio: '8 năm kinh nghiệm huấn luyện thể hình, chứng chỉ NASM-CPT.', createdAt: d(-180) },
    { id: 'u4', email: 'coach.binh@sc.vn', fullName: 'Phạm Thanh Bình', phone: '0901000004', role: 'COACH', status: 'ACTIVE', specialty: 'Yoga / Pilates', bio: 'Giảng viên Yoga quốc tế RYT-500.', createdAt: d(-170) },
    { id: 'u5', email: 'coach.cuong@sc.vn', fullName: 'Đỗ Mạnh Cường', phone: '0901000005', role: 'COACH', status: 'ACTIVE', specialty: 'Boxing / Kickboxing', bio: 'Cựu VĐV quyền anh đội tuyển quốc gia.', createdAt: d(-160) },
    { id: 'u6', email: 'member.dung@gmail.com', fullName: 'Hoàng Thị Dung', phone: '0912000001', role: 'MEMBER', status: 'ACTIVE', dob: '1998-05-12', gender: 'FEMALE', goal: 'Giảm 5kg trong 3 tháng', level: 'BEGINNER', healthNote: 'Không', createdAt: d(-90) },
    { id: 'u7', email: 'member.em@gmail.com', fullName: 'Vũ Quang Em', phone: '0912000002', role: 'MEMBER', status: 'ACTIVE', dob: '1995-11-03', gender: 'MALE', goal: 'Tăng cơ, tăng 4kg', level: 'INTERMEDIATE', createdAt: d(-80) },
    { id: 'u8', email: 'member.giang@gmail.com', fullName: 'Ngô Hương Giang', phone: '0912000003', role: 'MEMBER', status: 'ACTIVE', dob: '2001-02-20', gender: 'FEMALE', goal: 'Cải thiện dẻo dai', level: 'BEGINNER', createdAt: d(-60) },
    { id: 'u9', email: 'member.hai@gmail.com', fullName: 'Bùi Đức Hải', phone: '0912000004', role: 'MEMBER', status: 'ACTIVE', dob: '1990-07-07', gender: 'MALE', goal: 'Giữ dáng, tăng sức bền', level: 'ADVANCED', createdAt: d(-40) },
    { id: 'u10', email: 'member.khanh@gmail.com', fullName: 'Lý Minh Khánh', phone: '0912000005', role: 'MEMBER', status: 'LOCKED', dob: '1999-09-09', gender: 'MALE', goal: 'Học boxing cơ bản', level: 'BEGINNER', createdAt: d(-30) },
    { id: 'u11', email: 'member.lan@gmail.com', fullName: 'Đặng Ngọc Lan', phone: '0912000006', role: 'MEMBER', status: 'ACTIVE', dob: '1997-03-15', gender: 'FEMALE', goal: 'Giảm mỡ bụng', level: 'INTERMEDIATE', createdAt: d(-10) },
  ],
  plans: [
    { id: 'p1', name: 'Gói 1 tháng', price: 500000, durationDays: 30, benefits: 'Tập gym không giới hạn, 1 buổi PT thử', active: true },
    { id: 'p2', name: 'Gói 3 tháng', price: 1350000, durationDays: 90, benefits: 'Tập gym + lớp nhóm, tủ đồ riêng', active: true },
    { id: 'p3', name: 'Gói 6 tháng', price: 2400000, durationDays: 180, benefits: 'Toàn bộ quyền lợi gói 3 tháng + 2 buổi PT/tháng', active: true },
    { id: 'p4', name: 'Gói 1 năm', price: 4200000, durationDays: 365, benefits: 'Toàn bộ quyền lợi + xông hơi, đo InBody hàng tháng', active: true },
    { id: 'p5', name: 'Gói sinh viên (cũ)', price: 350000, durationDays: 30, benefits: 'Ưu đãi sinh viên', active: false },
  ],
  subscriptions: [
    { id: 's1', memberId: 'u6', planId: 'p2', startDate: d(-60), endDate: d(30), status: 'ACTIVE' },
    { id: 's2', memberId: 'u7', planId: 'p3', startDate: d(-80), endDate: d(100), status: 'ACTIVE' },
    { id: 's3', memberId: 'u8', planId: 'p1', startDate: d(-25), endDate: d(5), status: 'ACTIVE' },
    { id: 's4', memberId: 'u9', planId: 'p4', startDate: d(-40), endDate: d(325), status: 'ACTIVE' },
    { id: 's5', memberId: 'u10', planId: 'p1', startDate: d(-45), endDate: d(-15), status: 'EXPIRED' },
    { id: 's6', memberId: 'u11', planId: 'p1', startDate: d(-10), endDate: d(20), status: 'ACTIVE' },
    { id: 's0', memberId: 'u6', planId: 'p1', startDate: d(-90), endDate: d(-60), status: 'EXPIRED' },
  ],
  sports: [
    { id: 'sp1', name: 'Gym', description: 'Tập luyện thể hình với máy và tạ' },
    { id: 'sp2', name: 'Yoga', description: 'Yoga, Pilates, thiền' },
    { id: 'sp3', name: 'Boxing', description: 'Quyền anh và Kickboxing' },
    { id: 'sp4', name: 'Bơi lội', description: 'Bơi cơ bản và nâng cao' },
  ],
  rooms: [
    { id: 'r1', name: 'Phòng Gym A', capacity: 40, location: 'Tầng 1' },
    { id: 'r2', name: 'Phòng Yoga', capacity: 20, location: 'Tầng 2' },
    { id: 'r3', name: 'Sàn Boxing', capacity: 15, location: 'Tầng 2' },
    { id: 'r4', name: 'Hồ bơi', capacity: 25, location: 'Tầng hầm' },
  ],
  classes: [
    { id: 'c1', name: 'Gym cơ bản K12', sportId: 'sp1', roomId: 'r1', coachId: 'u3', capacity: 20, price: 800000, startDate: d(-30), endDate: d(60), status: 'OPEN' },
    { id: 'c2', name: 'Yoga buổi sáng', sportId: 'sp2', roomId: 'r2', coachId: 'u4', capacity: 15, price: 600000, startDate: d(-20), endDate: d(70), status: 'OPEN' },
    { id: 'c3', name: 'Boxing nâng cao', sportId: 'sp3', roomId: 'r3', coachId: 'u5', capacity: 10, price: 1200000, startDate: d(-10), endDate: d(80), status: 'OPEN' },
    { id: 'c4', name: 'Yoga trị liệu', sportId: 'sp2', roomId: 'r2', coachId: 'u4', capacity: 12, price: 900000, startDate: d(5), endDate: d(95), status: 'OPEN' },
    { id: 'c5', name: 'Bơi cơ bản', sportId: 'sp4', roomId: 'r4', capacity: 15, price: 700000, startDate: d(10), endDate: d(100), status: 'OPEN' },
    { id: 'c6', name: 'Gym giảm mỡ K11', sportId: 'sp1', roomId: 'r1', coachId: 'u3', capacity: 20, price: 800000, startDate: d(-120), endDate: d(-30), status: 'CLOSED' },
  ],
  schedules: [
    { id: 'sc1', classId: 'c1', dayOfWeek: 1, startTime: '18:00', endTime: '19:30' },
    { id: 'sc2', classId: 'c1', dayOfWeek: 3, startTime: '18:00', endTime: '19:30' },
    { id: 'sc3', classId: 'c1', dayOfWeek: 5, startTime: '18:00', endTime: '19:30' },
    { id: 'sc4', classId: 'c2', dayOfWeek: 2, startTime: '06:30', endTime: '07:30' },
    { id: 'sc5', classId: 'c2', dayOfWeek: 4, startTime: '06:30', endTime: '07:30' },
    { id: 'sc6', classId: 'c2', dayOfWeek: 6, startTime: '06:30', endTime: '07:30' },
    { id: 'sc7', classId: 'c3', dayOfWeek: 2, startTime: '19:00', endTime: '20:30' },
    { id: 'sc8', classId: 'c3', dayOfWeek: 4, startTime: '19:00', endTime: '20:30' },
    { id: 'sc9', classId: 'c4', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
    { id: 'sc10', classId: 'c4', dayOfWeek: 5, startTime: '08:00', endTime: '09:00' },
    { id: 'sc11', classId: 'c5', dayOfWeek: 6, startTime: '15:00', endTime: '16:30' },
    { id: 'sc12', classId: 'c5', dayOfWeek: 7, startTime: '15:00', endTime: '16:30' },
  ],
  enrollments: [
    { id: 'e1', classId: 'c1', memberId: 'u6', enrolledAt: d(-28), status: 'ACTIVE' },
    { id: 'e2', classId: 'c1', memberId: 'u7', enrolledAt: d(-27), status: 'ACTIVE' },
    { id: 'e3', classId: 'c1', memberId: 'u9', enrolledAt: d(-25), status: 'ACTIVE' },
    { id: 'e4', classId: 'c2', memberId: 'u6', enrolledAt: d(-18), status: 'ACTIVE' },
    { id: 'e5', classId: 'c2', memberId: 'u8', enrolledAt: d(-17), status: 'ACTIVE' },
    { id: 'e6', classId: 'c3', memberId: 'u9', enrolledAt: d(-9), status: 'ACTIVE' },
    { id: 'e7', classId: 'c3', memberId: 'u7', enrolledAt: d(-8), status: 'CANCELLED' },
    { id: 'e8', classId: 'c2', memberId: 'u11', enrolledAt: d(-5), status: 'ACTIVE' },
  ],
  payments: [
    { id: 'pay1', invoiceNo: 'INV-2026-0001', memberId: 'u6', amount: 500000, method: 'CASH', type: 'PLAN', refName: 'Gói 1 tháng', paidAt: dt(-90), createdBy: 'u2' },
    { id: 'pay2', invoiceNo: 'INV-2026-0002', memberId: 'u7', amount: 2400000, method: 'BANK', type: 'PLAN', refName: 'Gói 6 tháng', paidAt: dt(-80), createdBy: 'u2' },
    { id: 'pay3', invoiceNo: 'INV-2026-0003', memberId: 'u6', amount: 1350000, method: 'VNPAY', type: 'PLAN', refName: 'Gói 3 tháng', paidAt: dt(-60), createdBy: 'u6' },
    { id: 'pay4', invoiceNo: 'INV-2026-0004', memberId: 'u10', amount: 500000, method: 'CASH', type: 'PLAN', refName: 'Gói 1 tháng', paidAt: dt(-45), createdBy: 'u2' },
    { id: 'pay5', invoiceNo: 'INV-2026-0005', memberId: 'u9', amount: 4200000, method: 'MOMO', type: 'PLAN', refName: 'Gói 1 năm', paidAt: dt(-40), createdBy: 'u9' },
    { id: 'pay6', invoiceNo: 'INV-2026-0006', memberId: 'u6', amount: 800000, method: 'CASH', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-28), createdBy: 'u2' },
    { id: 'pay7', invoiceNo: 'INV-2026-0007', memberId: 'u7', amount: 800000, method: 'VNPAY', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-27), createdBy: 'u7' },
    { id: 'pay8', invoiceNo: 'INV-2026-0008', memberId: 'u8', amount: 500000, method: 'CASH', type: 'PLAN', refName: 'Gói 1 tháng', paidAt: dt(-25), createdBy: 'u2' },
    { id: 'pay9', invoiceNo: 'INV-2026-0009', memberId: 'u9', amount: 800000, method: 'BANK', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-25), createdBy: 'u2' },
    { id: 'pay10', invoiceNo: 'INV-2026-0010', memberId: 'u6', amount: 600000, method: 'CASH', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-18), createdBy: 'u2' },
    { id: 'pay11', invoiceNo: 'INV-2026-0011', memberId: 'u8', amount: 600000, method: 'MOMO', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-17), createdBy: 'u8' },
    { id: 'pay12', invoiceNo: 'INV-2026-0012', memberId: 'u9', amount: 1200000, method: 'VNPAY', type: 'CLASS', refName: 'Boxing nâng cao', paidAt: dt(-9), createdBy: 'u9' },
    { id: 'pay13', invoiceNo: 'INV-2026-0013', memberId: 'u11', amount: 500000, method: 'CASH', type: 'PLAN', refName: 'Gói 1 tháng', paidAt: dt(-10), createdBy: 'u2' },
    { id: 'pay14', invoiceNo: 'INV-2026-0014', memberId: 'u11', amount: 600000, method: 'CASH', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-5), createdBy: 'u2' },
  ],
  supportRequests: [
    { id: 'sr1', memberId: 'u6', title: 'Đổi lịch lớp Yoga', content: 'Em muốn chuyển sang ca chiều được không ạ?', status: 'OPEN', createdAt: dt(-2) },
    { id: 'sr2', memberId: 'u9', title: 'Hỏng tủ đồ', content: 'Tủ số 15 bị kẹt khóa.', status: 'IN_PROGRESS', createdAt: dt(-4), handledBy: 'u2' },
    { id: 'sr3', memberId: 'u7', title: 'Xuất hóa đơn VAT', content: 'Cần hóa đơn đỏ cho gói 6 tháng.', status: 'RESOLVED', createdAt: dt(-20), handledBy: 'u2' },
  ],
  notifications: [
    { id: 'n1', userId: 'u8', title: 'Gói tập sắp hết hạn', content: 'Gói 1 tháng của bạn sẽ hết hạn sau 5 ngày. Gia hạn ngay để không gián đoạn.', read: false, createdAt: dt(-1) },
    { id: 'n2', userId: 'u6', title: 'Thay đổi lịch học', content: 'Lớp Yoga buổi sáng thứ 4 tuần này dời sang 07:00.', read: false, createdAt: dt(-1, 14) },
    { id: 'n3', userId: 'u6', title: 'Bài tập về nhà', content: 'HLV Lê Văn An đã giao bài tập: 3 hiệp plank 60s mỗi ngày.', read: true, createdAt: dt(-3) },
    { id: 'n4', userId: 'u3', title: 'Phân công lớp mới', content: 'Bạn được phân công phụ trách lớp Gym cơ bản K12.', read: true, createdAt: dt(-30) },
    { id: 'n5', userId: 'u1', title: 'Yêu cầu hỗ trợ mới', content: 'Có 1 yêu cầu hỗ trợ mới cần xử lý.', read: false, createdAt: dt(-2) },
  ],
  auditLogs: [
    { id: 'a1', userId: 'u1', action: 'CREATE', entity: 'Class', entityId: 'c4', detail: 'Tạo lớp Yoga trị liệu', createdAt: dt(-6) },
    { id: 'a2', userId: 'u1', action: 'ASSIGN_COACH', entity: 'Class', entityId: 'c4', detail: 'Phân công Phạm Thanh Bình', createdAt: dt(-6, 10) },
    { id: 'a3', userId: 'u2', action: 'PAYMENT', entity: 'Payment', entityId: 'pay13', detail: 'Thu 500.000đ tiền mặt - Gói 1 tháng', createdAt: dt(-10) },
    { id: 'a4', userId: 'u1', action: 'LOCK_USER', entity: 'User', entityId: 'u10', detail: 'Khóa tài khoản Lý Minh Khánh (nợ phí)', createdAt: dt(-12) },
    { id: 'a5', userId: 'u2', action: 'RENEW', entity: 'Subscription', entityId: 's1', detail: 'Gia hạn gói 3 tháng cho Hoàng Thị Dung', createdAt: dt(-60) },
  ],
  checkIns: [
    { id: 'ci1', memberId: 'u6', time: dt(-1, 18), by: 'u2' },
    { id: 'ci2', memberId: 'u7', time: dt(-1, 18), by: 'u2' },
    { id: 'ci3', memberId: 'u9', time: dt(0, 7), by: 'u2' },
    { id: 'ci4', memberId: 'u6', time: dt(-3, 6), by: 'u2' },
  ],
  sessions: [
    { id: 'ss1', classId: 'c1', date: d(-7) },
    { id: 'ss2', classId: 'c1', date: d(-5) },
    { id: 'ss3', classId: 'c1', date: d(-2) },
    { id: 'ss4', classId: 'c2', date: d(-6) },
    { id: 'ss5', classId: 'c2', date: d(-4) },
    { id: 'ss6', classId: 'c3', date: d(-6) },
  ],
  attendances: [
    { id: 'at1', sessionId: 'ss1', memberId: 'u6', status: 'PRESENT' },
    { id: 'at2', sessionId: 'ss1', memberId: 'u7', status: 'PRESENT' },
    { id: 'at3', sessionId: 'ss1', memberId: 'u9', status: 'LATE' },
    { id: 'at4', sessionId: 'ss2', memberId: 'u6', status: 'ABSENT' },
    { id: 'at5', sessionId: 'ss2', memberId: 'u7', status: 'PRESENT' },
    { id: 'at6', sessionId: 'ss2', memberId: 'u9', status: 'PRESENT' },
    { id: 'at7', sessionId: 'ss3', memberId: 'u6', status: 'PRESENT' },
    { id: 'at8', sessionId: 'ss3', memberId: 'u7', status: 'PRESENT' },
    { id: 'at9', sessionId: 'ss3', memberId: 'u9', status: 'PRESENT' },
    { id: 'at10', sessionId: 'ss4', memberId: 'u6', status: 'PRESENT' },
    { id: 'at11', sessionId: 'ss4', memberId: 'u8', status: 'PRESENT' },
    { id: 'at12', sessionId: 'ss5', memberId: 'u6', status: 'PRESENT' },
    { id: 'at13', sessionId: 'ss5', memberId: 'u8', status: 'ABSENT' },
  ],
  trainingPlans: [
    { id: 'tp1', coachId: 'u3', classId: 'c1', title: 'Giáo án tuần 1-4: Nền tảng', content: 'Tuần 1-2: Làm quen máy, kỹ thuật squat/deadlift với tạ nhẹ.\nTuần 3-4: Tăng dần khối lượng, 3 buổi/tuần, full body.', createdAt: dt(-28), source: 'MANUAL' },
    { id: 'tp2', coachId: 'u3', memberId: 'u6', title: 'Kế hoạch giảm cân cá nhân', content: 'Cardio 20 phút đầu buổi, sau đó circuit 4 vòng. Ăn 1500 kcal/ngày.', createdAt: dt(-20), source: 'MANUAL' },
    { id: 'tp3', coachId: 'u4', classId: 'c2', title: 'Chuỗi Yoga buổi sáng', content: 'Sun Salutation A/B, Warrior series, kết thúc Savasana 5 phút.', createdAt: dt(-18), source: 'MANUAL' },
  ],
  trainingResults: [
    { id: 'tr1', sessionId: 'ss1', memberId: 'u6', coachId: 'u3', metrics: 'Squat 30kg x 10, Cardio 15 phút', note: 'Kỹ thuật squat ổn, cần giữ lưng thẳng hơn.' },
    { id: 'tr2', sessionId: 'ss3', memberId: 'u6', coachId: 'u3', metrics: 'Squat 35kg x 10, Cardio 20 phút', note: 'Tiến bộ tốt, đã tăng tạ.' },
    { id: 'tr3', sessionId: 'ss1', memberId: 'u7', coachId: 'u3', metrics: 'Bench 60kg x 8, Deadlift 80kg x 6', note: 'Mạnh, có thể lên nhóm nâng cao.' },
  ],
  progressReviews: [
    { id: 'pr1', memberId: 'u6', coachId: 'u3', rating: 4, comment: 'Chuyên cần tốt, giảm được 1.5kg sau 3 tuần.', createdAt: dt(-3) },
    { id: 'pr2', memberId: 'u7', coachId: 'u3', rating: 5, comment: 'Kỹ thuật chuẩn, tăng 1kg cơ.', createdAt: dt(-3) },
  ],
  homeworks: [
    { id: 'hw1', classId: 'c1', coachId: 'u3', title: 'Plank hàng ngày', content: '3 hiệp plank 60s mỗi ngày, ghi lại vào app.', createdAt: dt(-3) },
    { id: 'hw2', classId: 'c2', coachId: 'u4', title: 'Thở 4-7-8', content: 'Tập thở 4-7-8 10 phút trước khi ngủ.', createdAt: dt(-2) },
  ],
  bodyMetrics: [],
  supportMessages: [
    { id: 'sm1', requestId: 'sr2', senderId: 'u2', content: 'Chào anh Hải, bên em đã ghi nhận. Kỹ thuật sẽ kiểm tra tủ số 15 trong hôm nay ạ.', createdAt: dt(-4, 10) },
    { id: 'sm2', requestId: 'sr2', senderId: 'u9', content: 'Ok em, anh có đồ để trong tủ, nhờ em xử lý sớm giúp.', createdAt: dt(-4, 11) },
    { id: 'sm3', requestId: 'sr2', senderId: 'u2', content: 'Dạ, dự kiến 15h chiều nay xong. Em sẽ báo lại anh.', createdAt: dt(-4, 11) },
    { id: 'sm4', requestId: 'sr3', senderId: 'u2', content: 'Em đã xuất hóa đơn VAT và gửi vào email member.em@gmail.com. Anh kiểm tra giúp em nhé.', createdAt: dt(-19, 9) },
    { id: 'sm5', requestId: 'sr3', senderId: 'u7', content: 'Đã nhận, cảm ơn em.', createdAt: dt(-19, 14) },
  ],
};

// ---------------------------------------------------------------------------
// Sinh thêm dữ liệu giả lập (deterministic) để dashboard/báo cáo trông thực tế.
// ---------------------------------------------------------------------------
let seed = 42;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const FIRST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const MID_F = ['Thị', 'Ngọc', 'Thu', 'Minh', 'Hồng'];
const MID_M = ['Văn', 'Đức', 'Minh', 'Quang', 'Hữu'];
const LAST_F = ['Anh', 'Hà', 'Linh', 'Mai', 'Ngân', 'Nhi', 'Phương', 'Thảo', 'Trang', 'Vy', 'Yến', 'Hạnh'];
const LAST_M = ['Bình', 'Cường', 'Dũng', 'Hiếu', 'Huy', 'Khoa', 'Long', 'Nam', 'Phong', 'Sơn', 'Tùng', 'Việt'];
const GOALS = ['Giảm 3-5kg', 'Tăng cơ, cải thiện sức mạnh', 'Cải thiện sức bền tim mạch', 'Giảm mỡ bụng', 'Tăng dẻo dai, giảm đau lưng', 'Giữ dáng, giảm stress', 'Học boxing tự vệ', 'Chuẩn bị chạy half-marathon'];
const LEVELS = ['BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const METHODS = ['CASH', 'CASH', 'BANK', 'VNPAY', 'MOMO'] as const;

function generate(data: AppData): AppData {
  const users = [...data.users];
  const subscriptions = [...data.subscriptions];
  const payments = [...data.payments];
  const enrollments = [...data.enrollments];
  const checkIns = [...data.checkIns];
  const auditLogs = [...data.auditLogs];
  const notifications = [...data.notifications];
  let inv = payments.length;
  const nextInv = () => `INV-${dayjs().format('YYYY')}-${String(++inv).padStart(4, '0')}`;

  // 1) 24 thành viên bổ sung, gia nhập rải rác 6 tháng gần đây
  for (let i = 0; i < 24; i++) {
    const female = rnd() < 0.5;
    const name = `${pick(FIRST)} ${female ? pick(MID_F) : pick(MID_M)} ${female ? pick(LAST_F) : pick(LAST_M)}`;
    const id = `u${100 + i}`;
    const joined = -between(3, 180);
    users.push({
      id, email: `member${100 + i}@gmail.com`, fullName: name, phone: `09${String(30000000 + i * 7919).slice(0, 8)}`, role: 'MEMBER',
      status: rnd() < 0.06 ? 'LOCKED' : 'ACTIVE', dob: `${between(1985, 2005)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
      gender: female ? 'FEMALE' : 'MALE', goal: pick(GOALS), level: pick([...LEVELS]), createdAt: d(joined),
    });
    // Gói: 1-2 kỳ liên tiếp
    const plan = pick(data.plans.filter((p) => p.active));
    let start = joined;
    const periods = rnd() < 0.35 ? 2 : 1;
    for (let k = 0; k < periods; k++) {
      if (start > 0) break; // kỳ gia hạn chỉ tồn tại nếu đã bắt đầu
      const p = k === 0 ? plan : pick(data.plans.filter((x) => x.active));
      const end = start + p.durationDays;
      const active = end >= 0 && k === periods - 1;
      subscriptions.push({ id: `s${id}_${k}`, memberId: id, planId: p.id, startDate: d(start), endDate: d(end), status: active ? 'ACTIVE' : 'EXPIRED' });
      const m = pick([...METHODS]);
      payments.push({ id: `pay${id}_${k}`, invoiceNo: nextInv(), memberId: id, amount: p.price, method: m, type: 'PLAN', refName: p.name, paidAt: dt(start, between(7, 20)), createdBy: m === 'CASH' || m === 'BANK' ? 'u2' : id });
      start = end + 1;
    }
    // Lớp học: 40% đăng ký 1 lớp đang mở
    if (rnd() < 0.4) {
      const cls = pick(data.classes.filter((c) => c.status === 'OPEN' && c.startDate <= d(0)));
      const when = Math.max(joined, -between(1, 25));
      enrollments.push({ id: `e${id}`, classId: cls.id, memberId: id, enrolledAt: d(when), status: 'ACTIVE' });
      const m = pick([...METHODS]);
      payments.push({ id: `pay${id}_c`, invoiceNo: nextInv(), memberId: id, amount: cls.price, method: m, type: 'CLASS', refName: cls.name, paidAt: dt(when, between(7, 20)), createdBy: 'u2' });
    }
    // Check-in gần đây
    const n = between(0, 6);
    for (let k = 0; k < n; k++) checkIns.push({ id: `ci${id}_${k}`, memberId: id, time: dt(-between(0, 14), between(6, 21)), by: 'u2' });
    if (rnd() < 0.3) auditLogs.push({ id: `a${id}`, userId: 'u2', action: 'CREATE_MEMBER', entity: 'User', entityId: id, detail: `Đăng ký thành viên mới tại quầy: ${name}`, createdAt: dt(joined, 10) });
  }
  payments.sort((a, b) => a.paidAt.localeCompare(b.paidAt)).forEach((p, i) => { p.invoiceNo = `INV-${dayjs().format('YYYY')}-${String(i + 1).padStart(4, '0')}`; });

  // 2) Buổi học + điểm danh cho các lớp đang mở trong 5 tuần qua
  const sessions = [...data.sessions];
  const attendances = [...data.attendances];
  const trainingResults = [...data.trainingResults];
  const existing = new Set(sessions.map((s) => `${s.classId}|${s.date}`));
  for (const cls of data.classes.filter((c) => c.status === 'OPEN')) {
    const scs = data.schedules.filter((s) => s.classId === cls.id);
    for (let off = 35; off >= 1; off--) {
      const date = dayjs().subtract(off, 'day');
      if (date.format('YYYY-MM-DD') < cls.startDate) continue;
      const dow = ((date.day() + 6) % 7) + 1;
      if (!scs.some((s) => s.dayOfWeek === dow)) continue;
      const key = `${cls.id}|${date.format('YYYY-MM-DD')}`;
      if (existing.has(key)) continue;
      const sid = `ss${cls.id}_${off}`;
      sessions.push({ id: sid, classId: cls.id, date: date.format('YYYY-MM-DD') });
      for (const e of enrollments.filter((x) => x.classId === cls.id && x.status === 'ACTIVE' && x.enrolledAt <= date.format('YYYY-MM-DD'))) {
        const r = rnd();
        const st = r < 0.8 ? 'PRESENT' : r < 0.9 ? 'LATE' : 'ABSENT';
        attendances.push({ id: `at${sid}_${e.memberId}`, sessionId: sid, memberId: e.memberId, status: st });
        if (st !== 'ABSENT' && cls.coachId && rnd() < 0.25) {
          trainingResults.push({ id: `tr${sid}_${e.memberId}`, sessionId: sid, memberId: e.memberId, coachId: cls.coachId, metrics: pick(['Squat 40kg x 10', 'Deadlift 60kg x 8', 'Chạy 3km/17 phút', 'Plank 90s x 3', 'Bench 50kg x 8', 'Burpee 20 x 4']), note: pick(['Kỹ thuật ổn định.', 'Cần giữ lưng thẳng hơn.', 'Tiến bộ rõ so với tuần trước.', 'Hơi mệt, giảm khối lượng buổi sau.']) });
        }
      }
    }
  }

  // 3) Chỉ số cơ thể theo tuần cho các member đang học
  const bodyMetrics: AppData['bodyMetrics'] = [];
  const tracked = Array.from(new Set(enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.memberId)));
  for (const mid of tracked) {
    const u = users.find((x) => x.id === mid)!;
    const losing = /giảm/i.test(u.goal ?? '');
    let w = u.gender === 'FEMALE' ? between(52, 68) : between(62, 84);
    let bf = u.gender === 'FEMALE' ? between(24, 32) : between(16, 24);
    for (let k = 8; k >= 0; k--) {
      bodyMetrics.push({ id: `bm${mid}_${k}`, memberId: mid, date: d(-k * 7), weight: Math.round(w * 10) / 10, bodyFat: Math.round(bf * 10) / 10 });
      w += (losing ? -1 : 0.4) * (0.3 + rnd() * 0.6);
      bf += (losing ? -0.5 : -0.2) * (0.3 + rnd() * 0.6);
    }
  }

  // 4) Thông báo hệ thống cho gói sắp hết hạn
  for (const s of subscriptions.filter((x) => x.status === 'ACTIVE')) {
    const left = dayjs(s.endDate).diff(dayjs(), 'day');
    if (left >= 0 && left <= 7 && !notifications.some((n) => n.userId === s.memberId && n.title.includes('hết hạn'))) {
      notifications.push({ id: `nexp${s.id}`, userId: s.memberId, title: 'Gói tập sắp hết hạn', content: `Gói của bạn sẽ hết hạn sau ${left} ngày. Gia hạn ngay để không gián đoạn.`, read: false, createdAt: dt(-1, 8) });
    }
  }

  auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...data, users, subscriptions, payments, enrollments, checkIns, auditLogs, notifications, sessions, attendances, trainingResults, bodyMetrics };
}

export const initialData: AppData = generate(base);
