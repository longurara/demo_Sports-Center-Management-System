export type Role = 'MANAGER' | 'COACH' | 'MEMBER' | 'RECEPTIONIST';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

/** accounts + profile theo role (member_profile / coach_profile / staff). Gộp phẳng trong mock. */
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  status: AccountStatus;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  avatarUrl?: string;
  createdAt: string;
  // member_profile
  emergencyContact?: string;
  goal?: string;            // fitness_goals
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  healthNote?: string;      // health_notes — chỉ chính chủ / Manager / Receptionist / Coach của lớp
  walletBalance?: number;   // member_profile.wallet_balance
  // coach_profile
  bio?: string;
  experience?: string;
  specialty?: string;       // certifications
  coverImageUrl?: string;
  // receptionist_profile / manager_profile
  staffNotes?: string;      // chỉ Manager sửa
}

/** Membership package — quyền lợi cố định theo BR_1.8 */
export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  gymAccess: boolean;             // vào gym miễn phí (vẫn phải tạo booking để đếm capacity)
  bookingDiscountPct: number;     // % giảm đặt sân/phòng
  classDiscountPct: number;       // % giảm học phí lớp
  freeBookingSlotsPerMonth: number;
  active: boolean;
  deletedAt?: string;
}

/** member_memberships — mỗi row là một kỳ đã mua (membership_orders) */
export interface Subscription {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;          // [start, end)
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  orderItemId?: string;
}

export interface Sport { id: string; name: string; description: string; icon: string; color: string; deletedAt?: string }

/** Facility — phòng/sân gộp chung; n-n với Sport; capacity = số booking đồng thời / slot */
export type FacilityType = 'GYM' | 'COURT' | 'ROOM' | 'FIELD';
export interface Room {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number;         // capacity_per_slot
  location: string;
  sportIds: string[];       // facility_sports
  pricePerSlot: number;     // giá đồng nhất mọi khung giờ (BR_2.5)
  isActive: boolean;
  deletedAt?: string;
}

export interface FacilityMaintenance {
  id: string;
  roomId: string;
  from: string;             // YYYY-MM-DD HH:mm
  to: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  deletedAt?: string;
}

