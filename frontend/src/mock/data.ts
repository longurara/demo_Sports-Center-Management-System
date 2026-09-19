import dayjs from 'dayjs';
import type { AppData, Booking, Order, OrderItem, PaymentMethod, ResultEntry, WalletTransaction } from '../types';
import { SPORT_METRICS, entriesToString } from '../utils/results';
import { sportKeyOf } from '../utils/aiPlan';
import { classDates, generateSessions } from '../utils/classes';
import { dowOf, overlap, packageDates } from '../utils/slots';

const d = (offsetDays: number) => dayjs().add(offsetDays, 'day').format('YYYY-MM-DD');
const dt = (offsetDays: number, h = 9) => dayjs().add(offsetDays, 'day').hour(h).minute(0).format('YYYY-MM-DD HH:mm');
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

const base: AppData = {
  settings: { openTime: '06:00', closeTime: '22:00', slotMinutes: 60, maxAdvanceBookingDays: 14, bookingCancelDeadlineHours: 2, courseCancelDeadlineDays: 3, timezone: 'Asia/Ho_Chi_Minh' },
  users: [
    { id: 'u1', email: 'manager@sc.vn', fullName: 'Trần Thị Hồng Minh', phone: '0901000001', role: 'MANAGER', status: 'ACTIVE', createdAt: d(-200), staffNotes: 'Manager seed' },
    { id: 'u2', email: 'reception@sc.vn', fullName: 'Nguyễn Lễ Tân', phone: '0901000002', role: 'RECEPTIONIST', status: 'ACTIVE', createdAt: d(-150), staffNotes: 'Ca sáng T2–T6' },
    { id: 'u3', email: 'coach.an@sc.vn', fullName: 'Lê Văn An', phone: '0901000003', role: 'COACH', status: 'ACTIVE', specialty: 'NASM-CPT · Bodybuilding', experience: '8 năm', bio: '8 năm kinh nghiệm huấn luyện thể hình, chứng chỉ NASM-CPT.', createdAt: d(-180) },
    { id: 'u4', email: 'coach.binh@sc.vn', fullName: 'Phạm Thanh Bình', phone: '0901000004', role: 'COACH', status: 'ACTIVE', specialty: 'RYT-500 · Pilates', experience: '6 năm', bio: 'Giảng viên Yoga quốc tế RYT-500.', createdAt: d(-170) },
    { id: 'u5', email: 'coach.cuong@sc.vn', fullName: 'Đỗ Mạnh Cường', phone: '0901000005', role: 'COACH', status: 'ACTIVE', specialty: 'Kickboxing · Cựu VĐV QG', experience: '10 năm', bio: 'Cựu VĐV quyền anh đội tuyển quốc gia.', createdAt: d(-160) },
    { id: 'u12', email: 'coach.duy@sc.vn', fullName: 'Nguyễn Anh Duy', phone: '0901000012', role: 'COACH', status: 'ACTIVE', specialty: 'HLV cầu lông cấp 1 · Pickleball', experience: '6 năm', bio: 'Cựu VĐV cầu lông TP.HCM, 6 năm huấn luyện phong trào và thiếu niên.', createdAt: d(-140) },
    { id: 'u13', email: 'coach.hanh@sc.vn', fullName: 'Trần Mỹ Hạnh', phone: '0901000013', role: 'COACH', status: 'ACTIVE', specialty: 'Bơi lội · Cứu hộ bậc 2', experience: '5 năm', bio: 'Chứng chỉ HLV bơi Liên đoàn Thể thao dưới nước, chuyên bơi cơ bản cho trẻ em và người lớn.', createdAt: d(-130) },
    { id: 'u14', email: 'coach.khoa@sc.vn', fullName: 'Lâm Đăng Khoa', phone: '0901000014', role: 'COACH', status: 'ACTIVE', specialty: 'Tennis ITF Level 1 · Bóng rổ', experience: '7 năm', bio: 'HLV tennis và bóng rổ học đường, tập trung kỹ thuật nền tảng và thể lực chuyên môn.', createdAt: d(-120) },
    { id: 'u15', email: 'coach.hieu@sc.vn', fullName: 'Võ Trung Hiếu', phone: '0901000015', role: 'COACH', status: 'INACTIVE', specialty: 'CrossFit L1', experience: '3 năm', bio: 'Đã nghỉ việc từ tháng trước.', createdAt: d(-110) },
    { id: 'u6', email: 'member.dung@gmail.com', fullName: 'Hoàng Thị Dung', phone: '0912000001', role: 'MEMBER', status: 'ACTIVE', dob: '1998-05-12', gender: 'FEMALE', address: '12 Lê Lợi, Q.1', emergencyContact: 'Hoàng Văn Tài · 0909 111 222', goal: 'Giảm 5kg trong 3 tháng', level: 'BEGINNER', healthNote: 'Không', walletBalance: 0, createdAt: d(-90) },
    { id: 'u7', email: 'member.em@gmail.com', fullName: 'Vũ Quang Em', phone: '0912000002', role: 'MEMBER', status: 'ACTIVE', dob: '1995-11-03', gender: 'MALE', address: '45 Võ Văn Ngân, Thủ Đức', goal: 'Tăng cơ, tăng 4kg', level: 'INTERMEDIATE', walletBalance: 0, createdAt: d(-80) },
    { id: 'u8', email: 'member.giang@gmail.com', fullName: 'Ngô Hương Giang', phone: '0912000003', role: 'MEMBER', status: 'ACTIVE', dob: '2001-02-20', gender: 'FEMALE', goal: 'Cải thiện dẻo dai', level: 'BEGINNER', walletBalance: 0, createdAt: d(-60) },
    { id: 'u9', email: 'member.hai@gmail.com', fullName: 'Bùi Đức Hải', phone: '0912000004', role: 'MEMBER', status: 'ACTIVE', dob: '1990-07-07', gender: 'MALE', address: '8 Nguyễn Huệ, Q.1', goal: 'Giữ dáng, tăng sức bền', level: 'ADVANCED', walletBalance: 0, createdAt: d(-40) },
    { id: 'u10', email: 'member.khanh@gmail.com', fullName: 'Lý Minh Khánh', phone: '0912000005', role: 'MEMBER', status: 'BANNED', dob: '1999-09-09', gender: 'MALE', goal: 'Học boxing cơ bản', level: 'BEGINNER', walletBalance: 0, createdAt: d(-30) },
    { id: 'u11', email: 'member.lan@gmail.com', fullName: 'Đặng Ngọc Lan', phone: '0912000006', role: 'MEMBER', status: 'ACTIVE', dob: '1997-03-15', gender: 'FEMALE', goal: 'Giảm mỡ bụng', level: 'INTERMEDIATE', healthNote: 'Đau khớp gối nhẹ', walletBalance: 0, createdAt: d(-10) },
  ],
  coachSpecializations: [
    { id: 'cs1', coachId: 'u3', sportId: 'sp1', status: 'APPROVED', createdAt: dt(-179), reviewedAt: dt(-178), reviewedBy: 'u1' },
    { id: 'cs2', coachId: 'u4', sportId: 'sp2', status: 'APPROVED', createdAt: dt(-169), reviewedAt: dt(-168), reviewedBy: 'u1' },
    { id: 'cs3', coachId: 'u4', sportId: 'sp9', status: 'APPROVED', createdAt: dt(-169), reviewedAt: dt(-168), reviewedBy: 'u1' },
    { id: 'cs4', coachId: 'u5', sportId: 'sp3', status: 'APPROVED', createdAt: dt(-159), reviewedAt: dt(-158), reviewedBy: 'u1' },
    { id: 'cs5', coachId: 'u5', sportId: 'sp1', status: 'APPROVED', createdAt: dt(-159), reviewedAt: dt(-158), reviewedBy: 'u1' },
    { id: 'cs6', coachId: 'u12', sportId: 'sp5', status: 'APPROVED', createdAt: dt(-139), reviewedAt: dt(-138), reviewedBy: 'u1' },
    { id: 'cs7', coachId: 'u12', sportId: 'sp7', status: 'APPROVED', createdAt: dt(-139), reviewedAt: dt(-138), reviewedBy: 'u1' },
    { id: 'cs8', coachId: 'u13', sportId: 'sp4', status: 'APPROVED', createdAt: dt(-129), reviewedAt: dt(-128), reviewedBy: 'u1' },
    { id: 'cs9', coachId: 'u14', sportId: 'sp6', status: 'APPROVED', createdAt: dt(-119), reviewedAt: dt(-118), reviewedBy: 'u1' },
    { id: 'cs10', coachId: 'u14', sportId: 'sp8', status: 'APPROVED', createdAt: dt(-119), reviewedAt: dt(-118), reviewedBy: 'u1' },
    { id: 'cs11', coachId: 'u14', sportId: 'sp10', status: 'APPROVED', createdAt: dt(-119), reviewedAt: dt(-118), reviewedBy: 'u1' },
    { id: 'cs12', coachId: 'u3', sportId: 'sp3', status: 'PENDING', note: 'Có chứng chỉ Kickboxing cơ bản 2025', createdAt: dt(-2) },
    { id: 'cs13', coachId: 'u13', sportId: 'sp1', status: 'REJECTED', note: 'Muốn dạy thêm gym', createdAt: dt(-30), reviewedAt: dt(-29), reviewedBy: 'u1' },
    { id: 'cs14', coachId: 'u12', sportId: 'sp6', status: 'PENDING', note: 'Đã hoàn thành khóa ITF Play & Stay', createdAt: dt(-1) },
    { id: 'cs15', coachId: 'u15', sportId: 'sp1', status: 'APPROVED', createdAt: dt(-109), reviewedAt: dt(-108), reviewedBy: 'u1' },
  ],
  plans: [
    { id: 'p1', name: 'Gym 1 tháng', price: 400000, durationDays: 30, description: 'Vào gym không giới hạn giờ mở cửa', gymAccess: true, bookingDiscountPct: 10, classDiscountPct: 0, freeBookingSlotsPerMonth: 0, active: true },
    { id: 'p2', name: 'Standard 1 tháng', price: 650000, durationDays: 30, description: 'Gym + ưu đãi đặt sân và học phí, 2 slot sân miễn phí/tháng', gymAccess: true, bookingDiscountPct: 20, classDiscountPct: 10, freeBookingSlotsPerMonth: 2, active: true },
    { id: 'p3', name: 'Standard 3 tháng', price: 1650000, durationDays: 90, description: 'Như Standard 1 tháng, tiết kiệm 15%, 4 slot sân miễn phí/tháng', gymAccess: true, bookingDiscountPct: 25, classDiscountPct: 10, freeBookingSlotsPerMonth: 4, active: true },
    { id: 'p4', name: 'Premium 6 tháng', price: 2900000, durationDays: 180, description: 'Gym, giảm sâu đặt sân & học phí, 6 slot sân miễn phí/tháng, tủ đồ riêng', gymAccess: true, bookingDiscountPct: 30, classDiscountPct: 15, freeBookingSlotsPerMonth: 6, active: true },
    { id: 'p5', name: 'Premium 1 năm', price: 4900000, durationDays: 365, description: 'Toàn bộ quyền lợi Premium, 8 slot sân miễn phí/tháng, đo InBody hàng tháng', gymAccess: true, bookingDiscountPct: 40, classDiscountPct: 20, freeBookingSlotsPerMonth: 8, active: true },
    { id: 'p6', name: 'Court Lover 1 tháng', price: 450000, durationDays: 30, description: 'Dành cho người chơi sân: giảm 30% đặt sân, 4 slot miễn phí/tháng, không gym', gymAccess: false, bookingDiscountPct: 30, classDiscountPct: 0, freeBookingSlotsPerMonth: 4, active: true },
    { id: 'p7', name: 'Class Pass 3 tháng', price: 1200000, durationDays: 90, description: 'Giảm 25% học phí mọi lớp, giảm 10% đặt sân', gymAccess: false, bookingDiscountPct: 10, classDiscountPct: 25, freeBookingSlotsPerMonth: 0, active: true },
    { id: 'p8', name: 'Gói sinh viên (cũ)', price: 350000, durationDays: 30, description: 'Ưu đãi sinh viên — đã ngừng bán', gymAccess: true, bookingDiscountPct: 0, classDiscountPct: 0, freeBookingSlotsPerMonth: 0, active: false },
  ],
  subscriptions: [
    { id: 's0', memberId: 'u6', planId: 'p1', startDate: d(-90), endDate: d(-60), status: 'EXPIRED', autoRenew: false },
    { id: 's1', memberId: 'u6', planId: 'p3', startDate: d(-60), endDate: d(30), status: 'ACTIVE', autoRenew: true },
    { id: 's2', memberId: 'u7', planId: 'p4', startDate: d(-80), endDate: d(100), status: 'ACTIVE', autoRenew: false },
    { id: 's3', memberId: 'u8', planId: 'p2', startDate: d(-25), endDate: d(5), status: 'ACTIVE', autoRenew: true },
    { id: 's4', memberId: 'u9', planId: 'p5', startDate: d(-40), endDate: d(325), status: 'ACTIVE', autoRenew: false },
    { id: 's5', memberId: 'u10', planId: 'p1', startDate: d(-45), endDate: d(-15), status: 'EXPIRED', autoRenew: false },
    { id: 's6', memberId: 'u11', planId: 'p2', startDate: d(-10), endDate: d(20), status: 'ACTIVE', autoRenew: false },
    { id: 's7', memberId: 'u8', planId: 'p6', startDate: d(-70), endDate: d(-40), status: 'CANCELLED', autoRenew: false },
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
    { id: 'r1', name: 'Phòng Gym A', type: 'GYM', capacity: 20, location: 'Tầng 1', sportIds: ['sp1'], pricePerSlot: 50000, isActive: true },
    { id: 'r2', name: 'Phòng Yoga', type: 'ROOM', capacity: 1, location: 'Tầng 2', sportIds: ['sp2', 'sp9'], pricePerSlot: 200000, isActive: true },
    { id: 'r3', name: 'Sàn Boxing', type: 'ROOM', capacity: 1, location: 'Tầng 2', sportIds: ['sp3'], pricePerSlot: 250000, isActive: true },
    { id: 'r4', name: 'Hồ bơi', type: 'ROOM', capacity: 15, location: 'Tầng hầm', sportIds: ['sp4'], pricePerSlot: 60000, isActive: true },
    { id: 'r5', name: 'Phòng đa năng', type: 'ROOM', capacity: 1, location: 'Tầng 3', sportIds: ['sp9', 'sp2'], pricePerSlot: 200000, isActive: true },
    { id: 'r6', name: 'Sân cầu lông 1', type: 'COURT', capacity: 1, location: 'Nhà thi đấu A', sportIds: ['sp5'], pricePerSlot: 120000, isActive: true },
    { id: 'r7', name: 'Sân cầu lông 2', type: 'COURT', capacity: 1, location: 'Nhà thi đấu A', sportIds: ['sp5'], pricePerSlot: 120000, isActive: true },
    { id: 'r8', name: 'Sân cầu lông 3', type: 'COURT', capacity: 1, location: 'Nhà thi đấu A', sportIds: ['sp5'], pricePerSlot: 120000, isActive: true },
    { id: 'r9', name: 'Sân cầu lông 4', type: 'COURT', capacity: 1, location: 'Nhà thi đấu A', sportIds: ['sp5'], pricePerSlot: 100000, isActive: true },
    { id: 'r10', name: 'Sân tennis 1', type: 'COURT', capacity: 1, location: 'Khu ngoài trời', sportIds: ['sp6'], pricePerSlot: 250000, isActive: true },
    { id: 'r11', name: 'Sân tennis 2', type: 'COURT', capacity: 1, location: 'Khu ngoài trời', sportIds: ['sp6'], pricePerSlot: 250000, isActive: true },
    { id: 'r12', name: 'Sân pickleball 1', type: 'COURT', capacity: 1, location: 'Khu ngoài trời', sportIds: ['sp7'], pricePerSlot: 150000, isActive: true },
    { id: 'r13', name: 'Sân pickleball 2', type: 'COURT', capacity: 1, location: 'Khu ngoài trời', sportIds: ['sp7'], pricePerSlot: 150000, isActive: true },
    { id: 'r14', name: 'Sân bóng rổ', type: 'COURT', capacity: 1, location: 'Nhà thi đấu B', sportIds: ['sp8'], pricePerSlot: 300000, isActive: true },
    { id: 'r15', name: 'Sân bóng đá mini', type: 'FIELD', capacity: 1, location: 'Khu ngoài trời', sportIds: ['sp10'], pricePerSlot: 400000, isActive: true },
    { id: 'r16', name: 'Sân cầu lông 5', type: 'COURT', capacity: 1, location: 'Nhà thi đấu A', sportIds: ['sp5'], pricePerSlot: 120000, isActive: false },
    { id: 'r17', name: 'Phòng Gym B (cũ)', type: 'GYM', capacity: 10, location: 'Tầng 1', sportIds: ['sp1'], pricePerSlot: 40000, isActive: false, deletedAt: dt(-100) },
  ],
  maintenances: [
    { id: 'm1', roomId: 'r10', from: dt(3, 8), to: dt(4, 18), reason: 'Thay mặt sân, sơn lại vạch', createdBy: 'u1', createdAt: dt(-2) },
    { id: 'm2', roomId: 'r4', from: dt(-20, 6), to: dt(-18, 22), reason: 'Vệ sinh hồ định kỳ', createdBy: 'u1', createdAt: dt(-25) },
  ],
  courses: [
    { id: 'co1', sportId: 'sp1', name: 'Gym cơ bản', description: 'Làm quen máy, kỹ thuật squat/deadlift, lịch full body 3 buổi/tuần.', totalSessions: 24, price: 800000, active: true },
    { id: 'co2', sportId: 'sp2', name: 'Yoga buổi sáng', description: 'Hatha & Vinyasa cho người mới, 3 buổi/tuần.', totalSessions: 36, price: 600000, active: true },
    { id: 'co3', sportId: 'sp3', name: 'Boxing nâng cao', description: 'Kỹ thuật tổ hợp, sparring có kiểm soát.', totalSessions: 20, price: 1200000, active: true },
    { id: 'co4', sportId: 'sp2', name: 'Yoga trị liệu', description: 'Giảm đau lưng, cổ vai gáy; nhịp chậm.', totalSessions: 16, price: 900000, active: true },
    { id: 'co5', sportId: 'sp4', name: 'Bơi cơ bản', description: 'Nổi, thở nước, bơi ếch & sải cơ bản.', totalSessions: 16, price: 700000, active: true },
    { id: 'co6', sportId: 'sp1', name: 'Gym giảm mỡ', description: 'Circuit + cardio, theo dõi InBody.', totalSessions: 24, price: 800000, active: true },
    { id: 'co7', sportId: 'sp5', name: 'Cầu lông cơ bản', description: 'Cầm vợt, di chuyển, phát cầu, đánh cầu cao sâu.', totalSessions: 20, price: 900000, active: true },
    { id: 'co8', sportId: 'sp6', name: 'Tennis thiếu niên', description: 'Kỹ thuật nền tảng cho 10–16 tuổi.', totalSessions: 20, price: 1500000, active: true },
    { id: 'co9', sportId: 'sp9', name: 'Zumba tối', description: 'Zumba đốt mỡ, nhạc Latin.', totalSessions: 24, price: 500000, active: true },
    { id: 'co10', sportId: 'sp8', name: 'Bóng rổ trẻ em U12', description: 'Dẫn bóng, chuyền, ném rổ, trò chơi đội.', totalSessions: 20, price: 1000000, active: true },
    { id: 'co11', sportId: 'sp7', name: 'Pickleball nhập môn', description: 'Luật, kỹ thuật dink & serve.', totalSessions: 12, price: 800000, active: true },
    { id: 'co12', sportId: 'sp3', name: 'Boxing cơ bản', description: 'Thế đứng, jab-cross, di chuyển, đấm bao.', totalSessions: 12, price: 900000, active: true },
    { id: 'co13', sportId: 'sp1', name: 'Gym sức mạnh (cũ)', description: 'Đã ngừng mở lớp.', totalSessions: 24, price: 1000000, active: false },
  ],
  classes: [
    { id: 'c1', courseId: 'co1', name: 'Gym cơ bản K12', sportId: 'sp1', roomId: 'r1', coachId: 'u3', minStudents: 5, capacity: 20, minStudentsOverride: false, startDate: d(-30), endDate: d(60), status: 'OPEN' },
    { id: 'c2', courseId: 'co2', name: 'Yoga buổi sáng K1', sportId: 'sp2', roomId: 'r2', coachId: 'u4', minStudents: 4, capacity: 15, minStudentsOverride: false, startDate: d(-20), endDate: d(70), status: 'OPEN' },
    { id: 'c3', courseId: 'co3', name: 'Boxing nâng cao K2', sportId: 'sp3', roomId: 'r3', coachId: 'u5', minStudents: 4, capacity: 10, minStudentsOverride: false, startDate: d(-10), endDate: d(80), status: 'OPEN' },
    { id: 'c4', courseId: 'co4', name: 'Yoga trị liệu K3', sportId: 'sp2', roomId: 'r2', coachId: 'u4', minStudents: 4, capacity: 12, minStudentsOverride: false, startDate: d(5), endDate: d(95), status: 'OPEN' },
    { id: 'c5', courseId: 'co5', name: 'Bơi cơ bản K5', sportId: 'sp4', roomId: 'r4', coachId: 'u13', minStudents: 5, capacity: 15, minStudentsOverride: false, startDate: d(10), endDate: d(100), status: 'OPEN' },
    { id: 'c6', courseId: 'co6', name: 'Gym giảm mỡ K11', sportId: 'sp1', roomId: 'r1', coachId: 'u3', minStudents: 5, capacity: 20, minStudentsOverride: false, startDate: d(-120), endDate: d(-30), status: 'OPEN' },
    { id: 'c7', courseId: 'co7', name: 'Cầu lông cơ bản K3', sportId: 'sp5', roomId: 'r6', coachId: 'u12', minStudents: 4, capacity: 8, minStudentsOverride: false, startDate: d(-25), endDate: d(65), status: 'OPEN' },
    { id: 'c8', courseId: 'co8', name: 'Tennis thiếu niên K2', sportId: 'sp6', roomId: 'r10', coachId: 'u14', minStudents: 3, capacity: 6, minStudentsOverride: false, startDate: d(-15), endDate: d(75), status: 'OPEN' },
    { id: 'c9', courseId: 'co9', name: 'Zumba tối K4', sportId: 'sp9', roomId: 'r5', coachId: 'u4', minStudents: 6, capacity: 25, minStudentsOverride: false, startDate: d(-20), endDate: d(70), status: 'OPEN' },
    { id: 'c10', courseId: 'co10', name: 'Bóng rổ U12 K1', sportId: 'sp8', roomId: 'r14', coachId: 'u14', minStudents: 5, capacity: 12, minStudentsOverride: false, startDate: d(-12), endDate: d(78), status: 'OPEN' },
    { id: 'c11', courseId: 'co11', name: 'Pickleball nhập môn K1', sportId: 'sp7', roomId: 'r12', coachId: 'u12', minStudents: 4, capacity: 8, minStudentsOverride: false, startDate: d(3), endDate: d(60), status: 'OPEN' },
    { id: 'c12', courseId: 'co12', name: 'Boxing cơ bản K1', sportId: 'sp3', roomId: 'r3', minStudents: 4, capacity: 12, minStudentsOverride: false, startDate: d(14), endDate: d(60), status: 'DRAFT' },
    { id: 'c13', courseId: 'co2', name: 'Yoga buổi sáng K2', sportId: 'sp2', roomId: 'r5', coachId: 'u4', minStudents: 4, capacity: 15, minStudentsOverride: false, startDate: d(12), endDate: d(100), status: 'PENDING_APPROVAL' },
    { id: 'c14', courseId: 'co1', name: 'Gym cơ bản K13', sportId: 'sp1', roomId: 'r1', coachId: 'u3', minStudents: 5, capacity: 20, minStudentsOverride: true, startDate: d(7), endDate: d(70), status: 'OPEN' },
    { id: 'c15', courseId: 'co7', name: 'Cầu lông cơ bản K4', sportId: 'sp5', roomId: 'r7', coachId: 'u12', minStudents: 4, capacity: 8, minStudentsOverride: false, startDate: d(-5), endDate: d(40), status: 'CANCELLED' },
    { id: 'c16', courseId: 'co12', name: 'Boxing cơ bản K2', sportId: 'sp3', roomId: 'r3', minStudents: 4, capacity: 12, minStudentsOverride: false, startDate: d(20), endDate: d(60), status: 'PENDING_APPROVAL' },
  ],
  schedules: [
    { id: 'sc1', classId: 'c1', dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
    { id: 'sc2', classId: 'c1', dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },
    { id: 'sc3', classId: 'c1', dayOfWeek: 5, startTime: '18:00', endTime: '19:00' },
    { id: 'sc4', classId: 'c2', dayOfWeek: 2, startTime: '06:00', endTime: '07:00' },
    { id: 'sc5', classId: 'c2', dayOfWeek: 4, startTime: '06:00', endTime: '07:00' },
    { id: 'sc6', classId: 'c2', dayOfWeek: 6, startTime: '06:00', endTime: '07:00' },
    { id: 'sc7', classId: 'c3', dayOfWeek: 2, startTime: '19:00', endTime: '21:00' },
    { id: 'sc8', classId: 'c3', dayOfWeek: 4, startTime: '19:00', endTime: '21:00' },
    { id: 'sc9', classId: 'c4', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
    { id: 'sc10', classId: 'c4', dayOfWeek: 5, startTime: '08:00', endTime: '09:00' },
    { id: 'sc11', classId: 'c5', dayOfWeek: 6, startTime: '15:00', endTime: '17:00' },
    { id: 'sc12', classId: 'c5', dayOfWeek: 7, startTime: '15:00', endTime: '17:00' },
    { id: 'sc24', classId: 'c6', dayOfWeek: 2, startTime: '17:00', endTime: '18:00' },
    { id: 'sc25', classId: 'c6', dayOfWeek: 4, startTime: '17:00', endTime: '18:00' },
    { id: 'sc26', classId: 'c6', dayOfWeek: 6, startTime: '17:00', endTime: '18:00' },
    { id: 'sc13', classId: 'c7', dayOfWeek: 2, startTime: '17:00', endTime: '19:00' },
    { id: 'sc14', classId: 'c7', dayOfWeek: 5, startTime: '17:00', endTime: '19:00' },
    { id: 'sc15', classId: 'c8', dayOfWeek: 6, startTime: '07:00', endTime: '09:00' },
    { id: 'sc16', classId: 'c8', dayOfWeek: 7, startTime: '07:00', endTime: '09:00' },
    { id: 'sc17', classId: 'c9', dayOfWeek: 1, startTime: '19:00', endTime: '20:00' },
    { id: 'sc18', classId: 'c9', dayOfWeek: 3, startTime: '19:00', endTime: '20:00' },
    { id: 'sc19', classId: 'c9', dayOfWeek: 5, startTime: '19:00', endTime: '20:00' },
    { id: 'sc20', classId: 'c10', dayOfWeek: 6, startTime: '09:00', endTime: '11:00' },
    { id: 'sc21', classId: 'c10', dayOfWeek: 7, startTime: '09:00', endTime: '11:00' },
    { id: 'sc22', classId: 'c11', dayOfWeek: 2, startTime: '06:00', endTime: '08:00' },
    { id: 'sc23', classId: 'c11', dayOfWeek: 4, startTime: '06:00', endTime: '08:00' },
    { id: 'sc27', classId: 'c12', dayOfWeek: 1, startTime: '20:00', endTime: '21:00' },
    { id: 'sc28', classId: 'c12', dayOfWeek: 3, startTime: '20:00', endTime: '21:00' },
    { id: 'sc29', classId: 'c13', dayOfWeek: 2, startTime: '07:00', endTime: '08:00' },
    { id: 'sc30', classId: 'c13', dayOfWeek: 4, startTime: '07:00', endTime: '08:00' },
    { id: 'sc31', classId: 'c13', dayOfWeek: 6, startTime: '07:00', endTime: '08:00' },
    { id: 'sc32', classId: 'c14', dayOfWeek: 2, startTime: '18:00', endTime: '19:00' },
    { id: 'sc33', classId: 'c14', dayOfWeek: 4, startTime: '18:00', endTime: '19:00' },
    { id: 'sc34', classId: 'c14', dayOfWeek: 6, startTime: '18:00', endTime: '19:00' },
    { id: 'sc35', classId: 'c15', dayOfWeek: 3, startTime: '17:00', endTime: '19:00' },
    { id: 'sc36', classId: 'c15', dayOfWeek: 6, startTime: '17:00', endTime: '19:00' },
    { id: 'sc37', classId: 'c16', dayOfWeek: 6, startTime: '20:00', endTime: '21:00' },
    { id: 'sc38', classId: 'c16', dayOfWeek: 7, startTime: '20:00', endTime: '21:00' },
  ],
  sessions: [],
  coachRegistrations: [
    { id: 'cr1', classId: 'c1', coachId: 'u3', status: 'APPROVED', createdAt: dt(-40), reviewedAt: dt(-38) },
    { id: 'cr2', classId: 'c13', coachId: 'u4', status: 'PENDING', createdAt: dt(-3) },
    { id: 'cr3', classId: 'c14', coachId: 'u3', status: 'APPROVED', createdAt: dt(-9), reviewedAt: dt(-8) },
    { id: 'cr4', classId: 'c14', coachId: 'u5', status: 'REJECTED', createdAt: dt(-9), reviewedAt: dt(-8) },
    { id: 'cr5', classId: 'c11', coachId: 'u12', status: 'MANAGER_ASSIGNED', createdAt: dt(-12), reviewedAt: dt(-12) },
    { id: 'cr6', classId: 'c16', coachId: 'u5', status: 'PENDING', createdAt: dt(-1) },
    { id: 'cr7', classId: 'c2', coachId: 'u4', status: 'APPROVED', createdAt: dt(-30), reviewedAt: dt(-29) },
  ],
  enrollments: [
    { id: 'e1', classId: 'c1', memberId: 'u6', enrolledAt: d(-28), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e2', classId: 'c1', memberId: 'u7', enrolledAt: d(-27), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e3', classId: 'c1', memberId: 'u9', enrolledAt: d(-25), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e4', classId: 'c2', memberId: 'u6', enrolledAt: d(-18), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e5', classId: 'c2', memberId: 'u8', enrolledAt: d(-17), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e6', classId: 'c3', memberId: 'u9', enrolledAt: d(-9), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e7', classId: 'c3', memberId: 'u7', enrolledAt: d(-8), status: 'CANCELLED', refundedAmount: 0 },
    { id: 'e8', classId: 'c2', memberId: 'u11', enrolledAt: d(-5), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e9', classId: 'c7', memberId: 'u7', enrolledAt: d(-20), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e10', classId: 'c9', memberId: 'u11', enrolledAt: d(-8), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e11', classId: 'c8', memberId: 'u9', enrolledAt: d(-12), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e12', classId: 'c4', memberId: 'u6', enrolledAt: d(-2), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e13', classId: 'c11', memberId: 'u9', enrolledAt: d(-3), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e14', classId: 'c14', memberId: 'u7', enrolledAt: d(-4), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e15', classId: 'c14', memberId: 'u11', enrolledAt: d(-1), status: 'ENROLLED', refundedAmount: 0 },
    { id: 'e16', classId: 'c15', memberId: 'u8', enrolledAt: d(-9), status: 'CANCELLED', refundedAmount: 0 },
  ],
  bookings: [],
  packages: [
    { id: 'pk1', roomId: 'r6', memberId: 'u9', startDate: d(-14), daysOfWeek: [2, 5], startTime: '19:00', endTime: '20:00', weeks: 4, status: 'ACTIVE', createdAt: dt(-15) },
    { id: 'pk2', roomId: 'r12', memberId: 'u7', startDate: d(2), daysOfWeek: [6], startTime: '08:00', endTime: '09:00', weeks: 3, status: 'ACTIVE', createdAt: dt(-1) },
  ],
  orders: [],
  orderItems: [],
  coupons: [
    { id: 'cp1', code: 'WELCOME20', discountType: 'PERCENT', discountValue: 20, maxDiscount: 200000, validFrom: d(-60), validTo: d(60), maxUses: 100, maxUsesPerUser: 1, minOrderAmount: 0, applicableTypes: null, usedCount: 12, active: true },
    { id: 'cp2', code: 'COURT50K', discountType: 'FIXED', discountValue: 50000, validFrom: d(-30), validTo: d(30), maxUses: 200, maxUsesPerUser: 5, minOrderAmount: 200000, applicableTypes: ['FACILITY_BOOKING', 'FACILITY_PACKAGE'], usedCount: 37, active: true },
    { id: 'cp3', code: 'CLASS10', discountType: 'PERCENT', discountValue: 10, validFrom: d(-10), validTo: d(45), maxUses: 50, maxUsesPerUser: 2, minOrderAmount: 500000, applicableTypes: ['COURSE_ENROLLMENT'], usedCount: 4, active: true },
    { id: 'cp4', code: 'SUMMER25', discountType: 'PERCENT', discountValue: 25, validFrom: d(-120), validTo: d(-60), maxUses: 100, maxUsesPerUser: 1, minOrderAmount: 0, applicableTypes: null, usedCount: 100, active: true },
    { id: 'cp5', code: 'VIP500', discountType: 'FIXED', discountValue: 500000, validFrom: d(-5), validTo: d(90), maxUses: 10, maxUsesPerUser: 1, minOrderAmount: 2000000, applicableTypes: ['MEMBERSHIP'], usedCount: 0, active: false },
  ],
  walletTransactions: [],
  supportRequests: [
    { id: 'sr1', memberId: 'u6', title: 'Đổi lịch lớp Yoga', content: 'Em muốn chuyển sang ca chiều được không ạ?', type: 'SCHEDULE', status: 'OPEN', createdAt: dt(-2) },
    { id: 'sr2', memberId: 'u9', title: 'Hỏng tủ đồ', content: 'Tủ số 15 bị kẹt khóa.', type: 'FACILITY', status: 'IN_PROGRESS', createdAt: dt(-4), handledBy: 'u2' },
    { id: 'sr3', memberId: 'u7', title: 'Xuất hóa đơn VAT', content: 'Cần hóa đơn đỏ cho gói 6 tháng.', type: 'PAYMENT', status: 'CLOSED', createdAt: dt(-20), handledBy: 'u2' },
    { id: 'sr4', memberId: 'u6', title: 'Bảo lưu gói 2 tuần', content: 'Em đi công tác từ 20/8 đến 3/9, cho em bảo lưu gói được không?', type: 'ACCOUNT', status: 'RESOLVED', createdAt: dt(-26), handledBy: 'u2' },
    { id: 'sr5', memberId: 'u11', title: 'Chưa nhận được tiền hoàn', content: 'Em hủy sân hôm qua mà chưa thấy tiền về ví.', type: 'PAYMENT', status: 'OPEN', createdAt: dt(-1, 15) },
  ],
  supportMessages: [
    { id: 'sm1', requestId: 'sr2', senderId: 'u2', content: 'Chào anh Hải, bên em đã ghi nhận. Kỹ thuật sẽ kiểm tra tủ số 15 trong hôm nay ạ.', createdAt: dt(-4, 10) },
    { id: 'sm2', requestId: 'sr2', senderId: 'u9', content: 'Ok em, anh có đồ để trong tủ, nhờ em xử lý sớm giúp.', createdAt: dt(-4, 11) },
    { id: 'sm3', requestId: 'sr2', senderId: 'u2', content: 'Dạ, dự kiến 15h chiều nay xong. Em sẽ báo lại anh.', createdAt: dt(-4, 11) },
    { id: 'sm4', requestId: 'sr3', senderId: 'u2', content: 'Em đã xuất hóa đơn VAT và gửi vào email member.em@gmail.com. Anh kiểm tra giúp em nhé.', createdAt: dt(-19, 9) },
    { id: 'sm5', requestId: 'sr3', senderId: 'u7', content: 'Đã nhận, cảm ơn em.', createdAt: dt(-19, 14) },
    { id: 'sm6', requestId: 'sr4', senderId: 'u2', content: 'Chào chị Dung, gói được bảo lưu tối đa 30 ngày/năm. Em đã bảo lưu 14 ngày, hạn gói lùi tới 12/10 ạ.', createdAt: dt(-26, 10) },
    { id: 'sm7', requestId: 'sr4', senderId: 'u6', content: 'Cảm ơn em nhiều.', createdAt: dt(-26, 12) },
  ],
  notifications: [
    { id: 'n1', userId: 'u8', title: 'Gói sắp hết hạn', content: 'Gói Standard 1 tháng của bạn sẽ hết hạn sau 5 ngày. Auto-renew đang bật, ví cần đủ 650.000 ₫.', read: false, createdAt: dt(-1) },
    { id: 'n2', userId: 'u6', title: 'Thay đổi lịch học', content: 'Lớp Yoga buổi sáng K1 thứ 4 tuần này dời sang 07:00.', read: false, createdAt: dt(-1, 14) },
    { id: 'n3', userId: 'u6', title: 'Bài tập về nhà', content: 'HLV Lê Văn An đã giao bài tập: 3 hiệp plank 60s mỗi ngày.', read: true, createdAt: dt(-3) },
    { id: 'n4', userId: 'u3', title: 'Phân công lớp mới', content: 'Bạn được duyệt dạy lớp Gym cơ bản K13.', read: true, createdAt: dt(-8) },
    { id: 'n5', userId: 'u1', title: 'Yêu cầu duyệt chuyên môn', content: 'HLV Lê Văn An đăng ký bộ môn Boxing, chờ duyệt.', read: false, createdAt: dt(-2) },
    { id: 'n6', userId: 'u1', title: 'Lớp chờ duyệt mở', content: 'Lớp Yoga buổi sáng K2 đã có HLV đăng ký, chờ duyệt.', read: false, createdAt: dt(-3) },
    { id: 'n7', userId: 'u9', title: 'Bảo trì sân', content: 'Sân tennis 1 bảo trì từ ' + dayjs().add(3, 'day').format('DD/MM') + ' 08:00 → ' + dayjs().add(4, 'day').format('DD/MM') + ' 18:00. Buổi Tennis thiếu niên K2 sẽ chuyển sang Sân tennis 2.', read: false, createdAt: dt(-2, 9) },
  ],
  auditLogs: [
    { id: 'a1', userId: 'u1', action: 'CREATE_CLASS', entity: 'Class', entityId: 'c12', detail: 'Tạo lớp Boxing cơ bản K1 (DRAFT)', createdAt: dt(-6) },
    { id: 'a2', userId: 'u1', action: 'APPROVE_CLASS', entity: 'Class', entityId: 'c14', detail: 'Duyệt mở lớp Gym cơ bản K13, HLV Lê Văn An', createdAt: dt(-8, 10) },
    { id: 'a3', userId: 'u1', action: 'CREATE_MAINTENANCE', entity: 'FacilityMaintenance', entityId: 'm1', detail: 'Đặt lịch bảo trì Sân tennis 1', createdAt: dt(-2) },
    { id: 'a4', userId: 'u1', action: 'BAN_USER', entity: 'Account', entityId: 'u10', detail: 'Cấm tài khoản Lý Minh Khánh (vi phạm nội quy)', createdAt: dt(-12) },
    { id: 'a5', userId: 'u1', action: 'UPDATE_SETTINGS', entity: 'SystemSettings', entityId: '1', detail: 'Giới hạn đặt trước 14 ngày, deadline hủy booking 2 giờ', createdAt: dt(-45) },
    { id: 'a6', userId: 'u1', action: 'CREATE_COUPON', entity: 'Coupon', entityId: 'cp3', detail: 'Tạo coupon CLASS10', createdAt: dt(-10) },
    { id: 'a7', userId: 'u1', action: 'REJECT_SPECIALIZATION', entity: 'CoachSpecialization', entityId: 'cs13', detail: 'Từ chối chuyên môn Gym của Trần Mỹ Hạnh', createdAt: dt(-29) },
    { id: 'a8', userId: 'u1', action: 'DISABLE_USER', entity: 'Account', entityId: 'u15', detail: 'Vô hiệu hóa HLV Võ Trung Hiếu', createdAt: dt(-20) },
  ],
  checkIns: [
    { id: 'ci1', memberId: 'u6', time: dt(-1, 18), by: 'u2', basis: 'SESSION' },
    { id: 'ci2', memberId: 'u7', time: dt(-1, 18), by: 'u2', basis: 'MEMBERSHIP' },
    { id: 'ci3', memberId: 'u9', time: dt(0, 7), by: 'u2', basis: 'MEMBERSHIP' },
    { id: 'ci4', memberId: 'u6', time: dt(-3, 6), by: 'u2', basis: 'MEMBERSHIP' },
  ],
  attendances: [],
  sessionNotes: [],
  progressReviews: [
    { id: 'pr1', sessionId: 'LAST:c1', memberId: 'u6', coachId: 'u3', rating: 4, comment: 'Chuyên cần tốt, giảm được 1.5kg sau 3 tuần.', createdAt: dt(-3) },
    { id: 'pr2', sessionId: 'LAST:c1', memberId: 'u7', coachId: 'u3', rating: 5, comment: 'Kỹ thuật chuẩn, tăng 1kg cơ.', createdAt: dt(-3) },
    { id: 'pr3', sessionId: 'LAST:c2', memberId: 'u6', coachId: 'u4', rating: 4, comment: 'Thở đều, giữ được tư thế chiến binh lâu hơn.', createdAt: dt(-2) },
  ],
  trainingPlans: [
    { id: 'tp1', coachId: 'u3', classId: 'c1', title: 'Giáo án tuần 1-4: Nền tảng', content: 'Tuần 1-2: Làm quen máy, kỹ thuật squat/deadlift với tạ nhẹ.\nTuần 3-4: Tăng dần khối lượng, 3 buổi/tuần, full body.', createdAt: dt(-28), source: 'MANUAL' },
    { id: 'tp2', coachId: 'u3', memberId: 'u6', title: 'Kế hoạch giảm cân cá nhân', content: 'Cardio 20 phút đầu buổi, sau đó circuit 4 vòng. Ăn 1500 kcal/ngày.', createdAt: dt(-20), source: 'MANUAL' },
    { id: 'tp3', coachId: 'u4', classId: 'c2', title: 'Chuỗi Yoga buổi sáng', content: 'Sun Salutation A/B, Warrior series, kết thúc Savasana 5 phút.', createdAt: dt(-18), source: 'MANUAL' },
  ],
  trainingResults: [
    { id: 'tr1', sessionId: 'FIRST:c1', memberId: 'u6', coachId: 'u3', metrics: 'Squat 37.5kg · Plank 70s · Chạy 3km 18.2 phút', note: 'Kỹ thuật squat ổn, cần giữ lưng thẳng hơn.', effort: 6, entries: [{ name: 'Squat', value: 37.5, unit: 'kg' }, { name: 'Plank', value: 70, unit: 's' }, { name: 'Chạy 3km', value: 18.2, unit: 'phút' }] },
    { id: 'tr2', sessionId: 'LAST:c1', memberId: 'u6', coachId: 'u3', metrics: 'Squat 40kg · Plank 80s · Chạy 3km 17.8 phút', note: 'Tiến bộ tốt, đã tăng tạ.', effort: 7, entries: [{ name: 'Squat', value: 40, unit: 'kg' }, { name: 'Plank', value: 80, unit: 's' }, { name: 'Chạy 3km', value: 17.8, unit: 'phút' }] },
    { id: 'tr3', sessionId: 'FIRST:c1', memberId: 'u7', coachId: 'u3', metrics: 'Bench Press 60kg · Deadlift 80kg', note: 'Mạnh, có thể lên nhóm nâng cao.', effort: 8, entries: [{ name: 'Bench Press', value: 60, unit: 'kg' }, { name: 'Deadlift', value: 80, unit: 'kg' }] },
  ],
  homeworks: [
    { id: 'hw1', classId: 'c1', coachId: 'u3', title: 'Plank hàng ngày', content: '3 hiệp plank 60s mỗi ngày, ghi lại vào app.', createdAt: dt(-3) },
    { id: 'hw2', classId: 'c2', coachId: 'u4', title: 'Thở 4-7-8', content: 'Tập thở 4-7-8 10 phút trước khi ngủ.', createdAt: dt(-2) },
  ],
  bodyMetrics: [],
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
const COUNTER: PaymentMethod[] = ['CASH', 'CASH', 'BANK', 'CARD'];

/** Đơn thô sinh ra trong quá trình generate; gộp thành orders/order_items ở cuối. */
interface RawItem { buyerId?: string; guestName?: string; guestPhone?: string; type: OrderItem['type']; refId: string; name: string; detail: string; unitPrice: number; membershipDiscount: number; paidAt: string; method: PaymentMethod; createdBy: string; couponCode?: string; couponDiscount?: number; refunded?: number }

function generate(data: AppData): AppData {
  const users = [...data.users];
  const subscriptions = [...data.subscriptions];
  const enrollments = [...data.enrollments];
  const checkIns = [...data.checkIns];
  const auditLogs = [...data.auditLogs];
  const notifications = [...data.notifications];
  const raw: RawItem[] = [];
  const planOf = (id: string) => data.plans.find((p) => p.id === id)!;

  // 0) Đơn cho các gói / lớp seed
  for (const s of data.subscriptions) {
    const p = planOf(s.planId);
    const online = rnd() < 0.5;
    raw.push({ buyerId: s.memberId, type: 'MEMBERSHIP', refId: s.id, name: `Gói ${p.name}`, detail: `${dayjs(s.startDate).format('DD/MM/YYYY')} → ${dayjs(s.endDate).format('DD/MM/YYYY')} · ${p.durationDays} ngày`, unitPrice: p.price, membershipDiscount: 0, paidAt: dt(dayjs(s.startDate).diff(dayjs(), 'day'), between(7, 20)), method: online ? 'WALLET' : pick(COUNTER), createdBy: online ? s.memberId : 'u2', couponCode: s.id === 's1' ? 'WELCOME20' : undefined, couponDiscount: s.id === 's1' ? 200000 : undefined });
  }
  for (const e of data.enrollments) {
    const c = data.classes.find((x) => x.id === e.classId)!; const co = data.courses.find((x) => x.id === c.courseId)!;
    const sub = data.subscriptions.find((s) => s.memberId === e.memberId && s.status === 'ACTIVE' && s.startDate <= e.enrolledAt && e.enrolledAt < s.endDate);
    const pct = sub ? planOf(sub.planId).classDiscountPct : 0;
    const online = rnd() < 0.5;
    raw.push({ buyerId: e.memberId, type: 'COURSE_ENROLLMENT', refId: e.id, name: `Lớp ${c.name}`, detail: `${co.name} · ${co.totalSessions} buổi · bắt đầu ${dayjs(c.startDate).format('DD/MM/YYYY')}`, unitPrice: co.price, membershipDiscount: Math.floor(co.price * pct / 100 + 0.5), paidAt: dt(dayjs(e.enrolledAt).diff(dayjs(), 'day'), between(7, 20)), method: online ? 'WALLET' : pick(COUNTER), createdBy: online ? e.memberId : 'u2', refunded: e.status === 'CANCELLED' && e.id === 'e16' ? co.price - Math.floor(co.price * pct / 100 + 0.5) : 0 });
  }

  // 1) 24 thành viên bổ sung, gia nhập rải rác 6 tháng gần đây
  for (let i = 0; i < 24; i++) {
    const female = rnd() < 0.5;
    const name = `${pick(FIRST)} ${female ? pick(MID_F) : pick(MID_M)} ${female ? pick(LAST_F) : pick(LAST_M)}`;
    const id = `u${100 + i}`;
    const joined = -between(3, 180);
    users.push({ id, email: `member${100 + i}@gmail.com`, fullName: name, phone: `09${String(30000000 + i * 7919).slice(0, 8)}`, role: 'MEMBER', status: rnd() < 0.06 ? 'INACTIVE' : 'ACTIVE', dob: `${between(1985, 2005)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`, gender: female ? 'FEMALE' : 'MALE', goal: pick(GOALS), level: pick([...LEVELS]), walletBalance: 0, createdAt: d(joined) });
    let start = joined;
    const periods = rnd() < 0.35 ? 2 : 1;
    for (let k = 0; k < periods; k++) {
      if (start > 0) break;
      const p = pick(data.plans.filter((x) => x.active));
      const end = start + p.durationDays;
      const active = end >= 0 && k === periods - 1;
      const sid = `s${id}_${k}`;
      subscriptions.push({ id: sid, memberId: id, planId: p.id, startDate: d(start), endDate: d(end), status: active ? 'ACTIVE' : 'EXPIRED', autoRenew: active && rnd() < 0.4 });
      const online = rnd() < 0.5;
      raw.push({ buyerId: id, type: 'MEMBERSHIP', refId: sid, name: `Gói ${p.name}`, detail: `${dayjs(d(start)).format('DD/MM/YYYY')} → ${dayjs(d(end)).format('DD/MM/YYYY')} · ${p.durationDays} ngày`, unitPrice: p.price, membershipDiscount: 0, paidAt: dt(start, between(7, 20)), method: online ? 'WALLET' : pick(COUNTER), createdBy: online ? id : 'u2' });
      start = end;
    }
    // Lớp: 45% đăng ký 1 lớp đang OPEN (không cần membership)
    const cands = data.classes.filter((c) => c.status === 'OPEN' && c.startDate <= d(0) && c.startDate >= d(-40));
    if (rnd() < 0.45 && cands.length) {
      const cls = pick(cands); const co = data.courses.find((x) => x.id === cls.courseId)!;
      const when = Math.max(joined, dayjs(cls.startDate).diff(dayjs(), 'day') - between(1, 6));
      const eid = `e${id}`;
      enrollments.push({ id: eid, classId: cls.id, memberId: id, enrolledAt: d(when), status: 'ENROLLED', refundedAmount: 0 });
      const sub = subscriptions.find((s) => s.memberId === id && s.startDate <= d(when) && d(when) < s.endDate);
      const pct = sub ? planOf(sub.planId).classDiscountPct : 0;
      const online = rnd() < 0.5;
      raw.push({ buyerId: id, type: 'COURSE_ENROLLMENT', refId: eid, name: `Lớp ${cls.name}`, detail: `${co.name} · ${co.totalSessions} buổi · bắt đầu ${dayjs(cls.startDate).format('DD/MM/YYYY')}`, unitPrice: co.price, membershipDiscount: Math.floor(co.price * pct / 100 + 0.5), paidAt: dt(when, between(7, 20)), method: online ? 'WALLET' : pick(COUNTER), createdBy: online ? id : 'u2' });
    }
    const n = between(0, 6);
    for (let k = 0; k < n; k++) checkIns.push({ id: `ci${id}_${k}`, memberId: id, time: dt(-between(0, 14), between(6, 21)), by: 'u2', basis: 'MEMBERSHIP' });
    if (rnd() < 0.3) auditLogs.push({ id: `a${id}`, userId: 'u2', action: 'CREATE_MEMBER', entity: 'Account', entityId: id, detail: `Đăng ký thành viên mới tại quầy: ${name}`, createdAt: dt(joined, 10) });
  }

  // 2) Sinh session cho mọi lớp từ lịch tuần + course.totalSessions; ngày lớp = MIN/MAX session (BR_2.10)
  const sessions: AppData['sessions'] = [];
  const classes = data.classes.map((c) => {
    const co = data.courses.find((x) => x.id === c.courseId)!;
    const gen = generateSessions(c.id, data.schedules.filter((s) => s.classId === c.id), co.totalSessions, c.roomId, c.startDate);
    gen.forEach((s, i) => sessions.push({ ...s, id: `ss${c.id}_${i + 1}` }));
    const dates = classDates(gen);
    return { ...c, startDate: dates.startDate || c.startDate, endDate: dates.endDate || c.endDate };
  });
  // Buổi Tennis K2 rơi vào lịch bảo trì m1 → đã chuyển sang sân tennis 2 (UC_2.5)
  for (const s of sessions) if (s.roomId === 'r10' && `${s.date} ${s.endTime}` > dt(3, 8) && `${s.date} ${s.startTime}` < dt(4, 18)) { s.roomId = 'r11'; s.note = 'Đổi sang Sân tennis 2 do bảo trì'; }
  // Lớp c2: 1 buổi bị hủy (ví dụ dời/hủy buổi)
  const cancelOne = sessions.filter((s) => s.classId === 'c2' && s.date > d(0)).slice(1, 2);
  cancelOne.forEach((s) => { s.status = 'CANCELLED'; s.note = 'HLV bận đột xuất — sẽ dạy bù'; });

  // 3) Điểm danh cho các buổi đã diễn ra + kết quả tập luyện (phần mở rộng)
  const attendances: AppData['attendances'] = [];
  const trainingResults = [...data.trainingResults];
  const lastVal = new Map<string, number>();
  const NOTES = ['Kỹ thuật ổn định.', 'Cần giữ lưng thẳng hơn.', 'Tiến bộ rõ so với tuần trước.', 'Hơi mệt, giảm khối lượng buổi sau.', 'Nhịp thở tốt, giữ tempo đều.', 'Tập trung hơn ở nửa sau buổi.', 'Đã đạt mức mục tiêu tuần này.', 'Khởi động chưa kỹ, lần sau vào sớm 5 phút.'];
  const makeResult = (memberId: string, sportName: string) => {
    const defs = SPORT_METRICS[sportKeyOf(sportName)];
    const picked = defs.filter(() => rnd() < 0.7).slice(0, 3);
    const use = picked.length ? picked : [defs[0]];
    const entries: ResultEntry[] = use.map((df) => {
      const k = `${memberId}|${df.name}`;
      const prev = lastVal.get(k);
      let v = prev === undefined ? df.min + rnd() * (df.max - df.min) * 0.5 : prev + (df.higherIsBetter ? 1 : -1) * df.step * (rnd() < 0.75 ? rnd() * 1.4 : -rnd() * 0.5);
      v = Math.round(v / (df.decimals ? 0.1 : df.step >= 1 ? 1 : df.step)) * (df.decimals ? 0.1 : df.step >= 1 ? 1 : df.step);
      v = Math.round(v * 10) / 10;
      lastVal.set(k, v);
      return { name: df.name, value: v, unit: df.unit };
    });
    return { entries, metrics: entriesToString(entries), effort: between(5, 9), note: pick(NOTES) };
  };
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  for (const cls of classes.filter((c) => c.status === 'OPEN')) {
    for (const s of sessions.filter((x) => x.classId === cls.id && x.status === 'SCHEDULED' && `${x.date} ${x.endTime}` < now)) {
      for (const e of enrollments.filter((x) => x.classId === cls.id && x.status === 'ENROLLED' && x.enrolledAt <= s.date)) {
        const r = rnd();
        const st = r < 0.8 ? 'PRESENT' : r < 0.9 ? 'LATE' : 'ABSENT';
        attendances.push({ id: `at${s.id}_${e.memberId}`, sessionId: s.id, memberId: e.memberId, status: st, updatedAt: `${s.date} ${s.endTime}`, updatedBy: cls.coachId });
        if (st !== 'ABSENT' && cls.coachId && rnd() < 0.45) trainingResults.push({ id: `tr${s.id}_${e.memberId}`, sessionId: s.id, memberId: e.memberId, coachId: cls.coachId, ...makeResult(e.memberId, data.sports.find((x) => x.id === cls.sportId)?.name ?? 'Gym') });
      }
    }
  }
  // Nối các record seed có sessionId dạng FIRST:/LAST: tới buổi thật
  const resolve = (ref: string) => { const [k, cid] = ref.split(':'); if (!cid) return ref; const past = sessions.filter((s) => s.classId === cid && s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < now); return (k === 'FIRST' ? past[0] : past[past.length - 1])?.id ?? ref; };
  trainingResults.forEach((r) => { r.sessionId = resolve(r.sessionId); });
  const progressReviews = data.progressReviews.map((r) => ({ ...r, sessionId: resolve(r.sessionId) }));
  for (const r of [...data.trainingResults].sort((x, y) => (sessions.find((s) => s.id === x.sessionId)?.date ?? '').localeCompare(sessions.find((s) => s.id === y.sessionId)?.date ?? ''))) {
    if (!r.entries) continue;
    r.entries = r.entries.map((e) => { const k = `${r.memberId}|${e.name}`; const df = Object.values(SPORT_METRICS).flat().find((m) => m.name === e.name); const prev = lastVal.get(k); if (prev === undefined || !df) { lastVal.set(k, e.value); return e; } const v = Math.round((prev + (df.higherIsBetter ? 1 : -1) * df.step * 1.2) * 10) / 10; lastVal.set(k, v); return { ...e, value: v }; });
    r.metrics = entriesToString(r.entries);
  }
  // Session notes cho 3 buổi gần nhất của c1 và c2 (UC_4.3)
  const sessionNotes: AppData['sessionNotes'] = [];
  const NOTE_TITLES = ['Khởi động & kỹ thuật nền', 'Tăng tải tuần này', 'Ôn tập & kiểm tra nhỏ'];
  for (const cid of ['c1', 'c2']) {
    const past = sessions.filter((s) => s.classId === cid && s.status === 'SCHEDULED' && `${s.date} ${s.endTime}` < now).slice(-3);
    past.forEach((s, i) => sessionNotes.push({ id: `sn${s.id}`, sessionId: s.id, coachId: classes.find((c) => c.id === cid)!.coachId!, title: NOTE_TITLES[i % 3], content: `Nội dung buổi ${dayjs(s.date).format('DD/MM')}: ${pick(NOTES)}\nBài tập: 3 hiệp × 12 lần, nghỉ 60s.`, attachments: i === 0 ? ['giao-an-tuan.pdf'] : [], createdAt: `${s.date} ${s.endTime}` }));
  }

  // 4) Chỉ số cơ thể theo tuần cho các member đang học (phần mở rộng)
  const bodyMetrics: AppData['bodyMetrics'] = [];
  for (const mid of Array.from(new Set(enrollments.filter((e) => e.status === 'ENROLLED').map((e) => e.memberId)))) {
    const u = users.find((x) => x.id === mid)!;
    const losing = /giảm/i.test(u.goal ?? '');
    let w = u.gender === 'FEMALE' ? between(52, 68) : between(62, 84);
    let bf = u.gender === 'FEMALE' ? between(24, 32) : between(16, 24);
    for (let k = 8; k >= 0; k--) { bodyMetrics.push({ id: `bm${mid}_${k}`, memberId: mid, date: d(-k * 7), weight: Math.round(w * 10) / 10, bodyFat: Math.round(bf * 10) / 10 }); w += (losing ? -1 : 0.4) * (0.3 + rnd() * 0.6); bf += (losing ? -0.5 : -0.2) * (0.3 + rnd() * 0.6); }
  }

  // 5) Thông báo gói sắp hết hạn
  for (const s of subscriptions.filter((x) => x.status === 'ACTIVE')) {
    const left = dayjs(s.endDate).diff(dayjs(), 'day');
    if (left >= 0 && left <= 7 && !notifications.some((n) => n.userId === s.memberId && n.title.includes('hết hạn'))) notifications.push({ id: `nexp${s.id}`, userId: s.memberId, title: 'Gói sắp hết hạn', content: `Gói của bạn sẽ hết hạn sau ${left} ngày.${s.autoRenew ? ' Auto-renew đang bật, hãy đảm bảo ví đủ tiền.' : ' Gia hạn ngay để không gián đoạn.'}`, read: false, createdAt: dt(-1, 8) });
  }

  // 6) Booking facility: gói định kỳ → booking lẻ (member + guest) 30 ngày qua + 7 ngày tới; gym theo slot nhiều người
  const bookings: Booking[] = [];
  const members = users.filter((u) => u.role === 'MEMBER' && u.status === 'ACTIVE');
  const used = new Map<string, number>(); // roomId|date|hour → số booking
  const key = (r: string, ds: string, h: number) => `${r}|${ds}|${h}`;
  const sessionClash = (roomId: string, ds: string, s: string, e: string) => sessions.some((x) => x.roomId === roomId && x.date === ds && x.status === 'SCHEDULED' && overlap(s, e, x.startTime, x.endTime) && classes.find((c) => c.id === x.classId)?.status !== 'CANCELLED');
  const maintClash = (roomId: string, ds: string, s: string, e: string) => data.maintenances.some((m) => m.roomId === roomId && m.from < `${ds} ${e}` && `${ds} ${s}` < m.to);
  const priceFor = (memberId: string | undefined, room: AppData['rooms'][number], ds: string, hours: number) => {
    const list = room.pricePerSlot * hours;
    const sub = memberId ? subscriptions.find((x) => x.memberId === memberId && x.status === 'ACTIVE' && x.startDate <= ds && ds < x.endDate) : undefined;
    const plan = sub ? planOf(sub.planId) : undefined;
    if (!plan) return { list, price: list, kind: undefined as Booking['benefitKind'] };
    if (plan.gymAccess && room.type === 'GYM') return { list, price: 0, kind: 'GYM_ACCESS' as const };
    return { list, price: Math.floor(list * (100 - plan.bookingDiscountPct) / 100 + 0.5), kind: plan.bookingDiscountPct ? ('DISCOUNT' as const) : undefined };
  };
  // 6a) Gói định kỳ
  for (const pk of data.packages) {
    const room = data.rooms.find((r) => r.id === pk.roomId)!;
    const dates = packageDates(pk.startDate, pk.daysOfWeek, pk.weeks);
    const hours = (Number(pk.endTime.slice(0, 2)) - Number(pk.startTime.slice(0, 2)));
    let listSum = 0, paySum = 0;
    dates.forEach((ds, i) => {
      const p = priceFor(pk.memberId, room, ds, hours);
      listSum += p.list; paySum += p.price;
      for (let h = 0; h < hours; h++) used.set(key(room.id, ds, Number(pk.startTime.slice(0, 2)) + h), 1);
      bookings.push({ id: `${pk.id}_b${i + 1}`, roomId: room.id, memberId: pk.memberId, date: ds, startTime: pk.startTime, endTime: pk.endTime, listPrice: p.list, price: p.price, refundedAmount: 0, benefitKind: p.kind, status: 'CONFIRMED', packageId: pk.id, createdAt: pk.createdAt, createdBy: pk.memberId });
    });
    raw.push({ buyerId: pk.memberId, type: 'FACILITY_PACKAGE', refId: pk.id, name: `Gói định kỳ ${room.name}`, detail: `${pk.daysOfWeek.map((x) => ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][x]).join('/')} ${pk.startTime}–${pk.endTime} · ${pk.weeks} tuần từ ${dayjs(pk.startDate).format('DD/MM')} · ${dates.length} buổi`, unitPrice: listSum, membershipDiscount: listSum - paySum, paidAt: pk.createdAt, method: 'WALLET', createdBy: pk.memberId });
  }
  // 6b) Booking lẻ
  const courts = data.rooms.filter((r) => r.isActive && !r.deletedAt && r.type !== 'GYM');
  const GUESTS = [['Trần Văn Khách', '0977123456'], ['Lê Thị Mai', '0988777666'], ['Phạm Hồng Sơn', '0912345678'], ['Nguyễn Thu Hà', '0909090909']];
  for (let off = -30; off <= 7; off++) {
    const date = dayjs().add(off, 'day'); const ds = date.format('YYYY-MM-DD'); const weekend = dowOf(ds) >= 6;
    const n = weekend ? between(6, 10) : between(3, 6);
    for (let k = 0; k < n; k++) {
      const room = pick(courts);
      const startH = pick(weekend ? [6, 7, 8, 9, 15, 16, 17, 18, 19] : [6, 7, 17, 18, 19, 20]);
      const hours = rnd() < 0.7 ? 1 : 2;
      const s = hh(startH), e = hh(startH + hours);
      if (Array.from({ length: hours }).some((_, h) => (used.get(key(room.id, ds, startH + h)) ?? 0) >= room.capacity)) continue;
      if (sessionClash(room.id, ds, s, e) || maintClash(room.id, ds, s, e)) continue;
      for (let h = 0; h < hours; h++) used.set(key(room.id, ds, startH + h), (used.get(key(room.id, ds, startH + h)) ?? 0) + 1);
      const guest = rnd() < 0.15;
      const m = guest ? undefined : pick(members);
      const g = guest ? pick(GUESTS) : undefined;
      const p = priceFor(m?.id, room, ds, hours);
      const id = `b${room.id}_${off + 30}_${k}`;
      const cancelled = off < 0 && rnd() < 0.08;
      const created = dt(Math.min(off, 0) - between(0, 3), between(8, 21));
      const method: PaymentMethod = guest ? pick(COUNTER) : rnd() < 0.6 ? 'WALLET' : pick(COUNTER);
      const refund = cancelled && m ? p.price : 0;
      bookings.push({ id, roomId: room.id, memberId: m?.id, guestName: g?.[0], guestPhone: g?.[1], date: ds, startTime: s, endTime: e, listPrice: p.list, price: p.price, refundedAmount: refund, benefitKind: p.kind, status: cancelled ? 'CANCELLED' : 'CONFIRMED', createdAt: created, createdBy: method === 'WALLET' ? m!.id : 'u2' });
      raw.push({ buyerId: m?.id, guestName: g?.[0], guestPhone: g?.[1], type: 'FACILITY_BOOKING', refId: id, name: `Đặt ${room.name}`, detail: `${date.format('DD/MM/YYYY')} · ${s}–${e} · ${hours} slot`, unitPrice: p.list, membershipDiscount: p.list - p.price, paidAt: created, method, createdBy: method === 'WALLET' ? m!.id : 'u2', refunded: refund });
    }
  }
  // 6c) Gym: nhiều người cùng slot (capacity 20) — 7 ngày qua + hôm nay + 3 ngày tới
  const gym = data.rooms.find((r) => r.id === 'r1')!;
  for (let off = -7; off <= 3; off++) {
    const date = dayjs().add(off, 'day'); const ds = date.format('YYYY-MM-DD');
    for (let k = 0; k < between(8, 16); k++) {
      const startH = pick([6, 7, 8, 17, 18, 19, 20]);
      const s = hh(startH), e = hh(startH + 1);
      if ((used.get(key(gym.id, ds, startH)) ?? 0) >= gym.capacity || sessionClash(gym.id, ds, s, e)) continue;
      const m = pick(members);
      if (bookings.some((b) => b.memberId === m.id && b.date === ds && b.startTime === s)) continue;
      used.set(key(gym.id, ds, startH), (used.get(key(gym.id, ds, startH)) ?? 0) + 1);
      const p = priceFor(m.id, gym, ds, 1);
      const id = `bgym_${off + 7}_${k}`;
      const created = dt(Math.min(off, 0) - between(0, 1), between(6, 21));
      bookings.push({ id, roomId: gym.id, memberId: m.id, date: ds, startTime: s, endTime: e, listPrice: p.list, price: p.price, refundedAmount: 0, benefitKind: p.kind, status: 'CONFIRMED', createdAt: created, createdBy: m.id });
      raw.push({ buyerId: m.id, type: 'FACILITY_BOOKING', refId: id, name: `Đặt ${gym.name}`, detail: `${date.format('DD/MM/YYYY')} · ${s}–${e} · 1 slot`, unitPrice: p.list, membershipDiscount: p.list - p.price, paidAt: created, method: 'WALLET', createdBy: m.id });
    }
  }

  // 7) Gộp dòng cùng người mua + cùng ngày + cùng phương thức thành một order (nhiều order_items); sinh ledger ví
  raw.sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  const groups = new Map<string, RawItem[]>();
  for (const r of raw) { const gk = `${r.buyerId ?? r.guestPhone}|${r.paidAt.slice(0, 10)}|${r.method}`; groups.set(gk, [...(groups.get(gk) ?? []), r]); }
  const orders: Order[] = []; const orderItems: OrderItem[] = []; const walletTransactions: WalletTransaction[] = [];
  const balance = new Map<string, number>();
  let seqNo = 0;
  const year = dayjs().format('YYYY');
  const refOf = (it: RawItem) => it.refId;
  for (const items of Array.from(groups.values()).sort((a, b) => a[0].paidAt.localeCompare(b[0].paidAt))) {
    // tối đa 1 MEMBERSHIP / order
    const chunks: RawItem[][] = [];
    for (const it of items) { const last = chunks[chunks.length - 1]; if (last && !(it.type === 'MEMBERSHIP' && last.some((x) => x.type === 'MEMBERSHIP')) && last.length < 3) last.push(it); else chunks.push([it]); }
    for (const chunk of chunks) {
      const first = chunk[0];
      const oid = `o${++seqNo}`;
      const subtotal = chunk.reduce((s, x) => s + x.unitPrice, 0);
      const mDisc = chunk.reduce((s, x) => s + x.membershipDiscount, 0);
      const cDisc = chunk.reduce((s, x) => s + (x.couponDiscount ?? 0), 0);
      const total = subtotal - mDisc - cDisc;
      const refunded = chunk.reduce((s, x) => s + (x.refunded ?? 0), 0);
      orders.push({ id: oid, orderNumber: `ORD-${year}-${String(seqNo).padStart(4, '0')}`, buyerId: first.buyerId, guestName: first.guestName, guestPhone: first.guestPhone, paymentMethod: first.method, couponCode: chunk.find((x) => x.couponCode)?.couponCode, subtotal, membershipDiscount: mDisc, couponDiscount: cDisc, total, refundedAmount: refunded, status: refunded === 0 ? 'PAID' : refunded >= total ? 'REFUNDED' : 'PARTIALLY_REFUNDED', paidAt: first.paidAt, createdBy: first.createdBy });
      chunk.forEach((it, i) => orderItems.push({ id: `${oid}_i${i + 1}`, orderId: oid, lineNumber: i + 1, type: it.type, refId: refOf(it), name: it.name, detail: it.detail, unitPrice: it.unitPrice, membershipDiscount: it.membershipDiscount, couponDiscount: it.couponDiscount ?? 0, total: it.unitPrice - it.membershipDiscount - (it.couponDiscount ?? 0), refundedAmount: it.refunded ?? 0 }));
      // Ví: PAYMENT (kèm TOP_UP trước nếu thiếu), REFUND về ví cho item đã hoàn
      if (first.buyerId && first.method === 'WALLET' && total > 0) {
        const bal = balance.get(first.buyerId) ?? 0;
        if (bal < total) {
          const top = Math.ceil((total - bal) / 500000) * 500000 + (rnd() < 0.5 ? 500000 : 0);
          const gw = pick(['VNPAY', 'MOMO', 'CASH'] as const);
          balance.set(first.buyerId, bal + top);
          walletTransactions.push({ id: `wt${oid}_t`, memberId: first.buyerId, type: 'TOP_UP', amount: top, balanceAfter: bal + top, gateway: gw, gatewayRef: gw === 'CASH' ? undefined : `${gw}${dayjs(first.paidAt).format('YYMMDDHHmm')}${seqNo}`, gatewayStatus: gw === 'CASH' ? undefined : 'SUCCESS', note: gw === 'CASH' ? 'Nạp tiền mặt tại quầy' : `Nạp ví qua ${gw}`, createdAt: dayjs(first.paidAt).subtract(between(5, 40), 'minute').format('YYYY-MM-DD HH:mm'), createdBy: gw === 'CASH' ? 'u2' : first.buyerId });
        }
        const after = (balance.get(first.buyerId) ?? 0) - total;
        balance.set(first.buyerId, after);
        walletTransactions.push({ id: `wt${oid}_p`, memberId: first.buyerId, type: 'PAYMENT', amount: total, balanceAfter: after, orderId: oid, note: `Thanh toán đơn ORD-${year}-${String(seqNo).padStart(4, '0')}`, createdAt: first.paidAt, createdBy: first.buyerId });
      }
      chunk.forEach((it, i) => {
        if (first.buyerId && it.refunded) {
          const after = (balance.get(first.buyerId) ?? 0) + it.refunded; balance.set(first.buyerId, after);
          walletTransactions.push({ id: `wt${oid}_r${i}`, memberId: first.buyerId, type: 'REFUND', amount: it.refunded, balanceAfter: after, orderId: oid, orderItemId: `${oid}_i${i + 1}`, note: `Hoàn tiền: ${it.name} (hủy trước deadline)`, createdAt: dayjs(first.paidAt).add(between(1, 3), 'day').format('YYYY-MM-DD HH:mm'), createdBy: 'system' });
        }
      });
    }
  }
  // Nạp thêm cho vài member để ví còn số dư demo
  for (const [mid, extra] of [['u6', 1200000], ['u7', 500000], ['u9', 2500000], ['u11', 300000], ['u8', 150000]] as [string, number][]) {
    const after = (balance.get(mid) ?? 0) + extra; balance.set(mid, after);
    walletTransactions.push({ id: `wt_extra_${mid}`, memberId: mid, type: 'TOP_UP', amount: extra, balanceAfter: after, gateway: 'VNPAY', gatewayRef: `VNPAY${dayjs().format('YYMMDD')}${mid}`, gatewayStatus: 'SUCCESS', note: 'Nạp ví qua VNPAY', createdAt: dt(-between(1, 5), between(8, 21)), createdBy: mid });
  }
  walletTransactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Gắn orderItemId ngược lại dịch vụ + số dư ví
  const itemByRef = new Map(orderItems.map((it) => [it.refId, it.id]));
  const linkedSubs = subscriptions.map((s) => ({ ...s, orderItemId: itemByRef.get(s.id) }));
  const linkedEnr = enrollments.map((e) => ({ ...e, orderItemId: itemByRef.get(e.id), refundedAmount: orderItems.find((it) => it.refId === e.id)?.refundedAmount ?? 0 }));
  const linkedBk = bookings.map((b) => ({ ...b, orderItemId: itemByRef.get(b.packageId ?? b.id) }));
  const packages = data.packages.map((p) => ({ ...p, orderItemId: itemByRef.get(p.id) }));
  const finalUsers = users.map((u) => (u.role === 'MEMBER' ? { ...u, walletBalance: balance.get(u.id) ?? 0 } : u));

  auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...data, users: finalUsers, subscriptions: linkedSubs, enrollments: linkedEnr, checkIns, auditLogs, notifications, classes, sessions, attendances, sessionNotes, progressReviews, trainingResults, bodyMetrics, bookings: linkedBk, packages, orders, orderItems, walletTransactions };
}

export const initialData: AppData = generate(base);
