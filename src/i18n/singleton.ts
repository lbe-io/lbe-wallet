import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { detectLocale, DEFAULT_LOCALE } from './detector';
import { resources, I18N_NAMESPACE } from '@/locales';

let initialized = false;

export function initializeI18n() {
  if (initialized) {
    return i18next;
  }

  i18next.use(initReactI18next).init({
    resources,
    lng: detectLocale(),
    fallbackLng: DEFAULT_LOCALE,
    ns: [I18N_NAMESPACE],
    defaultNS: I18N_NAMESPACE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  initialized = true;
  return i18next;
}

const i18n = initializeI18n();

export default i18n;
