import { useEffect } from 'react';
import { Flex, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import CreateBg from '@/assets/icon/CreateBg.svg';
import { useWallet } from '@/app/contexts';
import { updateWallet, updateAccount, updateChain } from '@/popup/store/features/applicationSlice';
import { useAppDispatch } from '@/popup/hooks/redux';
import { resetWalletEnvironment } from '@/popup/utils/walletSetup';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wallet = useWallet();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const reset = async () => {
      await resetWalletEnvironment(wallet);
      dispatch(updateWallet({ wallet: {} }));
      dispatch(updateAccount({ account: {} }));
      dispatch(updateChain({ chain: {} }));
    };
    reset();
  }, []);

  return (
    <Flex className="welcome-page onboarding-border-radius" vertical align="center" justify="space-between">
      <img src={CreateBg} alt="Welcome illustration" className="welcome-page-image" />
      <Flex vertical align="center" gap={16}>
        <span className="welcome-page-title">{t('page.welcome.title')}</span>
      </Flex>
      <Flex vertical align="center" gap={16} className="welcome-page-actions">
        <Button block shape="round" size="large" type="primary" onClick={() => navigate('/create-password', { state: { type: 'create' } })}>
          {t('page.welcome.create.wallet')}
        </Button>
        <Button block shape="round" size="large" onClick={() => navigate('/import-with-recovery-phrase')}>
          {t('page.welcome.import.wallet')}
        </Button>
      </Flex>
    </Flex>
  );
}

export default WelcomePage;
