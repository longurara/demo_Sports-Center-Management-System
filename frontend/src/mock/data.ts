import dayjs from 'dayjs';
import type { AppData, ResultEntry } from '../types';
import { SPORT_METRICS, entriesToString } from '../utils/results';
import { sportKeyOf } from '../utils/aiPlan';

const d = (offsetDays: number) => dayjs().add(offsetDays, 'day').format('YYYY-MM-DD');
const dt = (offsetDays: number, h = 9) => dayjs().add(offsetDays, 'day').hour(h).minute(0).format('YYYY-MM-DD HH:mm');

const base: AppData = {
  users: [
    { id: 'u1', email: 'manager@sc.vn', fullName: 'Trần Thị Hồng Minh', phone: '0901000001', role: 'MANAGER', status: 'ACTIVE', createdAt: d(-200) },
    { id: 'u2', email: 'reception@sc.vn', fullName: 'Nguyễn Lễ Tân', phone: '0901000002', role: 'RECEPTIONIST', status: 'ACTIVE', createdAt: d(-150) },
    { id: 'u3', email: 'coach.an@sc.vn', fullName: 'Lê Văn An', phone: '0901000003', role: 'COACH', status: 'ACTIVE', specialty: 'NASM-CPT · Bodybuilding', sportIds: ['sp1'], bio: '8 năm kinh nghiệm huấn luyện thể hình, chứng chỉ NASM-CPT.', createdAt: d(-180) },
    { id: 'u4', email: 'coach.binh@sc.vn', fullName: 'Phạm Thanh Bình', phone: '0901000004', role: 'COACH', status: 'ACTIVE', specialty: 'RYT-500 · Pilates', sportIds: ['sp2', 'sp9'], bio: 'Giảng viên Yoga quốc tế RYT-500.', createdAt: d(-170) },
    { id: 'u5', email: 'coach.cuong@sc.vn', fullName: 'Đỗ Mạnh Cường', phone: '0901000005', role: 'COACH', status: 'ACTIVE', specialty: 'Kickboxing · Cựu VĐV QG', sportIds: ['sp3', 'sp1'], bio: 'Cựu VĐV quyền anh đội tuyển quốc gia.', createdAt: d(-160) },
    { id: 'u12', email: 'coach.duy@sc.vn', fullName: 'Nguyễn Anh Duy', phone: '0901000012', role: 'COACH', status: 'ACTIVE', specialty: 'HLV cầu lông cấp 1 · Pickleball', sportIds: ['sp5', 'sp7'], bio: 'Cựu VĐV cầu lông TP.HCM, 6 năm huấn luyện phong trào và thiếu niên.', createdAt: d(-140) },
    { id: 'u13', email: 'coach.hanh@sc.vn', fullName: 'Trần Mỹ Hạnh', phone: '0901000013', role: 'COACH', status: 'ACTIVE', specialty: 'Bơi lội · Cứu hộ bậc 2', sportIds: ['sp4'], bio: 'Chứng chỉ HLV bơi Liên đoàn Thể thao dưới nước, chuyên bơi cơ bản cho trẻ em và người lớn.', createdAt: d(-130) },
    { id: 'u14', email: 'coach.khoa@sc.vn', fullName: 'Lâm Đăng Khoa', phone: '0901000014', role: 'COACH', status: 'ACTIVE', specialty: 'Tennis ITF Level 1 · Bóng rổ', sportIds: ['sp6', 'sp8', 'sp10'], bio: 'HLV tennis và bóng rổ học đường, tập trung kỹ thuật nền tảng và thể lực chuyên môn.', createdAt: d(-120) },
    { id: 'u6', email: 'member.dung@gmail.com', fullName: 'Hoàng Thị Dung', phone: '0912000001', role: 'MEMBER', status: 'ACTIVE', dob: '1998-05-12', gender: 'FEMALE', goal: 'Giảm 5kg trong 3 tháng', level: 'BEGINNER', healthNote: 'Không', createdAt: d(-90) },
    { id: 'u7', email: 'member.em@gmail.com', fullName: 'Vũ Quang Em', phone: '0912000002', role: 'MEMBER', status: 'ACTIVE', dob: '1995-11-03', gender: 'MALE', goal: 'Tăng cơ, tăng 4kg', level: 'INTERMEDIATE', createdAt: d(-80) },
    { id: 'u8', email: 'member.giang@gmail.com', fullName: 'Ngô Hương Giang', phone: '0912000003', role: 'MEMBER', status: 'ACTIVE', dob: '2001-02-20', gender: 'FEMALE', goal: 'Cải thiện dẻo dai', level: 'BEGINNER', createdAt: d(-60) },
    { id: 'u9', email: 'member.hai@gmail.com', fullName: 'Bùi Đức Hải', phone: '0912000004', role: 'MEMBER', status: 'ACTIVE', dob: '1990-07-07', gender: 'MALE', goal: 'Giữ dáng, tăng sức bền', level: 'ADVANCED', createdAt: d(-40) },
    { id: 'u10', email: 'member.khanh@gmail.com', fullName: 'Lý Minh Khánh', phone: '0912000005', role: 'MEMBER', status: 'LOCKED', dob: '1999-09-09', gender: 'MALE', goal: 'Học boxing cơ bản', level: 'BEGINNER', createdAt: d(-30) },
    { id: 'u11', email: 'member.lan@gmail.com', fullName: 'Đặng Ngọc Lan', phone: '0912000006', role: 'MEMBER', status: 'ACTIVE', dob: '1997-03-15', gender: 'FEMALE', goal: 'Giảm mỡ bụng', level: 'INTERMEDIATE', createdAt: d(-10) },
  ],
  plans: [
    { id: 'p1', name: 'Gym 1 tháng', price: 400000, durationDays: 30, benefits: 'Phòng gym không giới hạn, 1 buổi PT thử, giảm 10% thuê sân', active: true, sportIds: ['sp1'], courtDiscount: 10 },
    { id: 'p2', name: 'All-access 1 tháng', price: 650000, durationDays: 30, benefits: 'Mọi bộ môn (gym, yoga, bơi, zumba…), lớp nhóm, giảm 20% thuê sân', active: true, sportIds: [], courtDiscount: 20 },
    { id: 'p3', name: 'All-access 3 tháng', price: 1650000, durationDays: 90, benefits: 'Mọi bộ môn + lớp nhóm, tủ đồ riêng, giảm 25% thuê sân', active: true, sportIds: [], courtDiscount: 25 },
    { id: 'p4', name: 'All-access 6 tháng', price: 2900000, durationDays: 180, benefits: 'Toàn bộ quyền lợi 3 tháng + 2 buổi PT/tháng, giảm 30% thuê sân', active: true, sportIds: [], courtDiscount: 30 },
    { id: 'p5', name: 'All-access 1 năm', price: 4900000, durationDays: 365, benefits: 'Toàn bộ quyền lợi + xông hơi, đo InBody hàng tháng, giảm 40% thuê sân', active: true, sportIds: [], courtDiscount: 40 },
    { id: 'p6', name: 'Bơi 1 tháng', price: 450000, durationDays: 30, benefits: 'Hồ bơi không giới hạn giờ mở cửa, tủ đồ + phòng tắm', active: true, sportIds: ['sp4'], courtDiscount: 0 },
    { id: 'p7', name: 'Yoga & Zumba 3 tháng', price: 1200000, durationDays: 90, benefits: 'Mọi lớp Yoga + Zumba, thảm tập riêng, giảm 10% thuê sân', active: true, sportIds: ['sp2', 'sp9'], courtDiscount: 10 },
    { id: 'p8', name: 'Gói sinh viên (cũ)', price: 350000, durationDays: 30, benefits: 'Ưu đãi sinh viên', active: false, sportIds: ['sp1'], courtDiscount: 0 },
  ],
  subscriptions: [
    { id: 's1', memberId: 'u6', planId: 'p3', startDate: d(-60), endDate: d(30), status: 'ACTIVE' },
    { id: 's2', memberId: 'u7', planId: 'p4', startDate: d(-80), endDate: d(100), status: 'ACTIVE' },
    { id: 's3', memberId: 'u8', planId: 'p2', startDate: d(-25), endDate: d(5), status: 'ACTIVE' },
    { id: 's4', memberId: 'u9', planId: 'p5', startDate: d(-40), endDate: d(325), status: 'ACTIVE' },
    { id: 's5', memberId: 'u10', planId: 'p1', startDate: d(-45), endDate: d(-15), status: 'EXPIRED' },
    { id: 's6', memberId: 'u11', planId: 'p2', startDate: d(-10), endDate: d(20), status: 'ACTIVE' },
    { id: 's0', memberId: 'u6', planId: 'p1', startDate: d(-90), endDate: d(-60), status: 'EXPIRED' },
  ],
  sports: [
    { id: 'sp1', name: 'Gym', description: 'Thể hình với máy và tạ tự do', icon: '🏋️', color: '#2563eb' },
    { id: 'sp2', name: 'Yoga', description: 'Yoga, Pilates, thiền', icon: '🧘', color: '#9333ea' },
    { id: 'sp3', name: 'Boxing', description: 'Quyền anh và Kickboxing', icon: '🥊', color: '#dc2626' },
    { id: 'sp4', name: 'Bơi lội', description: 'Bơi cơ bản, nâng cao, bơi trẻ em', icon: '🏊', color: '#0891b2' },
    { id: 'sp5', name: 'Cầu lông', description: 'Sân cầu lông tiêu chuẩn, lớp kỹ thuật', icon: '🏸', color: '#16a34a' },
    { id: 'sp6', name: 'Tennis', description: 'Sân cứng, lớp thiếu niên & người lớn', icon: '🎾', color: '#ca8a04' },
    { id: 'sp7', name: 'Pickleball', description: 'Sân pickleball, đặt theo giờ', icon: '🏓', color: '#ea580c' },
    { id: 'sp8', name: 'Bóng rổ', description: 'Sân trong nhà, lớp trẻ em & giao lưu', icon: '🏀', color: '#f97316' },
    { id: 'sp9', name: 'Zumba', description: 'Nhảy Zumba, Aerobic đốt mỡ', icon: '💃', color: '#db2777' },
    { id: 'sp10', name: 'Bóng đá mini', description: 'Sân 5 người cỏ nhân tạo', icon: '⚽', color: '#15803d' },
  ],
  rooms: [
    { id: 'r1', name: 'Phòng Gym A', capacity: 40, location: 'Tầng 1', type: 'ROOM', sportId: 'sp1' },
    { id: 'r2', name: 'Phòng Yoga', capacity: 20, location: 'Tầng 2', type: 'ROOM', sportId: 'sp2' },
    { id: 'r3', name: 'Sàn Boxing', capacity: 15, location: 'Tầng 2', type: 'ROOM', sportId: 'sp3' },
    { id: 'r4', name: 'Hồ bơi', capacity: 25, location: 'Tầng hầm', type: 'ROOM', sportId: 'sp4' },
    { id: 'r5', name: 'Phòng Zumba', capacity: 30, location: 'Tầng 3', type: 'ROOM', sportId: 'sp9' },
    { id: 'r6', name: 'Sân cầu lông 1', capacity: 4, location: 'Nhà thi đấu A', type: 'COURT', sportId: 'sp5', hourlyRate: 120000 },
    { id: 'r7', name: 'Sân cầu lông 2', capacity: 4, location: 'Nhà thi đấu A', type: 'COURT', sportId: 'sp5', hourlyRate: 120000 },
    { id: 'r8', name: 'Sân cầu lông 3', capacity: 4, location: 'Nhà thi đấu A', type: 'COURT', sportId: 'sp5', hourlyRate: 120000 },
    { id: 'r9', name: 'Sân cầu lông 4', capacity: 4, location: 'Nhà thi đấu A', type: 'COURT', sportId: 'sp5', hourlyRate: 100000 },
    { id: 'r10', name: 'Sân tennis 1', capacity: 4, location: 'Khu ngoài trời', type: 'COURT', sportId: 'sp6', hourlyRate: 250000 },
    { id: 'r11', name: 'Sân tennis 2', capacity: 4, location: 'Khu ngoài trời', type: 'COURT', sportId: 'sp6', hourlyRate: 250000 },
    { id: 'r12', name: 'Sân pickleball 1', capacity: 4, location: 'Khu ngoài trời', type: 'COURT', sportId: 'sp7', hourlyRate: 150000 },
    { id: 'r13', name: 'Sân pickleball 2', capacity: 4, location: 'Khu ngoài trời', type: 'COURT', sportId: 'sp7', hourlyRate: 150000 },
    { id: 'r14', name: 'Sân bóng rổ', capacity: 12, location: 'Nhà thi đấu B', type: 'COURT', sportId: 'sp8', hourlyRate: 300000 },
    { id: 'r15', name: 'Sân bóng đá mini', capacity: 14, location: 'Khu ngoài trời', type: 'COURT', sportId: 'sp10', hourlyRate: 400000 },
  ],
  classes: [
    { id: 'c1', name: 'Gym cơ bản K12', sportId: 'sp1', roomId: 'r1', coachId: 'u3', capacity: 20, price: 800000, startDate: d(-30), endDate: d(60), status: 'OPEN' },
    { id: 'c2', name: 'Yoga buổi sáng', sportId: 'sp2', roomId: 'r2', coachId: 'u4', capacity: 15, price: 600000, startDate: d(-20), endDate: d(70), status: 'OPEN' },
    { id: 'c3', name: 'Boxing nâng cao', sportId: 'sp3', roomId: 'r3', coachId: 'u5', capacity: 10, price: 1200000, startDate: d(-10), endDate: d(80), status: 'OPEN' },
    { id: 'c4', name: 'Yoga trị liệu', sportId: 'sp2', roomId: 'r2', coachId: 'u4', capacity: 12, price: 900000, startDate: d(5), endDate: d(95), status: 'OPEN' },
    { id: 'c5', name: 'Bơi cơ bản', sportId: 'sp4', roomId: 'r4', coachId: 'u13', capacity: 15, price: 700000, startDate: d(10), endDate: d(100), status: 'OPEN' },
    { id: 'c6', name: 'Gym giảm mỡ K11', sportId: 'sp1', roomId: 'r1', coachId: 'u3', capacity: 20, price: 800000, startDate: d(-120), endDate: d(-30), status: 'CLOSED' },
    { id: 'c7', name: 'Cầu lông cơ bản K3', sportId: 'sp5', roomId: 'r6', coachId: 'u12', capacity: 8, price: 900000, startDate: d(-25), endDate: d(65), status: 'OPEN' },
    { id: 'c8', name: 'Tennis thiếu niên', sportId: 'sp6', roomId: 'r10', coachId: 'u14', capacity: 6, price: 1500000, startDate: d(-15), endDate: d(75), status: 'OPEN' },
    { id: 'c9', name: 'Zumba tối', sportId: 'sp9', roomId: 'r5', coachId: 'u4', capacity: 25, price: 500000, startDate: d(-20), endDate: d(70), status: 'OPEN' },
    { id: 'c10', name: 'Bóng rổ trẻ em U12', sportId: 'sp8', roomId: 'r14', coachId: 'u14', capacity: 12, price: 1000000, startDate: d(-12), endDate: d(78), status: 'OPEN' },
    { id: 'c11', name: 'Pickleball nhập môn', sportId: 'sp7', roomId: 'r12', coachId: 'u12', capacity: 8, price: 800000, startDate: d(3), endDate: d(60), status: 'OPEN' },
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
    { id: 'sc13', classId: 'c7', dayOfWeek: 2, startTime: '17:30', endTime: '19:00' },
    { id: 'sc14', classId: 'c7', dayOfWeek: 5, startTime: '17:30', endTime: '19:00' },
    { id: 'sc15', classId: 'c8', dayOfWeek: 6, startTime: '07:00', endTime: '08:30' },
    { id: 'sc16', classId: 'c8', dayOfWeek: 7, startTime: '07:00', endTime: '08:30' },
    { id: 'sc17', classId: 'c9', dayOfWeek: 1, startTime: '19:30', endTime: '20:30' },
    { id: 'sc18', classId: 'c9', dayOfWeek: 3, startTime: '19:30', endTime: '20:30' },
    { id: 'sc19', classId: 'c9', dayOfWeek: 5, startTime: '19:30', endTime: '20:30' },
    { id: 'sc20', classId: 'c10', dayOfWeek: 6, startTime: '09:00', endTime: '10:30' },
    { id: 'sc21', classId: 'c10', dayOfWeek: 7, startTime: '09:00', endTime: '10:30' },
    { id: 'sc22', classId: 'c11', dayOfWeek: 2, startTime: '06:30', endTime: '08:00' },
    { id: 'sc23', classId: 'c11', dayOfWeek: 4, startTime: '06:30', endTime: '08:00' },
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
    { id: 'e9', classId: 'c7', memberId: 'u7', enrolledAt: d(-20), status: 'ACTIVE' },
    { id: 'e10', classId: 'c9', memberId: 'u11', enrolledAt: d(-8), status: 'ACTIVE' },
    { id: 'e11', classId: 'c8', memberId: 'u9', enrolledAt: d(-12), status: 'ACTIVE' },
  ],
  payments: [
    { id: 'pay1', invoiceNo: 'INV-2026-0001', memberId: 'u6', amount: 400000, method: 'CASH', type: 'PLAN', refName: 'Gym 1 tháng', paidAt: dt(-90), createdBy: 'u2' },
    { id: 'pay2', invoiceNo: 'INV-2026-0002', memberId: 'u7', amount: 2900000, method: 'BANK', type: 'PLAN', refName: 'All-access 6 tháng', paidAt: dt(-80), createdBy: 'u2' },
    { id: 'pay3', invoiceNo: 'INV-2026-0003', memberId: 'u6', amount: 1650000, method: 'VNPAY', type: 'PLAN', refName: 'All-access 3 tháng', paidAt: dt(-60), createdBy: 'u6' },
    { id: 'pay4', invoiceNo: 'INV-2026-0004', memberId: 'u10', amount: 400000, method: 'CASH', type: 'PLAN', refName: 'Gym 1 tháng', paidAt: dt(-45), createdBy: 'u2' },
    { id: 'pay5', invoiceNo: 'INV-2026-0005', memberId: 'u9', amount: 4900000, method: 'MOMO', type: 'PLAN', refName: 'All-access 1 năm', paidAt: dt(-40), createdBy: 'u9' },
    { id: 'pay6', invoiceNo: 'INV-2026-0006', memberId: 'u6', amount: 800000, method: 'CASH', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-28), createdBy: 'u2' },
    { id: 'pay7', invoiceNo: 'INV-2026-0007', memberId: 'u7', amount: 800000, method: 'VNPAY', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-27), createdBy: 'u7' },
    { id: 'pay8', invoiceNo: 'INV-2026-0008', memberId: 'u8', amount: 650000, method: 'CASH', type: 'PLAN', refName: 'All-access 1 tháng', paidAt: dt(-25), createdBy: 'u2' },
    { id: 'pay9', invoiceNo: 'INV-2026-0009', memberId: 'u9', amount: 800000, method: 'BANK', type: 'CLASS', refName: 'Gym cơ bản K12', paidAt: dt(-25), createdBy: 'u2' },
    { id: 'pay10', invoiceNo: 'INV-2026-0010', memberId: 'u6', amount: 600000, method: 'CASH', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-18), createdBy: 'u2' },
    { id: 'pay11', invoiceNo: 'INV-2026-0011', memberId: 'u8', amount: 600000, method: 'MOMO', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-17), createdBy: 'u8' },
    { id: 'pay12', invoiceNo: 'INV-2026-0012', memberId: 'u9', amount: 1200000, method: 'VNPAY', type: 'CLASS', refName: 'Boxing nâng cao', paidAt: dt(-9), createdBy: 'u9' },
    { id: 'pay13', invoiceNo: 'INV-2026-0013', memberId: 'u11', amount: 650000, method: 'CASH', type: 'PLAN', refName: 'All-access 1 tháng', paidAt: dt(-10), createdBy: 'u2' },
    { id: 'pay14', invoiceNo: 'INV-2026-0014', memberId: 'u11', amount: 600000, method: 'CASH', type: 'CLASS', refName: 'Yoga buổi sáng', paidAt: dt(-5), createdBy: 'u2' },
  ],
  supportRequests: [
    { id: 'sr1', memberId: 'u6', title: 'Đổi lịch lớp Yoga', content: 'Em muốn chuyển sang ca chiều được không ạ?', status: 'OPEN', createdAt: dt(-2) },
    { id: 'sr2', memberId: 'u9', title: 'Hỏng tủ đồ', content: 'Tủ số 15 bị kẹt khóa.', status: 'IN_PROGRESS', createdAt: dt(-4), handledBy: 'u2' },
    { id: 'sr3', memberId: 'u7', title: 'Xuất hóa đơn VAT', content: 'Cần hóa đơn đỏ cho gói 6 tháng.', status: 'RESOLVED', createdAt: dt(-20), handledBy: 'u2' },
  ],
  notifications: [
    { id: 'n1', userId: 'u8', title: 'Gói tập sắp hết hạn', content: 'Gói All-access 1 tháng của bạn sẽ hết hạn sau 5 ngày. Gia hạn ngay để không gián đoạn.', read: false, createdAt: dt(-1) },
    { id: 'n2', userId: 'u6', title: 'Thay đổi lịch học', content: 'Lớp Yoga buổi sáng thứ 4 tuần này dời sang 07:00.', read: false, createdAt: dt(-1, 14) },
    { id: 'n3', userId: 'u6', title: 'Bài tập về nhà', content: 'HLV Lê Văn An đã giao bài tập: 3 hiệp plank 60s mỗi ngày.', read: true, createdAt: dt(-3) },
    { id: 'n4', userId: 'u3', title: 'Phân công lớp mới', content: 'Bạn được phân công phụ trách lớp Gym cơ bản K12.', read: true, createdAt: dt(-30) },
    { id: 'n5', userId: 'u1', title: 'Yêu cầu hỗ trợ mới', content: 'Có 1 yêu cầu hỗ trợ mới cần xử lý.', read: false, createdAt: dt(-2) },
  ],
  auditLogs: [
    { id: 'a1', userId: 'u1', action: 'CREATE', entity: 'Class', entityId: 'c4', detail: 'Tạo lớp Yoga trị liệu', createdAt: dt(-6) },
    { id: 'a2', userId: 'u1', action: 'ASSIGN_COACH', entity: 'Class', entityId: 'c4', detail: 'Phân công Phạm Thanh Bình', createdAt: dt(-6, 10) },
    { id: 'a3', userId: 'u2', action: 'PAYMENT', entity: 'Payment', entityId: 'pay13', detail: 'Thu 650.000đ tiền mặt - All-access 1 tháng', createdAt: dt(-10) },
    { id: 'a4', userId: 'u1', action: 'LOCK_USER', entity: 'User', entityId: 'u10', detail: 'Khóa tài khoản Lý Minh Khánh (nợ phí)', createdAt: dt(-12) },
    { id: 'a5', userId: 'u2', action: 'RENEW', entity: 'Subscription', entityId: 's1', detail: 'Gia hạn All-access 3 tháng cho Hoàng Thị Dung', createdAt: dt(-60) },
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
    { id: 'tr1', sessionId: 'ss1', memberId: 'u6', coachId: 'u3', metrics: 'Squat 37.5kg · Plank 70s · Chạy 3km 18.2 phút', note: 'Kỹ thuật squat ổn, cần giữ lưng thẳng hơn.', effort: 6, entries: [{ name: 'Squat', value: 37.5, unit: 'kg' }, { name: 'Plank', value: 70, unit: 's' }, { name: 'Chạy 3km', value: 18.2, unit: 'phút' }] },
    { id: 'tr2', sessionId: 'ss3', memberId: 'u6', coachId: 'u3', metrics: 'Squat 40kg · Plank 80s · Chạy 3km 17.8 phút', note: 'Tiến bộ tốt, đã tăng tạ.', effort: 7, entries: [{ name: 'Squat', value: 40, unit: 'kg' }, { name: 'Plank', value: 80, unit: 's' }, { name: 'Chạy 3km', value: 17.8, unit: 'phút' }] },
    { id: 'tr3', sessionId: 'ss1', memberId: 'u7', coachId: 'u3', metrics: 'Bench Press 60kg · Deadlift 80kg', note: 'Mạnh, có thể lên nhóm nâng cao.', effort: 8, entries: [{ name: 'Bench Press', value: 60, unit: 'kg' }, { name: 'Deadlift', value: 80, unit: 'kg' }] },
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
  courtBookings: [],
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
const GOALS = ['Giảm 3-5kg', 'Tăng cơ, cải thiện sức mạnh', 'Cải thiện sức bền tim mạch', 'Giảm mỡ bụng', 'Tăng dẻo dai, giảm đau lưng', 'Giữ dáng, giảm stress', 'Học boxing tự vệ', 'Chuẩn bị chạy half-marathon', 'Chơi cầu lông giao lưu cuối tuần', 'Học tennis từ đầu', 'Bơi được 500m liên tục', 'Cải thiện thể lực chơi bóng rổ'];
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
    // Lớp học: 45% đăng ký 1 lớp đang mở mà gói hiện tại cho phép
    const curPlan = data.plans.find((p) => p.id === subscriptions.filter((x) => x.memberId === id).slice(-1)[0]?.planId);
    const allowed = data.classes.filter((c) => c.status === 'OPEN' && c.startDate <= d(0) && (!curPlan || curPlan.sportIds.length === 0 || curPlan.sportIds.includes(c.sportId)));
    if (rnd() < 0.45 && allowed.length) {
      const cls = pick(allowed);
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
  // Chỉ số theo bộ môn, tiến bộ dần theo từng buổi cho mỗi học viên
  const lastVal = new Map<string, number>();
  const NOTES = ['Kỹ thuật ổn định.', 'Cần giữ lưng thẳng hơn.', 'Tiến bộ rõ so với tuần trước.', 'Hơi mệt, giảm khối lượng buổi sau.', 'Nhịp thở tốt, giữ tempo đều.', 'Tập trung hơn ở nửa sau buổi.', 'Đã đạt mức mục tiêu tuần này.', 'Khởi động chưa kỹ, lần sau vào sớm 5 phút.'];
  const makeResult = (memberId: string, sportName: string) => {
    const defs = SPORT_METRICS[sportKeyOf(sportName)];
    const picked = defs.filter(() => rnd() < 0.7).slice(0, 3);
    const use = picked.length ? picked : [defs[0]];
    const entries: ResultEntry[] = use.map((d) => {
      const k = `${memberId}|${d.name}`;
      const prev = lastVal.get(k);
      let v = prev === undefined ? d.min + rnd() * (d.max - d.min) * 0.5 : prev + (d.higherIsBetter ? 1 : -1) * d.step * (rnd() < 0.75 ? rnd() * 1.4 : -rnd() * 0.5);
      v = Math.round(v / (d.decimals ? 0.1 : d.step >= 1 ? 1 : d.step)) * (d.decimals ? 0.1 : d.step >= 1 ? 1 : d.step);
      v = Math.round(v * 10) / 10;
      lastVal.set(k, v);
      return { name: d.name, value: v, unit: d.unit };
    });
    return { entries, metrics: entriesToString(entries), effort: between(5, 9), note: pick(NOTES) };
  };
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
        if (st !== 'ABSENT' && cls.coachId && rnd() < 0.45) {
          trainingResults.push({ id: `tr${sid}_${e.memberId}`, sessionId: sid, memberId: e.memberId, coachId: cls.coachId, ...makeResult(e.memberId, data.sports.find((x) => x.id === cls.sportId)?.name ?? 'Gym') });
        }
      }
    }
  }

  // Đồng bộ các kết quả seed (ngày gần đây) với chuỗi tiến bộ đã sinh để biểu đồ tăng dần hợp lý
  for (const r of [...data.trainingResults].sort((x, y) => (sessions.find((s) => s.id === x.sessionId)?.date ?? '').localeCompare(sessions.find((s) => s.id === y.sessionId)?.date ?? ''))) {
    if (!r.entries) continue;
    r.entries = r.entries.map((e) => {
      const k = `${r.memberId}|${e.name}`; const d = Object.values(SPORT_METRICS).flat().find((m) => m.name === e.name); const prev = lastVal.get(k);
      if (prev === undefined || !d) { lastVal.set(k, e.value); return e; }
      const v = Math.round((prev + (d.higherIsBetter ? 1 : -1) * d.step * 1.2) * 10) / 10;
      lastVal.set(k, v); return { ...e, value: v };
    });
    r.metrics = entriesToString(r.entries);
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

  // 5) Đặt sân theo giờ: 30 ngày qua + 7 ngày tới
  const courtBookings: AppData['courtBookings'] = [];
  const courts = data.rooms.filter((r) => r.type === 'COURT');
  const members = users.filter((u) => u.role === 'MEMBER' && u.status === 'ACTIVE');
  const bookedKey = new Set<string>();
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
  for (let off = -30; off <= 7; off++) {
    const date = dayjs().add(off, 'day');
    const ds = date.format('YYYY-MM-DD');
    const dow = ((date.day() + 6) % 7) + 1;
    const weekend = dow >= 6;
    const n = weekend ? between(6, 10) : between(3, 6);
    for (let k = 0; k < n; k++) {
      const court = pick(courts);
      const startH = pick(weekend ? [6, 7, 8, 9, 15, 16, 17, 18, 19] : [6, 7, 17, 18, 19, 20]);
      const hours = rnd() < 0.7 ? 1 : 2;
      if (bookedKey.has(`${court.id}|${ds}|${startH}`) || bookedKey.has(`${court.id}|${ds}|${startH + 1}`)) continue;
      // tránh trùng lớp học đang dùng sân
      const clash = data.schedules.some((sc) => sc.dayOfWeek === dow && data.classes.some((c) => c.id === sc.classId && c.roomId === court.id && c.status === 'OPEN') && sc.startTime < hh(startH + hours) && hh(startH) < sc.endTime);
      if (clash) continue;
      for (let h = 0; h < hours; h++) bookedKey.add(`${court.id}|${ds}|${startH + h}`);
      const m = pick(members);
      const sub = subscriptions.find((x) => x.memberId === m.id && x.status === 'ACTIVE');
      const plan = data.plans.find((p) => p.id === sub?.planId);
      const discount = plan?.courtDiscount ?? 0;
      const price = Math.round((court.hourlyRate ?? 0) * hours * (100 - discount) / 100 / 1000) * 1000;
      const id = `cb${court.id}_${off + 30}_${k}`;
      const status = off < 0 ? (rnd() < 0.08 ? 'CANCELLED' : 'COMPLETED') : off === 0 && startH + hours <= dayjs().hour() ? 'COMPLETED' : 'BOOKED';
      const method = pick([...METHODS]);
      const created = dt(Math.min(off, 0) - between(0, 3), between(8, 21));
      courtBookings.push({ id, courtId: court.id, memberId: m.id, date: ds, startTime: hh(startH), endTime: hh(startH + hours), price, status, createdAt: created, createdBy: method === 'CASH' ? 'u2' : m.id });
      if (status !== 'CANCELLED') payments.push({ id: `pay${id}`, invoiceNo: '', memberId: m.id, amount: price, method, type: 'COURT', refName: `${court.name} · ${date.format('DD/MM')} ${hh(startH)}–${hh(startH + hours)}`, paidAt: created, createdBy: method === 'CASH' ? 'u2' : m.id });
    }
  }
  payments.sort((a, b) => a.paidAt.localeCompare(b.paidAt)).forEach((p, i) => { p.invoiceNo = `INV-${dayjs().format('YYYY')}-${String(i + 1).padStart(4, '0')}`; });

  auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...data, users, subscriptions, payments, enrollments, checkIns, auditLogs, notifications, sessions, attendances, trainingResults, bodyMetrics, courtBookings };
}

export const initialData: AppData = generate(base);
