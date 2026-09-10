export type Role = 'MANAGER' | 'COACH' | 'MEMBER' | 'RECEPTIONIST';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'LOCKED';
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  goal?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  healthNote?: string;
  specialty?: string;
  bio?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  benefits: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

export interface Sport { id: string; name: string; description: string }
export interface Room { id: string; name: string; capacity: number; location: string }

export interface GymClass {
  id: string;
  name: string;
  sportId: string;
  roomId: string;
  coachId?: string;
  capacity: number;
  price: number;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
}

export interface Schedule {
  id: string;
  classId: string;
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  startTime: string;
  endTime: string;
}

export interface Enrollment {
  id: string;
  classId: string;
  memberId: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface Payment {
  id: string;
  invoiceNo: string;
  memberId: string;
  amount: number;
  method: 'CASH' | 'BANK' | 'VNPAY' | 'MOMO';
  type: 'PLAN' | 'CLASS';
  refName: string;
  paidAt: string;
  createdBy: string;
}

export interface SupportRequest {
  id: string;
  memberId: string;
  title: string;
  content: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  handledBy?: string;
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

export interface CheckIn { id: string; memberId: string; time: string; by: string }

export interface Session { id: string; classId: string; date: string; note?: string }

export interface Attendance {
  id: string;
  sessionId: string;
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

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

export interface TrainingResult {
  id: string;
  sessionId: string;
  memberId: string;
  coachId: string;
  metrics: string;
  note: string;
}

export interface ProgressReview {
  id: string;
  memberId: string;
  coachId: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  weight: number;   // kg
  bodyFat?: number; // %
  note?: string;
}

export interface AppData {
  users: User[];
  plans: Plan[];
  subscriptions: Subscription[];
  sports: Sport[];
  rooms: Room[];
  classes: GymClass[];
  schedules: Schedule[];
  enrollments: Enrollment[];
  payments: Payment[];
  supportRequests: SupportRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  checkIns: CheckIn[];
  sessions: Session[];
  attendances: Attendance[];
  trainingPlans: TrainingPlan[];
  trainingResults: TrainingResult[];
  progressReviews: ProgressReview[];
  homeworks: Homework[];
  bodyMetrics: BodyMetric[];
  supportMessages: SupportMessage[];
}
