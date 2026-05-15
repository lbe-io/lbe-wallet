import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flex, Button, Typography, Modal, message, Checkbox, Spin } from 'antd';
import { EyeInvisibleOutlined } from '@ant-design/icons';
import GenerateSteps from '@/components/GenerateSteps';
import SecretRecoveryPhrase from '@/popup/app/modal/SecretRecoveryPhrase';
import { useWallet } from '@/app/contexts';
import { useAppDispatch } from '@/popup/hooks/redux';
import { getAllWallets } from '@/cosmos/storage';
import { applyWalletBootstrap, finalizeWalletSetup } from '@/popup/utils/walletSetup';
import warningIcon from '@/assets/icon/warningIcon.svg';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text, Title } = Typography;

type RecoveryRouteState = {
  isFromReminder?: boolean;
  accountIndex?: number | string;
  walletId?: string;
};

const parseAccountIndex = (accountIndex: number | string | undefined) => {
  if (typeof accountIndex === 'number') {
    return accountIndex;
  }
  if (typeof accountIndex === 'string' && accountIndex.trim() !== '') {
    const parsed = Number(accountIndex);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const ReviewRecovery = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  const routeState = (location.state ?? {}) as RecoveryRouteState;
  const isFromReminder = !!routeState.isFromReminder;
  const [walletId, setWalletId] = useState<string | undefined>(routeState.walletId);

  const [revealed, setRevealed] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [openExplain, setOpenExplain] = useState(false);
  const [openSkip, setOpenSkip] = useState(false);

  const [agreeTerm, setAgreeTerm] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  const ensurePendingWalletForCreateFlow = useCallback(async () => {
    if (isFromReminder || walletId) {
      return;
    }

    const existedWallets = await getAllWallets();
    if (existedWallets.length) {
      return;
    }

    const walletState = await finalizeWalletSetup(wallet, 0, { mnemonicBackupPending: true });
    applyWalletBootstrap(dispatch, walletState);
    await wallet.setMnemonicBackupPending(true, walletState.wallet.id);
    setWalletId(walletState.wallet.id);
  }, [dispatch, isFromReminder, wallet, walletId]);

  const initMnemonic = useCallback(async () => {
    try {
      const mnemonicText = isFromReminder ? await wallet.getAccountMnemonic(parseAccountIndex(routeState.accountIndex)) : await wallet.getMnemonic();

      if (!mnemonicText) {
        message.error(t('page.import.recovery.load.seed.fail'));
        navigate('/create-password');
        return;
      }

      const words = mnemonicText.trim().split(/\s+/g);

      if (words.length < 12) {
        throw new Error(t('validation.wallet.mnemonic.invalid'));
      }

      setMnemonic(words);
      await ensurePendingWalletForCreateFlow();
    } catch (error: any) {
      message.error(error?.message || t('page.import.recovery.load.seed.fail'));
    } finally {
      setLoading(false);
    }
  }, [ensurePendingWalletForCreateFlow, isFromReminder, routeState.accountIndex, wallet, navigate, t]);

  useEffect(() => {
    initMnemonic();
  }, [initMnemonic]);

  const handleContinue = () => {
    navigate('/confirm-recovery-phrase', {
      state: {
        isFromReminder,
        accountIndex: routeState.accountIndex,
        walletId,
      },
    });
  };

  const handleSkipConfirm = async () => {
    if (!agreeTerm || skipLoading) {
      return;
    }

    try {
      setSkipLoading(true);
      const existedWallets = await getAllWallets();
      if (!existedWallets.length) {
        const walletState = await finalizeWalletSetup(wallet);
        applyWalletBootstrap(dispatch, walletState);
        await wallet.setMnemonicBackupPending(true, walletState.wallet.id);
      } else if (walletId) {
        await wallet.setMnemonicBackupPending(true, walletId);
      }
      message.warning(t('page.review.recovery.skip.warning'));
      setOpenSkip(false);
      navigate('/onboarding-complete');
    } catch (error: any) {
      message.error(error?.message || t('page.import.account.fail'));
    } finally {
      setSkipLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" className="review-recovery-loading">
        <Spin />
      </Flex>
    );
  }

  return (
    <GenerateSteps
      steps={isFromReminder ? 2 : 3}
      curStep={isFromReminder ? 1 : 2}
      title={t('page.review.recovery.title')}
      onBack={isFromReminder ? undefined : () => {}}
      tip={
        <Text>
          {t('page.review.recovery.tip1')}
          <Text strong className="clickable-word" onClick={() => setOpenExplain(true)}>
            {t('page.review.recovery.tip2')}
          </Text>
          {t('page.review.recovery.tip3')}
        </Text>
      }
    >
      <Flex vertical className="review-recovery" align="center" justify="space-between" gap={28}>
        <Flex vertical justify="center" className="mnemonic-wrapper" onClick={() => !revealed && setRevealed(true)}>
          <div className="phrase-mnemonic-grid">
            {mnemonic.map((word, index) => (
              <Text key={index} className={`word-box ${revealed ? 'revealed' : 'masked'}`}>
                {index + 1}. {word}
              </Text>
            ))}
          </div>

          {!revealed && (
            <Flex vertical align="center" justify="center" className="overlay ui-recovery-overlay">
              <EyeInvisibleOutlined style={{ fontSize: 22 }} />
              <Title level={5} className="review-recovery-overlay-title">
                {t('page.review.recovery.overlay.title')}
              </Title>
              <Text type="secondary">{t('page.review.recovery.overlay.tip')}</Text>
            </Flex>
          )}
        </Flex>

        <Flex vertical align="center" justify="center" gap={8} className="review-recovery-actions phrase-full-width">
          <Button block size="large" shape="round" type="primary" disabled={!revealed} onClick={handleContinue}>
            {t('common.continue')}
          </Button>

          {!isFromReminder && (
            <Button block size="large" shape="round" type="link" onClick={() => setOpenSkip(true)}>
              {t('page.review.recovery.skip.proceed')}
            </Button>
          )}
        </Flex>
      </Flex>

      <SecretRecoveryPhrase open={openExplain} onClose={() => setOpenExplain(false)} locale="en" />

      <Modal width={420} open={openSkip} centered footer={null} onCancel={() => setOpenSkip(false)}>
        <Flex vertical align="center" gap={20} className="phrase-modal-content">
          <img src={warningIcon} alt="Warning" className="review-recovery-warning-icon" />

          <Title level={4}>{t('page.review.recovery.skip.title')}</Title>

          <Checkbox checked={agreeTerm} onChange={(e) => setAgreeTerm(e.target.checked)}>
            {t('page.review.recovery.skip.warning')}
          </Checkbox>

          <Flex gap={12} className="review-recovery-warning-actions phrase-full-width">
            <Button block size="large" shape="round" color="primary" variant="outlined" onClick={() => setOpenSkip(false)}>
              {t('page.review.recovery.skip.verify')}
            </Button>

            <Button block danger size="large" shape="round" type="primary" disabled={!agreeTerm || skipLoading} loading={skipLoading} onClick={handleSkipConfirm}>
              {t('page.review.recovery.skip.proceed')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </GenerateSteps>
  );
};

export default ReviewRecovery;
