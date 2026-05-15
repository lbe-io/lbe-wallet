import i18n from './singleton';
import { normalizeLocale } from './detector';
import { isValidLocale, type Locale } from '@/locales/types';
import { browser } from 'wxt/browser';

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

const normalizePreferredLocale = (value: unknown): Locale => {
  if (isValidLocale(value)) {
    return value;
  }
  const normalized = normalizeLocale(typeof value === 'string' ? value : '');
  return isValidLocale(normalized) ? normalized : 'en';
};

export async function syncLanguagePreference(getLocale?: () => Promise<string>) {
  let preferredLocale: Locale | null = null;

  if (getLocale) {
    try {
      preferredLocale = normalizePreferredLocale(await getLocale());
    } catch (error) {
      console.warn('Failed to load locale from wallet controller:', error);
    }
  }

  if (!preferredLocale) {
    try {
      const stored = await browser.storage.local.get(LANGUAGE_STORAGE_KEY);
      preferredLocale = normalizePreferredLocale(stored[LANGUAGE_STORAGE_KEY]);
    } catch (error) {
      console.warn('Failed to load locale from storage:', error);
    }
  }

  if (!preferredLocale) {
    return;
  }

  const currentLocale = normalizePreferredLocale(i18n.resolvedLanguage || i18n.language);
  if (currentLocale !== preferredLocale) {
    await i18n.changeLanguage(preferredLocale);
  }
}
