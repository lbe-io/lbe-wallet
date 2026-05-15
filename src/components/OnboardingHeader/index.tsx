import { useMemo, useState } from 'react';
import { Select } from 'antd';
import { useWallet } from '@/app/contexts';
import { getAvailableLanguages } from '@/locales';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { normalizeLocale } from '@/i18n';
import logo from '@/assets/logo.png';
import './index.css';

type LanguageOption = {
  value: string;
  label: string;
};

export default function OnboardingHeader() {
  const { i18n } = useTranslation();
  const wallet = useWallet();
  const [updatingLocale, setUpdatingLocale] = useState<string | null>(null);

  const languageOptions = useMemo<LanguageOption[]>(
    () =>
      getAvailableLanguages().map((item) => ({
        value: item.code,
        label: item.name,
      })),
    [],
  );

  const currentLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <header className="onboarding-header">
      <div className="onboarding-header-brand">
        <img src={logo} alt="LBE Wallet logo" className="onboarding-header-logo" />
        <span className="onboarding-header-brand-text">{'LBE Wallet'}</span>
      </div>
      <Select
        value={currentLocale}
        onChange={(value) => {
          if (value === currentLocale || updatingLocale) {
            return;
          }
          void (async () => {
            try {
              setUpdatingLocale(value);
              await wallet.setLocale(value);
              await i18n.changeLanguage(value);
            } finally {
              setUpdatingLocale(null);
            }
          })();
        }}
        options={languageOptions}
        className="onboarding-header-lang"
        popupMatchSelectWidth={false}
        loading={!!updatingLocale}
        disabled={!!updatingLocale}
      />
    </header>
  );
}
