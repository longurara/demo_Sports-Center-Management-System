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
| Coach | coach.an@sc.vn |
| Member | member.dung@gmail.com |

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
