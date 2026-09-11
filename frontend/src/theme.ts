import type { ThemeConfig } from 'antd';

/** Bộ màu dùng chung với landing / auth: giấy ấm + mực đen + xanh sân + vàng chanh, điểm nhấn đất nung. */
export const BRAND = {
  primary: '#0f4d34',      // xanh sân
  primaryDark: '#0b3b28',
  primarySoft: '#e3efe8',  // nền nhạt cho icon / hàng chọn
  accent: '#c94a1e',       // đất nung — thay cho cam cũ
  accentSoft: '#f9e6dd',
  lime: '#d6f24b',         // chỉ dùng cho logo / điểm nhấn nhỏ
  sider: '#14130f',        // mực
  siderBorder: 'rgba(255,255,255,0.07)',
  bg: '#f2efe8',           // giấy
  surface: '#ffffff',
  text: '#14130f',
  muted: '#7a776f',
  border: '#e2ddd2',
  borderSoft: '#ece8df',
};

export const FONT = "'Barlow', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const FONT_DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND.primary,
    colorInfo: BRAND.primary,
    colorLink: BRAND.primary,
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorBgLayout: BRAND.bg,
    colorBgContainer: BRAND.surface,
    colorText: BRAND.text,
    colorTextSecondary: BRAND.muted,
    colorBorder: BRAND.border,
    colorBorderSecondary: BRAND.borderSoft,
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: FONT,
    fontSize: 14,
    controlHeight: 38,
    boxShadow: '0 1px 2px rgba(20,19,15,.04), 0 4px 16px rgba(20,19,15,.06)',
    boxShadowSecondary: '0 6px 24px rgba(20,19,15,.10)',
  },
  components: {
    Card: { headerFontSize: 15, headerBg: 'transparent', paddingLG: 20, colorBorderSecondary: BRAND.borderSoft },
    Table: { headerBg: '#f7f5f0', headerColor: BRAND.muted, headerSplitColor: 'transparent', rowHoverBg: '#f6f8f5', cellPaddingBlock: 12, borderColor: BRAND.borderSoft },
    Menu: {
      darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent', darkItemColor: 'rgba(255,255,255,.62)', darkItemHoverColor: '#fff',
      darkItemHoverBg: 'rgba(255,255,255,.06)', darkItemSelectedBg: BRAND.primary, darkItemSelectedColor: '#fff', itemBorderRadius: 8, itemMarginInline: 10, iconSize: 16,
    },
    Layout: { siderBg: BRAND.sider, headerBg: '#fff', headerHeight: 64, bodyBg: BRAND.bg },
    Button: { primaryShadow: 'none', fontWeight: 600 },
    Statistic: { titleFontSize: 13, contentFontSize: 26 },
    Tag: { borderRadiusSM: 6 },
    Tabs: { titleFontSize: 14, horizontalItemGutter: 24 },
    Descriptions: { labelBg: '#f7f5f0' },
    Input: { activeShadow: '0 0 0 3px rgba(15,77,52,.12)' },
    Steps: { iconSize: 30 },
    Progress: { defaultColor: BRAND.primary },
  },
};
