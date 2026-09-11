# Landing kit — Sports Center

Landing page + bộ token thiết kế tách khỏi demo để cắm vào dự án thật (React + Vite, router nào cũng được).

```
landing-kit/
├── global/
│   ├── tokens.css      ← "global": biến màu --sc-*, font Barlow, reset nhẹ. Import 1 lần ở main.tsx
│   ├── tokens.ts       ← cùng giá trị, dạng JS (chart, inline style, antd theme)
│   ├── antd-theme.ts   ← ThemeConfig cho Ant Design (chỉ dùng nếu có antd)
│   └── palette.html    ← bảng màu xem/copy hex
└── landing/            ← copy nguyên thư mục vào src/landing
    ├── Landing.tsx     ← component chính, nhận props Link / links / user
    ├── config.tsx      ← context: Link component, đường dẫn, user
    ├── content.ts      ← TOÀN BỘ chữ, số liệu, ảnh, bảng giá, giờ mở cửa — sửa ở đây
    ├── Nav / Hero / Sections / Features / Benefits / Social .tsx
    ├── ui.tsx          ← Reveal, Stagger, SplitWords, Counter, Marquee (motion)
    ├── landing.css     ← style, prefix .lp-, đọc màu từ --sc-* (có fallback)
    └── assets/         ← 10 ảnh bộ môn + hero-gym.jpg
```

## Cài

```bash
npm i motion lenis dayjs @ant-design/icons
```

1. Copy `global/tokens.css` → `src/styles/tokens.css`, import ở `main.tsx` **trước** css khác:
   ```ts
   import './styles/tokens.css';
   ```
2. Copy `landing/` → `src/landing/`.
3. Gắn vào route `/`. Landing không import router nào — truyền `Link` của bạn vào:

   **TanStack Router** (`src/routes/index.tsx`):
   ```tsx
   import { createFileRoute, Link } from '@tanstack/react-router';
   import { Landing, type LinkProps } from '~/landing';

   const RouterLink = ({ to, children, ...rest }: LinkProps) => <Link to={to} {...rest}>{children}</Link>;

   export const Route = createFileRoute('/')({
     component: () => <Landing Link={RouterLink} links={{ login: '/login', register: '/register', forgot: '/forgot-password' }} user={null} />,
   });
   ```

   **react-router-dom**:
   ```tsx
   const RouterLink = ({ to, ...p }: LinkProps) => <Link to={to} {...p} />;
   <Route path="/" element={<Landing Link={RouterLink} />} />
   ```

   Không truyền `Link` thì mặc định dùng `<a href>` (full reload) — vẫn chạy.

4. Khi có đăng nhập: `user={{ dashboardHref: '/member' }}` → nav hiện "Vào hệ thống" thay cho Đăng nhập/Đặt sân.

## Lưu ý khi cắm vào scaffold Vite

Template Vite thường có trong `index.css`:
```css
#root { width: 1126px; max-width: 100%; margin: 0 auto; text-align: center; border-inline: 1px solid ... }
```
Bỏ `width`, `text-align`, `border-inline` — landing cần full-bleed. (`.lp` đã tự đặt `text-align: left` nhưng width vẫn phải bỏ.)

## Đổi nội dung / ảnh

Tất cả ở `landing/content.ts`: tên trung tâm, câu hero, 3 ô facts, danh sách bộ môn (ảnh, số sân, giá từ, số lớp, HLV, kích thước ô trong lưới), số liệu, đoạn manifesto, 3 gói giá (đánh dấu `hot`), giờ mở cửa, liên hệ, CTA, footer.
Khi nối backend: fetch về rồi map vào cùng shape, hoặc truyền qua props — component chỉ đọc từ `content.ts`.

## Đổi màu

Sửa `global/tokens.css` (và `tokens.ts` cho đồng bộ). `landing.css` tham chiếu `--sc-*` nên đổi ở một chỗ là cả landing + app đổi theo.

## Dependencies

| gói | dùng cho |
|---|---|
| `motion` | mọi animation cuộn (reveal, parallax, sticky, cuộn ngang) |
| `lenis` | smooth scroll — chỉ bật khi landing mount, huỷ khi unmount |
| `dayjs` | ngày trong mockup & ưu đãi "tháng N" |
| `@ant-design/icons` | 6 icon (mũi tên, check, menu, đóng, sét, robot) — có thể thay bằng SVG nếu không muốn kéo antd icons |
