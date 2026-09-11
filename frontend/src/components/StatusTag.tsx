import { Tag } from 'antd';

const MAP: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'green', label: 'Đang hoạt động' },
  LOCKED: { color: 'red', label: 'Đã khóa' },
  EXPIRED: { color: 'red', label: 'Hết hạn' },
  EXPIRING: { color: 'orange', label: 'Sắp hết hạn' },
  PENDING: { color: 'gold', label: 'Chờ thanh toán' },
  NONE: { color: 'default', label: 'Chưa có gói' },
  OPEN: { color: 'green', label: 'Đang mở' },
  CLOSED: { color: 'default', label: 'Đã kết thúc' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
  IN_PROGRESS: { color: 'blue', label: 'Đang xử lý' },
  RESOLVED: { color: 'green', label: 'Đã xử lý' },
  PRESENT: { color: 'green', label: 'Có mặt' },
  ABSENT: { color: 'red', label: 'Vắng' },
  LATE: { color: 'orange', label: 'Muộn' },
  CASH: { color: 'default', label: 'Tiền mặt' },
  BANK: { color: 'blue', label: 'Chuyển khoản' },
  VNPAY: { color: 'cyan', label: 'VNPay' },
  MOMO: { color: 'magenta', label: 'MoMo' },
  PLAN: { color: 'purple', label: 'Gói thành viên' },
  CLASS: { color: 'geekblue', label: 'Học phí lớp' },
  COURT: { color: 'cyan', label: 'Thuê sân' },
  BOOKED: { color: 'blue', label: 'Đã đặt' },
  CHECKED_IN: { color: 'green', label: 'Đã nhận sân' },
  COMPLETED: { color: 'default', label: 'Hoàn tất' },
  MANAGER: { color: 'volcano', label: 'Quản lý' },
  COACH: { color: 'blue', label: 'Huấn luyện viên' },
  MEMBER: { color: 'green', label: 'Thành viên' },
  RECEPTIONIST: { color: 'gold', label: 'Lễ tân' },
  BEGINNER: { color: 'default', label: 'Mới bắt đầu' },
  INTERMEDIATE: { color: 'blue', label: 'Trung bình' },
  ADVANCED: { color: 'purple', label: 'Nâng cao' },
  MALE: { color: 'blue', label: 'Nam' },
  FEMALE: { color: 'pink', label: 'Nữ' },
  OTHER: { color: 'default', label: 'Khác' },
  AI: { color: 'purple', label: 'AI gợi ý' },
  MANUAL: { color: 'default', label: 'Thủ công' },
};

export default function StatusTag({ value }: { value?: string }) {
  if (!value) return null;
  const m = MAP[value] ?? { color: 'default', label: value };
  return <Tag color={m.color}>{m.label}</Tag>;
}

export const labelOf = (v?: string) => (v ? MAP[v]?.label ?? v : '');