/** facility_bookings — 1 slot (hoặc nhiều slot liên tiếp) trên 1 facility. Guest: memberId trống */
export interface Booking {
  id: string;
  roomId: string;
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  date: string;             // YYYY-MM-DD
  startTime: string;        // HH:mm
  endTime: string;
  listPrice: number;
  price: number;            // thực trả sau ưu đãi (allocation)
  refundedAmount: number;
  benefitKind?: 'GYM_ACCESS' | 'FREE_SLOT' | 'DISCOUNT';
  status: 'CONFIRMED' | 'CANCELLED';
  packageId?: string;
  orderItemId?: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface FacilityPackage {
  id: string;
  roomId: string;
  memberId: string;
  startDate: string;
  daysOfWeek: number[];     // 1 = T2 … 7 = CN
  startTime: string;
  endTime: string;
  weeks: number;
  status: 'ACTIVE' | 'CANCELLED';
  orderItemId?: string;
  createdAt: string;
}

/** Course = template khóa học; Class = section cụ thể của course */
export interface Course {
  id: string;
  sportId: string;
  name: string;
  description: string;
  totalSessions: number;
  price: number;
  active: boolean;
  deletedAt?: string;
}

export type ClassStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'CANCELLED';
export interface GymClass {
  id: string;
  courseId: string;
  name: string;
  sportId: string;          // = course.sportId (denormalized)
  roomId: string;           // facility mặc định khi sinh session
  coachId?: string;         // Coach hiện tại (classes.coach_id)
  minStudents: number;
  capacity: number;         // max_students
  minStudentsOverride: boolean;
  startDate: string;        // MIN/MAX ngày session SCHEDULED (BR_2.10)
  endDate: string;
  status: ClassStatus;      // ONGOING / COMPLETED suy ra từ ngày
  deletedAt?: string;
}

export interface Schedule {
  id: string;
  classId: string;
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  startTime: string;
  endTime: string;
}

/** class_sessions — nguồn lịch thật sau khi sinh */
export interface Session {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  status: 'SCHEDULED' | 'CANCELLED';
  note?: string;
}

export interface ClassCoachRegistration {
  id: string;
  classId: string;
  coachId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANAGER_ASSIGNED' | 'WITHDRAWN';
  createdAt: string;
  reviewedAt?: string;
}

export interface CoachSpecialization {
  id: string;
  coachId: string;
  sportId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Enrollment {
  id: string;
  classId: string;
  memberId: string;
  enrolledAt: string;
  status: 'ENROLLED' | 'CANCELLED';
  orderItemId?: string;
  refundedAmount: number;
}

/** Đơn hàng = hóa đơn (orders + invoice_snapshot) */
export type PaymentMethod = 'WALLET' | 'CASH' | 'BANK' | 'CARD';
export type OrderItemType = 'MEMBERSHIP' | 'FACILITY_BOOKING' | 'FACILITY_PACKAGE' | 'COURSE_ENROLLMENT';
export interface Order {
  id: string;
  orderNumber: string;
  buyerId?: string;         // member; guest → trống
  guestName?: string;
  guestPhone?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  subtotal: number;
  membershipDiscount: number;
  couponDiscount: number;
  total: number;
  refundedAmount: number;
  status: 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  paidAt: string;
  createdBy: string;        // người thao tác (member online / lễ tân)
}

export interface OrderItem {
  id: string;
  orderId: string;
  lineNumber: number;
  type: OrderItemType;
  refId: string;            // booking / package / enrollment / subscription id
  name: string;             // item_snapshot
  detail: string;
  unitPrice: number;
  membershipDiscount: number;
  couponDiscount: number;
  total: number;
  refundedAmount: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
  maxUsesPerUser: number;
  minOrderAmount: number;
  applicableTypes: OrderItemType[] | null; // null = mọi loại
  usedCount: number;
  active: boolean;
  deletedAt?: string;
}

/** wallet_transactions — ledger ví */
export interface WalletTransaction {
  id: string;
  memberId: string;
  type: 'TOP_UP' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  orderId?: string;
  orderItemId?: string;
  gateway?: 'VNPAY' | 'MOMO' | 'CASH' | 'BANK';
  gatewayRef?: string;
  gatewayStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface SystemSettings {
  openTime: string;                 // HH:mm
  closeTime: string;
  slotMinutes: number;
  maxAdvanceBookingDays: number;    // BR_2.4
  bookingCancelDeadlineHours: number; // BR_2.6
  courseCancelDeadlineDays: number;   // BR_2.7
  timezone: string;
}

export type SupportType = 'SCHEDULE' | 'PAYMENT' | 'FACILITY' | 'ACCOUNT' | 'OTHER';
export interface SupportRequest {
  id: string;
  memberId: string;
  title: string;
  content: string;
  type: SupportType;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  handledBy?: string;
  deletedAt?: string;
}

export interface SupportMessage {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface CheckIn { id: string; memberId: string; time: string; by: string; basis?: 'MEMBERSHIP' | 'BOOKING' | 'SESSION' }

export interface Attendance {
  id: string;
  sessionId: string;
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  updatedAt?: string;
  updatedBy?: string;
}

/** session_notes — tối đa 1 note / session (BR_4.4) */
export interface SessionNote {
  id: string;
  sessionId: string;
  coachId: string;
  title: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

/** member_evaluations — gắn session + member (BR_4.5) */
export interface ProgressReview {
  id: string;
  sessionId: string;
  memberId: string;
  coachId: string;
  rating: number;
  comment: string;
  createdAt: string;
  deletedAt?: string;
}

// ---- Phần mở rộng ngoài docs (giữ nguyên) ----
export interface TrainingPlan {
  id: string;
  coachId: string;
  classId?: string;
  memberId?: string;
  title: string;
  content: string;
  createdAt: string;
  source?: 'MANUAL' | 'AI';
}

export interface ResultEntry { name: string; value: number; unit: string }

export interface TrainingResult {
  id: string;
  sessionId: string;
  memberId: string;
  coachId: string;
  metrics: string;
  note: string;
  entries?: ResultEntry[];
  effort?: number;
}

export interface Homework {
  id: string;
  classId: string;
  coachId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface BodyMetric {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  note?: string;
}

/** Dòng trong đơn đang soạn (giỏ) — chưa phải order_items */
export interface CartLine {
  key: string;
  type: OrderItemType;
  name: string;
  detail: string;
  // FACILITY_BOOKING
  roomId?: string; date?: string; startTime?: string; endTime?: string;
  // FACILITY_PACKAGE
  startDate?: string; daysOfWeek?: number[]; weeks?: number;
  // COURSE_ENROLLMENT
  classId?: string;
  // MEMBERSHIP
  planId?: string;
}

export type Buyer = { kind: 'MEMBER'; memberId: string } | { kind: 'GUEST'; name: string; phone: string };

export interface AppData {
  settings: SystemSettings;
  users: User[];
  plans: Plan[];
  subscriptions: Subscription[];
  sports: Sport[];
  rooms: Room[];
  maintenances: FacilityMaintenance[];
  courses: Course[];
  classes: GymClass[];
  schedules: Schedule[];
  sessions: Session[];
  coachRegistrations: ClassCoachRegistration[];
  coachSpecializations: CoachSpecialization[];
  enrollments: Enrollment[];
  bookings: Booking[];
  packages: FacilityPackage[];
  orders: Order[];
  orderItems: OrderItem[];
  coupons: Coupon[];
  walletTransactions: WalletTransaction[];
  supportRequests: SupportRequest[];
  supportMessages: SupportMessage[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  checkIns: CheckIn[];
  attendances: Attendance[];
  sessionNotes: SessionNote[];
  progressReviews: ProgressReview[];
  trainingPlans: TrainingPlan[];
  trainingResults: TrainingResult[];
  homeworks: Homework[];
  bodyMetrics: BodyMetric[];
}
