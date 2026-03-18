import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

/* ─── BRAND CONSTANTS ─── */
export const COLOR_PRIMARY = '#FF5F00';
export const COLOR_SUCCESS = '#00C853';
export const COLOR_ACCENT  = '#F1C40F';
export const COLOR_ERROR   = '#ef4444';
export const BRAND_GRADIENT = 'linear-gradient(135deg, #FF5F00 0%, #00C853 100%)';

/* ─── DARK palette (mirrors User-Page style.css) ─── */
const DARK = {
  bg:        '#030712',
  surface:   '#0a0f1a',
  card:      '#111827',
  sider:     '#080a12',
  border:    'rgba(255,255,255,0.08)',
  text:      '#f0f0f0',
  textDim:   '#94a3b8',
  textMuted: '#6b7280',
  inputBg:   'rgba(0,0,0,0.4)',
};

/* ─── LIGHT palette (brand-safe) ─── */
const LIGHT = {
  bg:        '#f5f5f7',
  surface:   '#ffffff',
  card:      '#ffffff',
  sider:     '#fafafa',
  border:    'rgba(0,0,0,0.08)',
  text:      '#111827',
  textDim:   '#4b5563',
  textMuted: '#9ca3af',
  inputBg:   '#f9fafb',
};

export type ThemeMode = 'dark' | 'light';

export function getGagnerTheme(mode: ThemeMode): ThemeConfig {
  const d = mode === 'dark';
  const p = d ? DARK : LIGHT;
  return {
    algorithm: d ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary:       COLOR_PRIMARY,
      colorSuccess:       COLOR_SUCCESS,
      colorWarning:       COLOR_ACCENT,
      colorError:         COLOR_ERROR,
      colorInfo:          COLOR_PRIMARY,
      colorBgBase:        p.bg,
      colorBgContainer:   p.card,
      colorBgElevated:    p.surface,
      colorBgLayout:      p.bg,
      colorBorder:        p.border,
      colorBorderSecondary: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      colorText:          p.text,
      colorTextSecondary: p.textDim,
      colorTextTertiary:  p.textMuted,
      fontFamily:         "'Outfit', sans-serif",
      borderRadius:       8,
      fontSize:           14,
      controlHeight:      40,
    },
    components: {
      Layout: {
        siderBg: p.sider,
        headerBg: p.surface,
        bodyBg: p.bg,
        triggerBg: p.card,
      },
      Menu: {
        ...(d ? {
          darkItemBg:           p.sider,
          darkItemSelectedBg:   'rgba(255,95,0,0.12)',
          darkItemHoverBg:      'rgba(255,95,0,0.08)',
          darkItemSelectedColor: COLOR_PRIMARY,
          darkItemColor:         p.textDim,
        } : {
          itemBg:              p.sider,
          itemSelectedBg:      'rgba(255,95,0,0.10)',
          itemHoverBg:         'rgba(255,95,0,0.06)',
          itemSelectedColor:   COLOR_PRIMARY,
          itemColor:           p.textDim,
        }),
      },
      Table: {
        headerBg:    d ? 'rgba(0,0,0,0.3)' : '#fafafa',
        headerColor: p.textDim,
        rowHoverBg:  d ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        borderColor: p.border,
      },
      Card: { colorBgContainer: p.card },
      Button: { primaryShadow: '0 4px 15px rgba(255,95,0,0.3)' },
      Input: {
        colorBgContainer:  p.inputBg,
        activeBorderColor: COLOR_SUCCESS,
        hoverBorderColor:  COLOR_PRIMARY,
      },
      Select:     { colorBgContainer: p.inputBg, optionSelectedBg: 'rgba(255,95,0,0.15)' },
      Modal:      { contentBg: p.surface, headerBg: p.surface },
      Switch:     { colorPrimary: COLOR_SUCCESS, colorPrimaryHover: '#00E676' },
      Tag:        { defaultBg: 'rgba(0,200,83,0.15)', defaultColor: COLOR_SUCCESS },
      DatePicker: { colorBgContainer: p.inputBg },
      Statistic:  { titleFontSize: 12, contentFontSize: 32 },
    },
  };
}

/* backward-compat export */
export const gagnerTheme = getGagnerTheme('dark');

/* Palette helpers for inline styles */
export function getPalette(mode: ThemeMode) {
  return mode === 'dark' ? DARK : LIGHT;
}
