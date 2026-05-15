import { LANGUAGE_OPTIONS, type Locale } from './resources';

export interface LanguageConfig {
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<Locale, LanguageConfig> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((item) => [
    item.code,
    {
      name: item.name,
      nativeName: item.nativeName,
      dir: item.dir,
      flag: item.flag,
    },
  ]),
) as Record<Locale, LanguageConfig>;

export function getLanguageConfig(locale: Locale): LanguageConfig {
  return SUPPORTED_LANGUAGES[locale];
}

export function getAvailableLanguages() {
  return LANGUAGE_OPTIONS.map((item) => ({
    code: item.code,
    name: item.name,
    nativeName: item.nativeName,
    dir: item.dir,
    flag: item.flag,
  }));
}
