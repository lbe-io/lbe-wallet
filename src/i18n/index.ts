export { default as i18n, initializeI18n } from './singleton';
export { detectLocale, normalizeLocale, DEFAULT_LOCALE } from './detector';
export { syncLanguagePreference } from './syncLanguagePreference';
export { I18N_NAMESPACE, resources, type Locale, type TranslationKey } from '@/locales';
