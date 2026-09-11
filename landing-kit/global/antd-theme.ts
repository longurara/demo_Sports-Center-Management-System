/** Chỉ dùng nếu dự án có Ant Design: <ConfigProvider theme={antdTheme}>. Không có antd thì bỏ file này. */
import type { ThemeConfig } from 'antd';
import { FONT_BODY, TOKENS as T } from './tokens';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: T.primary,
    colorInfo: T.primary,
    colorLink: T.primary,
    colorSuccess: T.success,
    colorWarning: T.warning,
    colorError: T.error,
    colorBgLayout: T.paper,
    colorBgContainer: T.surface,
    colorText: T.ink,
    colorTextSecondary: T.muted,
    colorBorder: T.border,
    colorBorderSecondary: T.borderSoft,
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: FONT_BODY,
    fontSize: 14,
    controlHeight: 38,
    boxShadow: '0 1px 2px rgba(20,19,15,.04), 0 4px 16px rgba(20,19,15,.06)',
    boxShadowSecondary: '0 6px 24px rgba(20,19,15,.10)',
  },
  components: {
    Card: { headerFontSize: 15, headerBg: 'transparent', paddingLG: 20, colorBorderSecondary: T.borderSoft },
    Table: { headerBg: '#f7f5f0', headerColor: T.muted, headerSplitColor: 'transparent', rowHoverBg: '#f6f8f5', cellPaddingBlock: 12, borderColor: T.borderSoft },
    Layout: { siderBg: T.ink, headerBg: '#fff', headerHeight: 64, bodyBg: T.paper },
    Button: { primaryShadow: 'none', fontWeight: 600 },
    Tag: { borderRadiusSM: 6 },
    Input: { activeShadow: '0 0 0 3px rgba(15,77,52,.12)' },
    Progress: { defaultColor: T.primary },
  },
};
