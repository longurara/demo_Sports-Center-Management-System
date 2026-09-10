import type { ThemeConfig } from 'antd';

export const BRAND = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  accent: '#f97316',
  sider: '#0b1220',
  siderBorder: 'rgba(255,255,255,0.06)',
  bg: '#f4f6fb',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e6eaf2',
};

export const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND.primary,
    colorInfo: BRAND.primary,
    colorSuccess: '#16a34a',
    colorWarning: '#f59e0b',
    colorError: '#dc2626',
    colorBgLayout: BRAND.bg,
    colorText: BRAND.text,
    colorTextSecondary: BRAND.muted,
    colorBorder: BRAND.border,
    colorBorderSecondary: '#eef1f6',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    controlHeight: 38,
    boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)',
    boxShadowSecondary: '0 6px 24px rgba(15,23,42,.10)',
  },
  components: {
    Card: { headerFontSize: 15, headerBg: 'transparent', paddingLG: 20, colorBorderSecondary: '#eef1f6' },
    Table: { headerBg: '#f8fafc', headerColor: BRAND.muted, headerSplitColor: 'transparent', rowHoverBg: '#f5f8ff', cellPaddingBlock: 12, borderColor: '#eef1f6' },
    Menu: {
      darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent', darkItemColor: 'rgba(255,255,255,.62)', darkItemHoverColor: '#fff',
      darkItemHoverBg: 'rgba(255,255,255,.06)', darkItemSelectedBg: BRAND.primary, darkItemSelectedColor: '#fff', itemBorderRadius: 8, itemMarginInline: 10, iconSize: 16,
    },
    Layout: { siderBg: BRAND.sider, headerBg: '#fff', headerHeight: 64, bodyBg: BRAND.bg },
    Button: { primaryShadow: '0 4px 12px rgba(37,99,235,.28)', fontWeight: 500 },
    Statistic: { titleFontSize: 13, contentFontSize: 26 },
    Tag: { borderRadiusSM: 999 },
    Tabs: { titleFontSize: 14, horizontalItemGutter: 24 },
    Descriptions: { labelBg: '#f8fafc' },
    Input: { activeShadow: '0 0 0 3px rgba(37,99,235,.12)' },
    Steps: { iconSize: 30 },
  },
};
