import React, { useMemo, useState } from 'react';
import { Flex, Select, Typography, message } from 'antd';
import FullScreen from '@/components/FullScreen';
import { getAvailableLanguages } from '@/locales';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { normalizeLocale } from '@/i18n';
import { useWallet } from '@/app/contexts';
import type { SettingsModalProps } from '@/popup/types/popupUi';
import './index.css';

const { Text } = Typography;

const Settings: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const walletController = useWallet();
  const { i18n, t } = useTranslation();
  const [updatingLocale, setUpdatingLocale] = useState<string | null>(null);

  const languageOptions = useMemo(
    () =>
      getAvailableLanguages().map((item) => ({
        value: item.code,
        label: item.name,
      })),
    [],
  );

  const currentLocale = useMemo(() => normalizeLocale(i18n.resolvedLanguage || i18n.language || 'en'), [i18n.language, i18n.resolvedLanguage]);

  const handleLanguageChange = async (locale: string) => {
    if (locale === currentLocale || updatingLocale) {
      return;
    }

    try {
      setUpdatingLocale(locale);
      await walletController.setLocale(locale);
      await i18n.changeLanguage(locale);
    } catch (error: any) {
      message.error(error?.message || t('page.settings.update.language.fail'));
    } finally {
      setUpdatingLocale(null);
    }
  };

  return (
    <FullScreen title={t('page.settings.title')} isOpen={isOpen} onClose={onClose}>
      <div className="settings-modal-root ui-fill-shell">
        <Flex vertical gap={8} className="settings-modal-content">
          <Text className="ui-label-sm-primary-medium">{t('common.language')}</Text>
          <Select
            value={currentLocale}
            options={languageOptions}
            onChange={(value) => {
              void handleLanguageChange(value);
            }}
            loading={!!updatingLocale}
            disabled={!!updatingLocale}
            popupMatchSelectWidth={false}
          />
        </Flex>
      </div>
    </FullScreen>
  );
};

export default Settings;
