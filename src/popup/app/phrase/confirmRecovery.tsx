import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, Flex, Modal, message } from 'antd';
import { useAppDispatch } from '@/popup/hooks/redux';
import GenerateSteps from '@/components/GenerateSteps';
import { useWallet } from '@/app/contexts';
import { getAllWallets } from '@/cosmos/storage';
import { applyWalletBootstrap, finalizeWalletSetup } from '@/popup/utils/walletSetup';
import { AppIcon } from '@/assets/icon';
import { openWalletHome } from '@/popup/utils/openWalletHome';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Title, Text } = Typography;

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

const shuffle = <T,>(values: T[]): T[] => {
  const list = [...values];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const pickChallengeIndices = (wordCount: number, pickCount: number) => {
  const allIndices = Array.from({ length: wordCount }, (_, index) => index);
  return shuffle(allIndices)
    .slice(0, Math.min(wordCount, pickCount))
    .sort((a, b) => a - b);
};

const ConfirmRecovery = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const routeState = (location.state ?? {}) as RecoveryRouteState;
  const isFromReminder = !!routeState.isFromReminder;

  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [filled, setFilled] = useState<Record<number, string>>({});
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const challengeSeedKeyRef = useRef('');

  const navigateToReview = () => {
    navigate('/review-recovery-phrase', {
      state: {
        isFromReminder,
        accountIndex: routeState.accountIndex,
        walletId: routeState.walletId,
      },
    });
  };

  useEffect(() => {
    const loadMnemonic = async () => {
      try {
        const mnemonicText = isFromReminder ? await wallet.getAccountMnemonic(parseAccountIndex(routeState.accountIndex)) : await wallet.getMnemonic();
        if (!mnemonicText) {
          message.error(t('page.import.recovery.load.seed.fail'));
          navigateToReview();
          return;
        }

        const words = mnemonicText.trim().split(/\s+/g);
        if (words.length < 12) {
          message.error(t('validation.wallet.mnemonic.invalid'));
          navigateToReview();
          return;
        }

        const seedKey = words.join(' ');
        setMnemonicWords(words);
        if (challengeSeedKeyRef.current !== seedKey) {
          setChallengeIndices(pickChallengeIndices(words.length, 3));
          challengeSeedKeyRef.current = seedKey;
        }
      } catch (error: any) {
        message.error(error?.message || t('page.import.recovery.load.seed.fail'));
        navigateToReview();
      } finally {
        setLoading(false);
      }
    };

    loadMnemonic();
  }, [isFromReminder, navigate, routeState.accountIndex, routeState.walletId, wallet]);

  const selectedIndex = challengeIndices[activeStep];
  const candidates = useMemo(() => shuffle(challengeIndices.map((index) => mnemonicWords[index])), [challengeIndices, mnemonicWords]);

  const isFilled = challengeIndices.length > 0 && challengeIndices.every((index) => !!filled[index]);

  const handlePickWord = (word: string) => {
    if (!Number.isInteger(selectedIndex)) return;
    if (usedWords.includes(word)) return;

    setFilled((prev) => ({
      ...prev,
      [selectedIndex]: word,
    }));
    setUsedWords((prev) => [...prev, word]);

    if (activeStep < challengeIndices.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const resetVerify = () => {
    setFilled({});
    setUsedWords([]);
    setActiveStep(0);
    if (mnemonicWords.length > 0) {
      setChallengeIndices(pickChallengeIndices(mnemonicWords.length, 3));
    }
  };

  const handleConfirm = async () => {
    if (!isFilled || submitting) return;

    const isCorrect = challengeIndices.every((index) => filled[index] === mnemonicWords[index]);
    if (!isCorrect) {
      setErrorOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      if (isFromReminder) {
        await wallet.setMnemonicBackupPending(false, routeState.walletId);
        message.success(t('page.login.mnemonic.success'));
        await openWalletHome(navigate);
        return;
      }

      if (routeState.walletId) {
        await wallet.setMnemonicBackupPending(false, routeState.walletId);
        message.success(t('page.login.mnemonic.success'));
        navigate('/onboarding-complete');
        return;
      }

      const existedWallets = await getAllWallets();
      if (existedWallets.length > 0) {
        message.success(t('page.login.mnemonic.success'));
        navigate('/onboarding-complete');
        return;
      }

      const walletState = await finalizeWalletSetup(wallet, 0, { mnemonicBackupPending: false });
      applyWalletBootstrap(dispatch, walletState);
      await wallet.setMnemonicBackupPending(false, walletState.wallet.id);

      message.success(t('page.login.mnemonic.success'));
      navigate('/onboarding-complete');
    } catch (error: any) {
      message.error(error?.message || t('page.import.account.fail'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>{t('page.confirm.recovery.loading')}</div>;
  }

  return (
    <GenerateSteps steps={isFromReminder ? 2 : 3} curStep={isFromReminder ? 2 : 3} title={t('page.confirm.recovery.title')} tip={t('page.confirm.recovery.tip')}>
      <Flex className="review-recovery" vertical align="center" justify="space-between" gap={24}>
        <Flex vertical justify="center" className="mnemonic-wrapper">
          <div className="phrase-mnemonic-grid">
            {mnemonicWords.map((word, index) => {
              const isMissing = challengeIndices.includes(index);
              const isActive = !isFilled && Number.isInteger(selectedIndex) && index === selectedIndex;
              return (
                <Text key={index} className={`word-box ${isActive ? 'active' : ''} ${!isMissing ? 'readonly' : ''}`}>
                  {isMissing ? `${index + 1}. ${filled[index] || ''}` : `${index + 1}. ******`}
                </Text>
              );
            })}
          </div>
        </Flex>

        <Flex wrap="wrap" gap={18} className="confirm-recovery-candidates phrase-full-width">
          {candidates.map((word, i) => {
            const disabled = usedWords.includes(word);
            return (
              <Button key={`${word}_${i}`} className="candidate-btn" disabled={disabled} onClick={() => handlePickWord(word)}>
                {word}
              </Button>
            );
          })}
        </Flex>

        <Button block size="large" shape="round" type="primary" disabled={!isFilled || submitting} loading={submitting} onClick={handleConfirm} className="confirm-recovery-submit">
          {t('common.continue')}
        </Button>
      </Flex>

      <Modal open={errorOpen} width={420} footer={null} centered closable={false} onCancel={() => setErrorOpen(false)}>
        <Flex vertical align="center" gap={20} className="phrase-modal-content">
          <AppIcon name="ErrorIcon" />

          <Title level={4}>{t('page.confirm.recovery.error.title')}</Title>

          <Text>{t('page.confirm.recovery.error.description')}</Text>

          <Button
            block
            size="large"
            shape="round"
            type="primary"
            onClick={() => {
              setErrorOpen(false);
              resetVerify();
            }}
          >
            {t('page.confirm.recovery.error.retry')}
          </Button>
        </Flex>
      </Modal>
    </GenerateSteps>
  );
};

export default ConfirmRecovery;
