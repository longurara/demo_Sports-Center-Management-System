import type { ReactNode } from 'react';
import {
  AppstoreOutlined, AuditOutlined, BarChartOutlined, BookOutlined, CalendarOutlined, CheckSquareOutlined,
  CustomerServiceOutlined, DashboardOutlined, DollarOutlined, FileTextOutlined, GiftOutlined, HomeOutlined,
  IdcardOutlined, LineChartOutlined, LoginOutlined, NotificationOutlined, RobotOutlined, SafetyCertificateOutlined,
  ScheduleOutlined, SearchOutlined, SettingOutlined, ShopOutlined, ShoppingCartOutlined, SolutionOutlined,
  TagsOutlined, TeamOutlined, ToolOutlined, TrophyOutlined, UserAddOutlined, UsergroupAddOutlined, UserOutlined,
  WalletOutlined, FieldTimeOutlined, ReadOutlined, PercentageOutlined, ProfileOutlined, HomeOutlined as RoomIcon,
} from '@ant-design/icons';
import type { Role } from './types';

export type Badge = 'support' | 'supportReply' | 'expiring' | 'todaySessions' | 'courtsToday' | 'pendingClasses' | 'pendingSpecs' | 'openForCoach' | 'cart';

export interface NavItem { key: string; label: string; icon: ReactNode; badge?: Badge }
export interface NavSection { title?: string; items: NavItem[] }

