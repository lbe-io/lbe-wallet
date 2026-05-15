import { useCallback, useMemo } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { TranslationKey } from '@/locales/resources';
import { I18N_NAMESPACE } from '@/locales';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation(I18N_NAMESPACE);
  const translate = useCallback(
    (
      key: TranslationKey,
      options?: {
        defaultValue?: string;
        [interpolationKey: string]: string | number | boolean | undefined;
      },
    ) => t(key, options),
    [t],
  );
  const changeLanguage = useCallback((lang: string) => i18n.changeLanguage(lang), [i18n]);

  return useMemo(
    () => ({
      t: translate,
      language: i18n.language,
      changeLanguage,
      i18n,
    }),
    [translate, i18n.language, changeLanguage, i18n],
  );
}

export default useTranslation;
