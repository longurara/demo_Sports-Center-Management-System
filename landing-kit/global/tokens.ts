/** Cùng giá trị với tokens.css — dùng khi cần màu trong JS (chart, antd theme, inline style). */
export const TOKENS = {
  ink: '#14130f',
  ink2: '#3d3b35',
  paper: '#f2efe8',
  paper2: '#e9e5dc',
  surface: '#ffffff',
  primary: '#0f4d34',
  primaryDark: '#0b3b28',
  primarySoft: '#e3efe8',
  lime: '#d6f24b',
  accent: '#c94a1e',
  accentLight: '#e07a4f',
  accentSoft: '#f9e6dd',
  muted: '#7a776f',
  muted2: '#9a968c',
  border: '#e2ddd2',
  borderSoft: '#ece8df',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  role: { MANAGER: '#c94a1e', COACH: '#0f4d34', MEMBER: '#0891b2', RECEPTIONIST: '#d9a400' },
  roleOnDark: { MANAGER: '#e07a4f', COACH: '#5cbf8a', MEMBER: '#38bdf8', RECEPTIONIST: '#eab308' },
} as const;

export const FONT_BODY = "'Barlow', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const FONT_DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif";
export const EASE = [0.22, 1, 0.36, 1] as const;