export const navByRole: Record<Role, NavSection[]> = {
  MANAGER: [
    { items: [{ key: '/manager', label: 'Tổng quan', icon: <DashboardOutlined /> }] },
    {
      title: 'Người dùng', items: [
        { key: '/manager/members', label: 'Thành viên', icon: <TeamOutlined />, badge: 'expiring' },
        { key: '/manager/coaches', label: 'Huấn luyện viên', icon: <SolutionOutlined />, badge: 'pendingSpecs' },
        { key: '/manager/staff', label: 'Nhân viên', icon: <UserOutlined /> },
        { key: '/manager/roles', label: 'Phân quyền', icon: <SafetyCertificateOutlined /> },
      ],
    },
    {
      title: 'Sản phẩm', items: [
        { key: '/manager/plans', label: 'Gói thành viên', icon: <GiftOutlined /> },
        { key: '/manager/courses', label: 'Khóa học', icon: <ReadOutlined /> },
        { key: '/manager/classes', label: 'Lớp học', icon: <BookOutlined />, badge: 'pendingClasses' },
        { key: '/manager/coupons', label: 'Coupon', icon: <PercentageOutlined /> },
      ],
    },
    {
      title: 'Cơ sở vật chất', items: [
        { key: '/manager/sports', label: 'Bộ môn', icon: <TagsOutlined /> },
        { key: '/manager/rooms', label: 'Phòng & sân', icon: <RoomIcon /> },
        { key: '/manager/maintenance', label: 'Lịch bảo trì', icon: <ToolOutlined /> },
        { key: '/manager/courts', label: 'Lịch đặt sân', icon: <FieldTimeOutlined />, badge: 'courtsToday' },
        { key: '/manager/schedule', label: 'Lịch hoạt động', icon: <CalendarOutlined /> },
        { key: '/manager/attendance', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
      ],
    },
    {
      title: 'Theo dõi', items: [
        { key: '/manager/reports', label: 'Báo cáo', icon: <BarChartOutlined /> },
        { key: '/manager/orders', label: 'Hóa đơn', icon: <FileTextOutlined /> },
        { key: '/manager/support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined />, badge: 'support' },
        { key: '/manager/audit-log', label: 'Lịch sử thao tác', icon: <AuditOutlined /> },
        { key: '/manager/settings', label: 'Cấu hình hệ thống', icon: <SettingOutlined /> },
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
        { key: '/receptionist/wallet', label: 'Nạp ví', icon: <WalletOutlined /> },
      ],
    },
    {
      title: 'Bán hàng', items: [
        { key: '/receptionist/counter', label: 'Đơn tại quầy', icon: <ShopOutlined />, badge: 'cart' },
        { key: '/receptionist/subscriptions', label: 'Gói thành viên', icon: <IdcardOutlined />, badge: 'expiring' },
        { key: '/receptionist/enrollments', label: 'Đăng ký lớp', icon: <UsergroupAddOutlined /> },
        { key: '/receptionist/courts', label: 'Đặt sân', icon: <FieldTimeOutlined />, badge: 'courtsToday' },
        { key: '/receptionist/orders', label: 'Hóa đơn & hoàn tiền', icon: <DollarOutlined /> },
      ],
    },
    { title: 'Hỗ trợ', items: [{ key: '/receptionist/support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined />, badge: 'support' }] },
  ],
  MEMBER: [
    { items: [{ key: '/member', label: 'Trang chủ', icon: <HomeOutlined /> }] },
    {
      title: 'Tài khoản', items: [
        { key: '/member/wallet', label: 'Ví của tôi', icon: <WalletOutlined /> },
        { key: '/member/plans', label: 'Gói thành viên', icon: <GiftOutlined /> },
        { key: '/member/membership', label: 'Gói của tôi', icon: <IdcardOutlined /> },
        { key: '/member/checkout', label: 'Đơn đang soạn', icon: <ShoppingCartOutlined />, badge: 'cart' },
        { key: '/member/orders', label: 'Hóa đơn', icon: <FileTextOutlined /> },
      ],
    },
    {
      title: 'Tập luyện', items: [
        { key: '/member/classes', label: 'Lớp học', icon: <AppstoreOutlined /> },
        { key: '/member/courts', label: 'Đặt sân / phòng', icon: <FieldTimeOutlined /> },
        { key: '/member/schedule', label: 'Lịch tập của tôi', icon: <CalendarOutlined /> },
        { key: '/member/coaches', label: 'Huấn luyện viên', icon: <SolutionOutlined /> },
        { key: '/member/attendance', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
        { key: '/member/results', label: 'Kết quả & tiến độ', icon: <TrophyOutlined /> },
        { key: '/member/training-plan', label: 'Kế hoạch & bài tập', icon: <ProfileOutlined /> },
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
        { key: '/coach/open-classes', label: 'Lớp cần HLV', icon: <UsergroupAddOutlined />, badge: 'openForCoach' },
        { key: '/coach/attendance', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
        { key: '/coach/specializations', label: 'Chuyên môn', icon: <SafetyCertificateOutlined /> },
      ],
    },
    {
      title: 'Học viên', items: [
        { key: '/coach/training-plans', label: 'Kế hoạch tập luyện', icon: <FileTextOutlined /> },
        { key: '/coach/results', label: 'Kết quả buổi tập', icon: <LineChartOutlined /> },
        { key: '/coach/progress', label: 'Đánh giá học viên', icon: <TrophyOutlined /> },
        { key: '/coach/announcements', label: 'Thông báo & Bài tập', icon: <NotificationOutlined /> },
      ],
    },
    { title: 'AI', items: [{ key: '/coach/ai-suggest', label: 'AI gợi ý bài tập', icon: <RobotOutlined /> }] },
  ],
};

/** 4 mục hiển thị trên thanh tab dưới cùng (mobile); mục thứ 5 là Menu. */
export const mobileTabs: Record<Role, { key: string; label: string }[]> = {
  MANAGER: [{ key: '/manager', label: 'Tổng quan' }, { key: '/manager/members', label: 'Thành viên' }, { key: '/manager/classes', label: 'Lớp học' }, { key: '/manager/reports', label: 'Báo cáo' }],
  RECEPTIONIST: [{ key: '/receptionist', label: 'Tổng quan' }, { key: '/receptionist/check-in', label: 'Check-in' }, { key: '/receptionist/counter', label: 'Bán hàng' }, { key: '/receptionist/orders', label: 'Hóa đơn' }],
  MEMBER: [{ key: '/member', label: 'Trang chủ' }, { key: '/member/classes', label: 'Lớp học' }, { key: '/member/courts', label: 'Đặt sân' }, { key: '/member/checkout', label: 'Giỏ' }],
  COACH: [{ key: '/coach', label: 'Tổng quan' }, { key: '/coach/schedule', label: 'Lịch dạy' }, { key: '/coach/attendance', label: 'Điểm danh' }, { key: '/coach/classes', label: 'Lớp học' }],
};

/** Danh sách phẳng (dùng cho breadcrumb, tìm kiếm). */
export const flatNav = (role: Role) => navByRole[role].flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));
