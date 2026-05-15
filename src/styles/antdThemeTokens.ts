import type { ThemeConfig } from 'antd';

const BRAND_PRIMARY = '#2563EB';
const BRAND_SOFT = 'rgba(37, 99, 235, 0.14)';
const TEXT_PRIMARY = '#010101';
const TEXT_SECONDARY = '#86909C';
const BORDER_SUBTLE = '#E0E3EC';
const BORDER_STRONG = '#C5C5C5';
const BORDER_INPUT = '#DCDCDC';
const BG_SURFACE = '#F4F4F7';

const INPUT_PADDING_BLOCK_MD = 14;
const INPUT_PADDING_INLINE_MD = 24;
const INPUT_PADDING_BLOCK_SM = 12;
const INPUT_PADDING_INLINE_SM = 12;
const INPUT_PADDING_BLOCK_XS = 8;
const INPUT_PADDING_INLINE_XS = 16;

const activeShadow = `0 0 0 2px ${BRAND_SOFT}`;

export const appBaseTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    borderRadiusSM: 8,
    controlHeightSM: 36,
    controlHeight: 44,
    controlHeightLG: 52,
    controlInteractiveSize: 16,
    colorText: TEXT_PRIMARY,
  },
  components: {
    Button: {
      fontWeight: 600,
      colorTextDisabled: TEXT_PRIMARY,
      colorBgContainerDisabled: BORDER_SUBTLE,
      defaultBorderColor: BORDER_STRONG,
      primaryShadow: 'none',
    },
    Input: {
      colorBorder: BORDER_STRONG,
      hoverBorderColor: BRAND_PRIMARY,
      activeBorderColor: BRAND_PRIMARY,
      activeShadow,
      colorTextPlaceholder: TEXT_SECONDARY,
      paddingBlock: INPUT_PADDING_BLOCK_MD,
      paddingInline: INPUT_PADDING_INLINE_MD,
    },
    Form: {
      labelColor: TEXT_SECONDARY,
    },
    Checkbox: {
      borderRadiusSM: 4,
    },
  },
};

export const themePrimarySurface: ThemeConfig = {
  token: {
    colorPrimary: BG_SURFACE,
  },
};

export const customCryptoModalTheme: ThemeConfig = {
  components: {
    Input: {
      colorBorder: BORDER_INPUT,
      paddingBlock: INPUT_PADDING_BLOCK_SM,
      paddingInline: INPUT_PADDING_INLINE_SM,
      borderRadius: 4,
    },
    Select: {
      colorBorder: BORDER_INPUT,
      borderRadius: 4,
    },
    Form: {
      labelColor: TEXT_SECONDARY,
    },
  },
};

export const networkEditModalTheme: ThemeConfig = {
  components: {
    Input: {
      colorBorder: BORDER_INPUT,
      paddingBlock: INPUT_PADDING_BLOCK_XS,
      paddingInline: INPUT_PADDING_INLINE_XS,
      borderRadius: 4,
    },
    Form: {
      labelColor: TEXT_SECONDARY,
    },
  },
};
