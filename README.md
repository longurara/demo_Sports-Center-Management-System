# Sports Center Management System — SWP391 (FA26)

Prototype giao diện (React + Vite + TypeScript + Ant Design) cho Hệ thống Quản lý Trung tâm Thể thao, bám theo `docs/detail.v3.md` + `docs/db.v4.md`.
Dữ liệu giả lập trong trình duyệt (sessionStorage), chưa nối backend.

## Chạy

```bash
cd frontend
npm install
npm start
```

Mở http://localhost:5173. Mật khẩu bất kỳ. Tài khoản demo:

| Vai trò | Email |
|---|---|
| Center Manager | manager@sc.vn |
| Receptionist | reception@sc.vn |
| Coach (Gym) | coach.an@sc.vn |
| Coach (Cầu lông / Pickleball) | coach.duy@sc.vn |
| Member | member.dung@gmail.com |

OTP đăng ký demo: `123456`. Coupon demo: `WELCOME20`, `COURT50K`, `CLASS10`.

## Phạm vi nghiệp vụ (theo docs v3)

- **Account + profile theo role**: `accounts` + member/coach/receptionist/manager profile; trạng thái ACTIVE / INACTIVE / BANNED; RBAC cố định 4 role.
- **Ví điện tử**: nạp online (VNPay/MoMo sandbox) hoặc tại quầy; mua online chỉ trừ ví; ledger TOP_UP / PAYMENT / REFUND; không rút.
- **Đơn nhiều dòng (orders + order_items)**: giỏ dịch vụ gồm đặt sân + gói định kỳ + đăng ký lớp + membership, một coupon / đơn, thanh toán atomic; hóa đơn bất biến, hoàn tiền từng dòng.
- **Membership package**: quyền lợi cố định (gym_access, giảm % đặt sân, giảm % học phí, slot miễn phí/tháng); gia hạn nối kỳ, auto-renew, hủy không hoàn. Không cần gói vẫn đặt sân / đăng ký lớp.
- **Facility**: gym / sân / phòng / sân ngoài trời, n-n bộ môn, capacity theo slot (gym 14/20, sân 1/1), giá / slot, lưới slot từ System Settings, lịch bảo trì với preview ảnh hưởng, guest booking tại quầy.
- **Course → Class → Session**: khóa học template, lớp sinh buổi học từ lịch tuần và giữ slot từ DRAFT; HLV đăng ký chuyên môn → Manager duyệt; HLV đăng ký dạy / Manager phân công → duyệt mở lớp; trạng thái ONGOING / COMPLETED suy ra từ ngày; đổi phòng / dời / hủy từng buổi.
- **F4**: check-in theo điều kiện (booking / buổi học / gym_access), điểm danh theo buổi, session notes, đánh giá học viên theo buổi.
- **Coupon**: PERCENT / FIXED, thời hạn, quota tổng & theo người, loại dịch vụ áp dụng, phân bổ về từng dòng.
- **Audit log** mặc định 7 ngày, tải thêm; **báo cáo** theo order_items, tỷ lệ gia hạn, sử dụng facility, khóa học.
- Phần mở rộng ngoài docs vẫn giữ: AI gợi ý bài tập, trợ lý AI, kết quả tập luyện, kế hoạch tập, landing page.

## Cấu trúc

```
frontend/src
├── components/   Layout, SideNav, CartPanel, CourtGrid (lưới facility × slot), Invoice, MemberDetail, ...
├── pages/        auth · common (Profile, Orders) · manager · receptionist · member · coach
├── store/        AppContext (state + giỏ + checkout / refund / hủy dịch vụ + mock persistence)
├── mock/         Dữ liệu mẫu + bộ sinh dữ liệu (session, booking, order, ledger ví)
├── utils/        slots (lưới slot, xung đột facility), classes (phase, sinh session), pricing (quyền lợi, coupon, phân bổ)
└── routes.tsx    Điều hướng theo vai trò
```

## Kế hoạch backend

Express + Prisma/PostgreSQL theo `docs/db.v4.md`. Frontend giữ nguyên, thay lớp `store/` bằng gọi API.
