/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ComponentType, type CSSProperties, type ReactNode } from 'react';

/** Link component tối thiểu — landing không phụ thuộc router nào. */
export interface LinkProps { to: string; className?: string; style?: CSSProperties; children?: ReactNode; onClick?: () => void }

export interface LandingConfig {
  /** Component render link nội bộ. Mặc định <a href>. Với TanStack Router: ({ to, ...p }) => <Link to={to} {...p} /> */
  Link: ComponentType<LinkProps>;
  /** Đường dẫn các trang mà landing trỏ tới. */
  links: { login: string; register: string; forgot: string };
  /** Người dùng đang đăng nhập (nếu có) → nav hiện "Vào hệ thống". */
  user: { dashboardHref: string } | null;
}

const DefaultLink = ({ to, children, ...rest }: LinkProps) => <a href={to} {...rest}>{children}</a>;

export const DEFAULT_CONFIG: LandingConfig = {
  Link: DefaultLink,
  links: { login: '/login', register: '/register', forgot: '/forgot-password' },
  user: null,
};

const Ctx = createContext<LandingConfig>(DEFAULT_CONFIG);
export const LandingConfigProvider = Ctx.Provider;
export const useLanding = () => useContext(Ctx);
