import { Tag } from 'antd';

const MAP: Record<string, { color: string; label: string }> = {
  // account
  ACTIVE: { color: 'green', label: 'Đang hoạt động' },
  INACTIVE: { color: 'default', label: 'Vô hiệu hóa' },
  BANNED: { color: 'red', label: 'Bị cấm' },
  // membership
  EXPIRED: { color: 'red', label: 'Hết hạn' },
  EXPIRING: { color: 'orange', label: 'Sắp hết hạn' },
  NONE: { color: 'default', label: 'Chưa có gói' },
  // class
  DRAFT: { color: 'default', label: 'Nháp' },
  PENDING_APPROVAL: { color: 'gold', label: 'Chờ duyệt' },
  OPEN: { color: 'green', label: 'Đang mở' },
  ONGOING: { color: 'blue', label: 'Đang học' },
  COMPLETED: { color: 'default', label: 'Đã kết thúc' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
  SCHEDULED: { color: 'blue', label: 'Theo lịch' },
  // registrations / specializations
  PENDING: { color: 'gold', label: 'Chờ duyệt' },
  APPROVED: { color: 'green', label: 'Đã duyệt' },
  REJECTED: { color: 'red', label: 'Từ chối' },
  MANAGER_ASSIGNED: { color: 'purple', label: 'Manager phân công' },
  WITHDRAWN: { color: 'default', label: 'Đã rút' },
  ENROLLED: { color: 'green', label: 'Đang học' },
  // support
  IN_PROGRESS: { color: 'blue', label: 'Đang xử lý' },
  RESOLVED: { color: 'green', label: 'Đã xử lý' },
  CLOSED: { color: 'default', label: 'Đã đóng' },
  SCHEDULE: { color: 'blue', label: 'Lịch học / sân' },
  PAYMENT: { color: 'gold', label: 'Thanh toán' },
  FACILITY: { color: 'cyan', label: 'Cơ sở vật chất' },
  ACCOUNT: { color: 'purple', label: 'Tài khoản / gói' },
  OTHER: { color: 'default', label: 'Khác' },
  // attendance
  PRESENT: { color: 'green', label: 'Có mặt' },
  ABSENT: { color: 'red', label: 'Vắng' },
  LATE: { color: 'orange', label: 'Muộn' },
  // payment / order
  WALLET: { color: 'green', label: 'Ví' },
  CASH: { color: 'default', label: 'Tiền mặt' },
  BANK: { color: 'blue', label: 'Chuyển khoản' },
  CARD: { color: 'geekblue', label: 'Thẻ' },
  VNPAY: { color: 'cyan', label: 'VNPay' },
  MOMO: { color: 'magenta', label: 'MoMo' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  PARTIALLY_REFUNDED: { color: 'orange', label: 'Hoàn một phần' },
  REFUNDED: { color: 'red', label: 'Đã hoàn' },
  TOP_UP: { color: 'green', label: 'Nạp ví' },
  SUCCESS: { color: 'green', label: 'Thành công' },
  FAILED: { color: 'red', label: 'Thất bại' },
  MEMBERSHIP: { color: 'purple', label: 'Gói thành viên' },
  COURSE_ENROLLMENT: { color: 'geekblue', label: 'Đăng ký lớp' },
  FACILITY_BOOKING: { color: 'cyan', label: 'Đặt sân / phòng' },
  FACILITY_PACKAGE: { color: 'blue', label: 'Gói sân định kỳ' },
  PERCENT: { color: 'blue', label: '% giảm' },
  FIXED: { color: 'cyan', label: 'Giảm tiền' },
  // booking
  CONFIRMED: { color: 'blue', label: 'Đã đặt' },
  GYM_ACCESS: { color: 'green', label: 'Gym miễn phí' },
  FREE_SLOT: { color: 'green', label: 'Slot miễn phí' },
  DISCOUNT: { color: 'cyan', label: 'Giảm giá gói' },
  // facility
  GYM: { color: 'blue', label: 'Phòng gym' },
  COURT: { color: 'cyan', label: 'Sân' },
  ROOM: { color: 'purple', label: 'Phòng tập' },
  FIELD: { color: 'green', label: 'Sân ngoài trời' },
  // roles
  MANAGER: { color: 'volcano', label: 'Quản lý' },
  COACH: { color: 'blue', label: 'Huấn luyện viên' },
  MEMBER: { color: 'green', label: 'Thành viên' },
  RECEPTIONIST: { color: 'gold', label: 'Lễ tân' },
  BEGINNER: { color: 'default', label: 'Mới bắt đầu' },
  INTERMEDIATE: { color: 'blue', label: 'Trung bình' },
  ADVANCED: { color: 'purple', label: 'Nâng cao' },
  MALE: { color: 'blue', label: 'Nam' },
  FEMALE: { color: 'pink', label: 'Nữ' },
  AI: { color: 'purple', label: 'AI gợi ý' },
  MANUAL: { color: 'default', label: 'Thủ công' },
};

export default function StatusTag({ value }: { value?: string }) {
  if (!value) return null;
  const m = MAP[value] ?? { color: 'default', label: value };
  return <Tag color={m.color}>{m.label}</Tag>;
}

export const labelOf = (v?: string) => (v ? MAP[v]?.label ?? v : '');
