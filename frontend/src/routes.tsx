import type { ReactNode } from 'react';
import {
  AppstoreOutlined, AuditOutlined, BarChartOutlined, BookOutlined, CalendarOutlined, CheckSquareOutlined,
  CreditCardOutlined, CustomerServiceOutlined, DashboardOutlined, DollarOutlined, FileTextOutlined,
  GiftOutlined, HomeOutlined, IdcardOutlined, LineChartOutlined, LoginOutlined, NotificationOutlined,
  RobotOutlined, SafetyCertificateOutlined, ScheduleOutlined, SearchOutlined, SolutionOutlined, TeamOutlined,
  TrophyOutlined, UserAddOutlined, UsergroupAddOutlined, HomeOutlined as RoomIcon, TagsOutlined, UserOutlined,
} from '@ant-design/icons';
import type { Role } from './types';

export type Badge = 'support' | 'supportReply' | 'expiring' | 'todaySessions';

export interface NavItem { key: string; label: string; icon: ReactNode; badge?: Badge }
export interface NavSection { title?: string; items: NavItem[] }

export const navByRole: Record<Role, NavSection[]> = {
  MANAGER: [
    { items: [{ key: '/manager', label: 'Tổng quan', icon: <DashboardOutlined /> }] },
    {
      title: 'Người dùng', items: [
        { key: '/manager/members', label: 'Thành viên', icon: <TeamOutlined />, badge: 'expiring' },
        { key: '/manager/coaches', label: 'Huấn luyện viên', icon: <SolutionOutlined /> },
        { key: '/manager/staff', label: 'Nhân viên', icon: <UserOutlined /> },
        { key: '/manager/roles', label: 'Phân quyền', icon: <SafetyCertificateOutlined /> },
      ],
    },
    {
      title: 'Vận hành', items: [
        { key: '/manager/plans', label: 'Gói thành viên', icon: <GiftOutlined /> },
        { key: '/manager/classes', label: 'Lớp học', icon: <BookOutlined /> },
        { key: '/manager/schedule', label: 'Lịch hoạt động', icon: <CalendarOutlined /> },
        { key: '/manager/sports', label: 'Bộ môn', icon: <TagsOutlined /> },
        { key: '/manager/rooms', label: 'Phòng tập', icon: <RoomIcon /> },
      ],
    },
    {
      title: 'Theo dõi', items: [
        { key: '/manager/reports', label: 'Báo cáo', icon: <BarChartOutlined /> },
        { key: '/manager/support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined />, badge: 'support' },
        { key: '/manager/audit-log', label: 'Lịch sử thao tác', icon: <AuditOutlined /> },
      ],
    },
  ],
  RECEPTIONIST: [
    { items: [{ key: '/receptionist', label: 'Tổng quan', icon: <DashboardOutlined /> }] },
    {
      title: 'Quầy', items: [
        { key: '/receptionist/check-in', label: 'Check-in', icon: <LoginOutlined /> },
        { key: '/receptionist/members', label: 'Tra cứu thành viên', icon: <SearchOutlined /> },
        { key: '/receptionist/register-member', label: 'Đăng ký tại quầy', icon: <UserAddOutlined /> },
      ],
    },
    {
      title: 'Dịch vụ', items: [
        { key: '/receptionist/subscriptions', label: 'Gói thành viên', icon: <IdcardOutlined />, badge: 'expiring' },
        { key: '/receptionist/enrollments', label: 'Đăng ký lớp', icon: <UsergroupAddOutlined /> },
        { key: '/receptionist/payments', label: 'Thanh toán & Hóa đơn', icon: <DollarOutlined /> },
        { key: '/receptionist/support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined />, badge: 'support' },
      ],
    },
  ],
  MEMBER: [
    { items: [{ key: '/member', label: 'Trang chủ', icon: <HomeOutlined /> }] },
    {
      title: 'Thành viên', items: [
        { key: '/member/plans', label: 'Gói thành viên', icon: <GiftOutlined /> },
        { key: '/member/membership', label: 'Gói của tôi', icon: <IdcardOutlined /> },
        { key: '/member/payments', label: 'Lịch sử thanh toán', icon: <CreditCardOutlined /> },
      ],
    },
    {
      title: 'Tập luyện', items: [
        { key: '/member/classes', label: 'Lớp học', icon: <AppstoreOutlined /> },
        { key: '/member/schedule', label: 'Lịch tập của tôi', icon: <CalendarOutlined /> },
        { key: '/member/coaches', label: 'Huấn luyện viên', icon: <SolutionOutlined /> },
        { key: '/member/attendance', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
        { key: '/member/results', label: 'Kết quả & tiến độ', icon: <TrophyOutlined /> },
        { key: '/member/training-plan', label: 'Kế hoạch & bài tập', icon: <FileTextOutlined /> },
      ],
    },
    {
      title: 'Hỗ trợ', items: [
        { key: '/member/support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined />, badge: 'supportReply' },
        { key: '/member/ai-chat', label: 'Trợ lý AI', icon: <RobotOutlined /> },
      ],
    },
  ],
  COACH: [
    { items: [{ key: '/coach', label: 'Tổng quan', icon: <DashboardOutlined /> }] },
    {
      title: 'Giảng dạy', items: [
        { key: '/coach/schedule', label: 'Lịch dạy', icon: <ScheduleOutlined />, badge: 'todaySessions' },
        { key: '/coach/classes', label: 'Lớp phụ trách', icon: <BookOutlined /> },
        { key: '/coach/attendance', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
      ],
    },
    {
      title: 'Học viên', items: [
        { key: '/coach/training-plans', label: 'Kế hoạch tập luyện', icon: <FileTextOutlined /> },
        { key: '/coach/results', label: 'Kết quả buổi tập', icon: <LineChartOutlined /> },
        { key: '/coach/progress', label: 'Đánh giá tiến độ', icon: <TrophyOutlined /> },
        { key: '/coach/announcements', label: 'Thông báo & Bài tập', icon: <NotificationOutlined /> },
      ],
    },
    { title: 'AI', items: [{ key: '/coach/ai-suggest', label: 'AI gợi ý bài tập', icon: <RobotOutlined /> }] },
  ],
};

/** Danh sách phẳng (dùng cho breadcrumb, tìm kiếm). */
export const flatNav = (role: Role) => navByRole[role].flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));
