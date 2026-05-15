import { resources } from './resources';
import type { Locale, TranslationKey } from './resources';
export type { Locale, TranslationKey };

export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && locale in resources;
}

export function isValidTranslationKey(key: unknown): key is TranslationKey {
  return typeof key === 'string' && key in resources.en.translations;
}

export function getSupportedLocales(): Locale[] {
  return Object.keys(resources) as Locale[];
}
