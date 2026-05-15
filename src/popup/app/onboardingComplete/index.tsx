import { Button, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import readyIcon from '@/assets/icon/readyIcon.svg';
import extension from '@/assets/icon/extension.svg';
import keep from '@/assets/icon/keep.svg';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

export default function OnboardingCompletePage() {
  const { t } = useTranslation();

  return (
    <Flex className="complete-page onboarding-border-radius" vertical align="center" justify="space-between">
      <Button
        type="text"
        size="small"
        shape="circle"
        icon={<CloseOutlined />}
        className="complete-page-close"
        onClick={() => {
          window.close();
        }}
      />

      <img src={readyIcon} alt="Wallet ready illustration" className="complete-page-image" />

      <Flex vertical align="center" gap={10}>
        <div className="complete-page-title">{t('page.onboarding.complete.title')}</div>
        <div className="complete-page-description">{t('page.onboarding.complete.description')}</div>
      </Flex>

      <Flex vertical gap={10} className="complete-page-fix-block" align="center">
        <div className="complete-page-fix-title">{t('page.onboarding.complete.fix.title')}</div>
        <div className="complete-page-fix-description">
          {t('page.onboarding.complete.fix.lead')}
          <img src={extension} className="complete-page-inline-icon" alt="Extensions menu icon" />
          {t('page.onboarding.complete.fix.and')}
          <img src={keep} className="complete-page-inline-icon" alt="Pin icon" />
          {t('page.onboarding.complete.fix.suffix')}
        </div>
      </Flex>
    </Flex>
  );
}
