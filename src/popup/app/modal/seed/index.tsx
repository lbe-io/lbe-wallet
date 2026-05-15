import React, { useEffect, useMemo, useState } from 'react';
import { EyeInvisibleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import FullScreen from '@/components/FullScreen';
import { AppIcon } from '@/assets/icon';
import { useWallet } from '@/app/contexts';
import { useTranslation } from '@/popup/hooks/useTranslation';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import { useAppDispatch } from '@/popup/hooks/redux';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { hideLoad, showLoad } from '@/popup/store/features/applicationSlice';
import SecretRecoveryPhrase from '@/popup/app/modal/SecretRecoveryPhrase';
import type { SeedModalProps } from '@/popup/types/popupUi';
import './index.css';

const { Text, Title } = Typography;

type QuestionOption = {
  label: string;
  isCorrect: boolean;
};

type QuestionItem = {
  title: string;
  prompt: string;
  options: QuestionOption[];
  successTitle: string;
  successLead: string;
  successDescription: string;
  errorTitle: string;
  errorLead: string;
  errorDescription: string;
  successButtonText: string;
  errorButtonText: string;
};

type Stage = 'question' | 'success' | 'error' | 'password' | 'phrase';
type PhraseTab = 'text' | 'qr';

const normalizeMnemonic = (value: string) => (value || '').trim().replace(/\s+/g, ' ');

const Seed: React.FC<SeedModalProps> = ({ isOpen, onClose, account, wallet: walletProp }) => {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  const [, copyToClipboard] = useCopyClipboard();
  const { t } = useTranslation();
  const { selectedAccount, selectedWallet } = useWalletEntitySelector();
  const [form] = Form.useForm();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>('question');
  const [activeKey, setActiveKey] = useState<PhraseTab>('text');
  const [mnemonic, setMnemonic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [openExplain, setOpenExplain] = useState(false);

  const password = Form.useWatch('password', form) || '';
  const currentQuestion: QuestionItem = useMemo(() => {
    if (questionIndex === 0) {
      return {
        title: t('page.secret.recovery.phrase.question.title1'),
        prompt: t('page.secret.recovery.phrase.question.prompt1'),
        options: [
          { label: t('page.secret.recovery.phrase.question.option1.1'), isCorrect: false },
          { label: t('page.secret.recovery.phrase.question.option1.2'), isCorrect: true },
        ],
        successTitle: t('page.secret.recovery.phrase.question.correct.title'),
        successLead: t('page.secret.recovery.phrase.question.correct.lead'),
        successDescription: t('page.secret.recovery.phrase.question.correct.description'),
        errorTitle: t('page.secret.recovery.phrase.question.error.title'),
        errorLead: t('page.secret.recovery.phrase.question.error.lead'),
        errorDescription: t('page.secret.recovery.phrase.question.error.description'),
        successButtonText: t('page.secret.recovery.phrase.question.correct.button'),
        errorButtonText: t('page.secret.recovery.phrase.question.error.button'),
      };
    }

    return {
      title: t('page.secret.recovery.phrase.question.title2'),
      prompt: t('page.secret.recovery.phrase.question.prompt2'),
      options: [
        { label: t('page.secret.recovery.phrase.question.option2.1'), isCorrect: true },
        { label: t('page.secret.recovery.phrase.question.option2.2'), isCorrect: false },
      ],
      successTitle: t('page.secret.recovery.phrase.question.correct.title'),
      successLead: t('page.secret.recovery.phrase.question.correct.lead'),
      successDescription: t('page.secret.recovery.phrase.question.correct.description'),
      errorTitle: t('page.secret.recovery.phrase.question.error.title'),
      errorLead: t('page.secret.recovery.phrase.question.error.lead'),
      errorDescription: t('page.secret.recovery.phrase.question.error.description'),
      successButtonText: t('page.secret.recovery.phrase.question.correct.button'),
      errorButtonText: t('page.secret.recovery.phrase.question.error.button'),
    };
  }, [questionIndex, t]);

  const words = useMemo(() => normalizeMnemonic(mnemonic).split(' ').filter(Boolean), [mnemonic]);
  const resolvedAccount = account || selectedAccount;
  const resolvedWallet = walletProp || selectedWallet;
  const accountIndex = resolvedAccount?.index ?? 0;

  useEffect(() => {
    if (!isOpen) {
      setQuestionIndex(0);
      setSelectedOption(null);
      setStage('question');
      form.resetFields();
      setActiveKey('text');
      setMnemonic('');
      setSubmitting(false);
      setRevealed(false);
    }
  }, [form, isOpen]);

  const resetQuestionState = (nextIndex: number) => {
    setQuestionIndex(nextIndex);
    setSelectedOption(null);
    setStage('question');
  };

  const handleBack = () => {
    if (stage === 'phrase') {
      setStage('password');
      return;
    }

    if (stage === 'password') {
      form.resetFields();
      resetQuestionState(1);
      return;
    }

    if (stage !== 'question') {
      setStage('question');
      return;
    }

    if (questionIndex === 0) {
      onClose();
      return;
    }

    resetQuestionState(questionIndex - 1);
  };

  const revealMnemonic = async () => {
    const normalizedPassword = password.trim();
    if (!normalizedPassword || submitting) {
      return;
    }

    setSubmitting(true);
    form.setFields([{ name: 'password', errors: [] }]);
    dispatch(showLoad());

    try {
      await wallet.verifyPassword(normalizedPassword);
      const nextMnemonic = normalizeMnemonic(await wallet.getAccountMnemonic(accountIndex));
      if (!nextMnemonic) {
        throw new Error(t('page.import.recovery.load.seed.fail'));
      }
      setMnemonic(nextMnemonic);
      await wallet.setMnemonicBackupPending(false, resolvedWallet?.id);
      form.resetFields();
      setActiveKey('text');
      setStage('phrase');
    } catch (error: any) {
      form.setFields([
        {
          name: 'password',
          errors: [error?.message || t('error.api.invalid.password')],
        },
      ]);
    } finally {
      dispatch(hideLoad());
      setSubmitting(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (stage === 'question') {
      if (selectedOption === null) return;
      setStage(currentQuestion.options[selectedOption].isCorrect ? 'success' : 'error');
      return;
    }

    if (stage === 'error') {
      setSelectedOption(null);
      setStage('question');
      return;
    }

    if (stage === 'success') {
      if (questionIndex === 1) {
        setStage('password');
        return;
      }

      resetQuestionState(questionIndex + 1);
      return;
    }

    if (stage === 'password') {
      await revealMnemonic();
      return;
    }

    onClose();
  };

  const renderQuestionView = () => (
    <Flex vertical justify="space-between" className="seed-full-height">
      <div>
        <Flex className="warning-box" align="flex-start" gap={8}>
          <AppIcon name="WarningIcon" className="seed-warning-icon" />
          <Text className="seed-warning-text ui-text-sm-primary-body">{t('page.secret.recovery.phrase.reveal.warning')}</Text>
        </Flex>

        <Flex vertical gap={16} className="seed-question-header">
          <Title level={3} className="seed-question-title">
            {currentQuestion.title}
          </Title>
          <Text className="seed-question-prompt">{currentQuestion.prompt}</Text>
        </Flex>

        <Flex vertical gap={10} className="seed-question-options">
          {currentQuestion.options.map((option, index) => {
            const selected = selectedOption === index;

            return (
              <Button key={option.label} variant="filled" color={selected ? 'primary' : 'default'} onClick={() => setSelectedOption(index)} className="seed-option-btn">
                {option.label}
              </Button>
            );
          })}
        </Flex>
      </div>

      <Flex gap={12} className="seed-action-row">
        <Button block size="large" shape="round" color="primary" variant="outlined" onClick={onClose} className="seed-btn-base">
          {t('common.cancel')}
        </Button>
        <Button block size="large" shape="round" type="primary" disabled={selectedOption === null} onClick={() => void handlePrimaryAction()} className="seed-btn-primary">
          {questionIndex === 0 ? t('page.onboarding.get.started') : t('page.secret.recovery.phrase.reveal.submit')}
        </Button>
      </Flex>
    </Flex>
  );

  const renderResultView = () => {
    const isSuccess = stage === 'success';

    return (
      <Flex vertical justify="space-between" className="seed-full-height">
        <Flex vertical align="center" justify="center" className="seed-result-content">
          <AppIcon name={isSuccess ? 'SuccessIcon' : 'ErrorIcon'} />

          <Text className="seed-result-title seed-result-title-primary">{isSuccess ? currentQuestion.successTitle : currentQuestion.errorTitle}</Text>

          <Text className="seed-result-title">{isSuccess ? currentQuestion.successLead : currentQuestion.errorLead}</Text>

          <Text className="seed-result-description">{isSuccess ? currentQuestion.successDescription : currentQuestion.errorDescription}</Text>
        </Flex>

        <Button block size="large" shape="round" type="primary" onClick={() => void handlePrimaryAction()} className="seed-btn-primary">
          {isSuccess ? currentQuestion.successButtonText : currentQuestion.errorButtonText}
        </Button>
      </Flex>
    );
  };

  const renderPasswordView = () => (
    <Flex vertical justify="space-between" className="seed-full-height">
      <div>
        <Flex vertical align="flex-start" className="seed-explain-wrap">
          <Text className="seed-explain-text">
            {t('page.secret.recovery.phrase.reveal.explain1')}
            <span className="seed-explain-link" onClick={() => setOpenExplain(true)}>
              {t('page.secret.recovery.phrase.reveal.explain2')}
            </span>
            {t('page.secret.recovery.phrase.reveal.explain3')}
          </Text>
        </Flex>

        <Flex className="warning-box" align="flex-start" gap={8}>
          <AppIcon name="WarningIcon" className="seed-warning-icon" />
          <Text className="seed-warning-text ui-text-sm-primary-body">{t('page.secret.recovery.phrase.reveal.warning')}</Text>
        </Flex>

        <Flex vertical gap={10} className="seed-password-form-wrap">
          <Form form={form} autoComplete="off" onFinish={() => void handlePrimaryAction()}>
            <Form.Item
              name="password"
              label={t('page.secret.recovery.phrase.reveal.password.label')}
              required={false}
              validateTrigger={['onChange', 'submit']}
              rules={[
                {
                  required: true,
                  message: t('validation.wallet.password.required'),
                },
              ]}
              className="seed-password-form-item"
            >
              <Input.Password placeholder={t('page.secret.recovery.phrase.reveal.password.placeholder')} spellCheck={false} onPressEnter={() => form.submit()} className="seed-password-input" />
            </Form.Item>
          </Form>
        </Flex>
      </div>

      <Flex gap={12} className="seed-action-row">
        <Button block size="large" shape="round" color="primary" variant="outlined" onClick={onClose} className="seed-btn-base">
          {t('common.cancel')}
        </Button>
        <Button block size="large" shape="round" type="primary" disabled={!password.trim() || submitting} loading={submitting} onClick={() => form.submit()} className="seed-btn-primary">
          {t('page.secret.recovery.phrase.reveal.submit')}
        </Button>
      </Flex>
    </Flex>
  );

  const items: TabsProps['items'] = [
    {
      key: 'text',
      label: t('common.text'),
      children: (
        <Flex vertical gap={16}>
          <Flex vertical justify="center" className="mnemonic-wrapper" onClick={() => !revealed && setRevealed(true)}>
            <div className="mnemonic-grid">
              {words.map((word, index) => (
                <div key={`${index}-${word}`} className={`word-box ${revealed ? 'revealed' : 'masked'}`}>
                  <span className="mnemonic-index">{index + 1}.</span>
                  <span className="mnemonic-text">{word}</span>
                </div>
              ))}
            </div>

            {!revealed && (
              <Flex vertical align="center" justify="center" className="overlay ui-recovery-overlay">
                <EyeInvisibleOutlined style={{ fontSize: 22 }} />
                <Title level={5} className="seed-overlay-title">
                  {t('page.secret.recovery.phrase.reveal.overlay.title')}
                </Title>
                <Text type="secondary">{t('page.secret.recovery.phrase.reveal.overlay.tip')}</Text>
              </Flex>
            )}
          </Flex>

          <Flex vertical align="center" justify="center">
            <Button color="primary" variant="link" size="large" onClick={() => copyToClipboard(mnemonic)}>
              {t('page.secret.recovery.phrase.reveal.copy')}
            </Button>
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'qr',
      label: t('common.qr'),
      children: (
        <Flex vertical align="center" justify="center" gap={16} className="seed-qr-wrapper">
          <div className="seed-qr-card">
            <QRCodeSVG value={mnemonic || ' '} size={220} bgColor="#FFFFFF" fgColor="#000000" includeMargin />
          </div>
          <Text className="seed-qr-tip ui-text-sm-secondary-body">{t('page.secret.recovery.phrase.reveal.qr.tip')}</Text>
        </Flex>
      ),
    },
  ];

  const renderPhraseView = () => (
    <Flex vertical className="seed-phrase-view">
      <Flex vertical align="flex-start" className="seed-explain-wrap">
        <Text className="seed-explain-text">
          {t('page.secret.recovery.phrase.reveal.explain1')}
          <span className="seed-explain-link" onClick={() => setOpenExplain(true)}>
            {t('page.secret.recovery.phrase.reveal.explain2')}
          </span>
          {t('page.secret.recovery.phrase.reveal.explain3')}
        </Text>
      </Flex>

      <Tabs size="large" activeKey={activeKey} centered items={items} onChange={(key) => setActiveKey(key as PhraseTab)} />
    </Flex>
  );

  return (
    <FullScreen title={stage === 'question' || stage === 'success' || stage === 'error' ? t('page.secret.recovery.phrase.question.title1') : t('page.secret.recovery.phrase.reveal.title')} isOpen={isOpen} onClose={onClose}>
      <div className="seed-page">
        {stage === 'question' && renderQuestionView()}
        {(stage === 'success' || stage === 'error') && renderResultView()}
        {stage === 'password' && renderPasswordView()}
        {stage === 'phrase' && renderPhraseView()}
      </div>
      <SecretRecoveryPhrase open={openExplain} onClose={() => setOpenExplain(false)} />
    </FullScreen>
  );
};

export default Seed;
