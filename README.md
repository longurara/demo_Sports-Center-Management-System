# Sports Center Management System — SWP391 (FA26)

Prototype giao diện (React + Vite + TypeScript + Ant Design) cho Hệ thống Quản lý Trung tâm Thể thao.
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

## Phạm vi nghiệp vụ

- **10 bộ môn** (Gym, Yoga, Boxing, Bơi, Cầu lông, Tennis, Pickleball, Bóng rổ, Zumba, Bóng đá mini) — phòng tập theo lớp và **sân cho thuê theo giờ**.
- **Đặt sân**: thành viên tự đặt online (lưới sân × khung giờ, kiểm tra trùng lớp/đặt trước, giảm giá theo gói); lễ tân đặt tại quầy, nhận sân, hủy, xuất hóa đơn.
- **Gói thành viên theo bộ môn**: All-access hoặc gói riêng môn; kiểm tra gói khi đăng ký lớp.
- **HLV theo bộ môn**: phân công lớp chỉ gợi ý HLV đúng môn.
- **Kết quả tập luyện có cấu trúc** theo bộ môn (chỉ số, RPE) → biểu đồ tiến bộ, kỷ lục cá nhân.
- **AI gợi ý bài tập** theo bộ môn học viên đang theo (thư viện bài chuyên môn + thể lực nền).
- **Hóa đơn GTGT** theo mẫu hóa đơn điện tử (mã CQT, QR tra cứu, số tiền bằng chữ), in A4.
- **Responsive**: sidebar dạng drawer + thanh tab dưới cùng trên điện thoại.

## Cấu trúc

```
frontend/src
├── components/   Layout, SideNav, StatCard, UserCell, SupportThread, Invoice, ...
├── pages/        auth · common · manager · receptionist · member · coach
├── store/        AppContext (state + mock persistence)
├── mock/         Dữ liệu mẫu + bộ sinh dữ liệu
├── utils/        conflicts (kiểm tra trùng lịch), aiPlan (sinh kế hoạch), invoice, csv
└── routes.tsx    Điều hướng theo vai trò
```

## Kế hoạch backend

Express + Supabase (Postgres, Auth, Storage). Frontend giữ nguyên, thay lớp `store/` bằng gọi API.
