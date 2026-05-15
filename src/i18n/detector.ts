export const DEFAULT_LOCALE = 'en';

export function normalizeLocale(language: string | undefined | null) {
  const value = (language || '').toLowerCase();

  if (value.startsWith('zh-tw') || value.startsWith('zh-hk') || value.startsWith('zh-mo')) {
    return 'zh-TW';
  }

  if (value.startsWith('zh')) {
    return 'zh-CN';
  }

  return DEFAULT_LOCALE;
}

export function detectLocale() {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(navigator.language);
}
