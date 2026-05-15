import en from './en/translations.json';
import zhCN from './zh-CN/translations.json';
import zhTW from './zh-TW/translations.json';

export const I18N_NAMESPACE = 'translations' as const;

export const resources = {
  en: {
    translations: en,
  },
  'zh-CN': {
    translations: zhCN,
  },
  'zh-TW': {
    translations: zhTW,
  },
} as const;

export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW'] as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: 'US' },
  { code: 'zh-CN', name: '简体中文', nativeName: 'Simplified Chinese', dir: 'ltr', flag: 'CN' },
  { code: 'zh-TW', name: '繁体中文', nativeName: 'Traditional Chinese', dir: 'ltr', flag: 'TW' },
] as const;

export type Locale = keyof typeof resources;
export type TranslationKey = keyof typeof resources.en.translations;
