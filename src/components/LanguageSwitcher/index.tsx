import { useTranslation } from '@/popup/hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@/locales/config';

export function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="language-switcher">
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
        <button key={code} onClick={() => changeLanguage(code)} className={language === code ? 'active' : ''} title={lang.nativeName}>
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
}
