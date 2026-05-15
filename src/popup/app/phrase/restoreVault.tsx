import React, { useEffect, useRef, useState } from 'react';
import { Flex, Button, Form, Input, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GenerateSteps from '@/components/GenerateSteps';
import SecretRecoveryPhrase from '@/popup/app/modal/SecretRecoveryPhrase';
import { useWallet } from '@/app/contexts';
import { isValidMnemonic } from '@/cosmos/wallet';
import { resetWalletEnvironment } from '@/popup/utils/walletSetup';
import './index.css';

const { Text } = Typography;

const WORD_SIZES = [12, 24];

const normalizeMnemonic = (mnemonic: string) => mnemonic.trim().replace(/\s+/g, ' ');

type FormValues = {
  mnemonic: string;
};

export default function ImportMnemonic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const [form] = Form.useForm<FormValues>();

  const [gridMode, setGridMode] = useState(false);
  const [maskWords, setMaskWords] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [textareaValue, setTextareaValue] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [openExplain, setOpenExplain] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const isFinalSize = (length: number) => WORD_SIZES.includes(length);
  const completedWords = words.filter((word) => word.trim().length > 0);
  const isMnemonicComplete = isFinalSize(completedWords.length) && completedWords.length === words.length;
  const shouldShowWordError = words.length > 0 && isMnemonicComplete && !valid;

  const switchToGrid = (text: string) => {
    const split = text
      .trim()
      .replace(/\u3000/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.toLowerCase());
    const final = isFinalSize(split.length);
    setWords(final ? split : [...split, '']);
    setGridMode(true);
    if (!final) {
      setTimeout(() => {
        inputRefs.current[split.length]?.focus();
      });
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      switchToGrid(textareaValue);
    }
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData.getData('text');
    if (!paste.includes(' ')) return;
    e.preventDefault();
    switchToGrid(paste);
  };

  const updateWord = (index: number, value: string) => {
    setWords((prev) => {
      const next = [...prev];
      next[index] = value.toLowerCase();
      return next;
    });
  };

  const addNext = (index: number) => {
    setWords((prev) => {
      if (prev.length >= 24) return prev;
      if (index !== prev.length - 1) return prev;
      return [...prev, ''];
    });
    setTimeout(() => {
      inputRefs.current[index + 1]?.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const value = words[index] || '';
    if ((e.key === ' ' || e.key === 'Enter') && value.trim()) {
      e.preventDefault();
      addNext(index);
    }
    if (e.key === 'Backspace' && !value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const mnemonic = normalizeMnemonic(words.join(' '));
    form.setFieldValue('mnemonic', mnemonic);
    if (!isFinalSize(words.length)) {
      setValid(false);
      setMaskWords(false);
      return;
    }
    const isReady = isValidMnemonic(mnemonic);
    setValid(isReady);
    setMaskWords(isReady);
  }, [form, words]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      switchToGrid(text);
    } catch {
      message.error(t('error.api.clipboard'));
    }
  };

  const handleClearAll = () => {
    setGridMode(false);
    setTextareaValue('');
    setWords([]);
    setMaskWords(false);
    setValid(false);
    setFocusIndex(null);
  };

  const handleSubmit = async () => {
    const mnemonic = normalizeMnemonic(words.join(' '));
    if (!isValidMnemonic(mnemonic)) {
      message.error(t('validation.wallet.mnemonic.invalid'));
      return;
    }
    try {
      setLoading(true);
      await resetWalletEnvironment(walletController);
      await walletController.setPendingMnemonic(mnemonic);
      navigate('/create-password', { state: { type: 'import' } });
    } catch (error: any) {
      message.error(error?.message || t('page.import.recovery.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenerateSteps
      steps={2}
      curStep={1}
      title={t('page.import.recovery.title')}
      tip={
        <Text>
          {t('page.import.recovery.tip1')}
          <Text strong className="clickable-word" onClick={() => setOpenExplain(true)}>
            {t('page.import.recovery.tip2')}
          </Text>
          {t('page.import.recovery.tip3')}
        </Text>
      }
    >
      <Flex vertical justify="space-between" gap={68} className="phrase-shell phrase-flex-fill">
        <Form form={form} className="phrase-form-card phrase-form-card-grow">
          {!gridMode ? (
            <Input.TextArea
              rows={8}
              variant="borderless"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handleTextareaPaste}
              placeholder={t('page.import.recovery.placeholder')}
              style={{ resize: 'none', backgroundColor: 'transparent', padding: 0 }}
            />
          ) : (
            <Flex className="import-recovery" vertical>
              <div className="phrase-mnemonic-grid">
                {words.map((word, index) => (
                  <div key={index} className={['mnemonic-item', word && shouldShowWordError ? 'error' : '', focusIndex === index ? 'focused' : ''].join(' ')}>
                    <span className="mnemonic-index">{index + 1 + '.'}</span>
                    <Input
                      value={word}
                      className="phrase-input"
                      type={maskWords && focusIndex !== index ? 'password' : 'text'}
                      ref={(element) => {
                        if (element) {
                          inputRefs.current[index] = element.input!;
                        }
                      }}
                      onFocus={() => setFocusIndex(index)}
                      onBlur={() => setFocusIndex(null)}
                      onChange={(e) => updateWord(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      variant="borderless"
                    />
                  </div>
                ))}
              </div>
            </Flex>
          )}

          <Flex align="center" justify="center" gap={12} className="phrase-action-row">
            {words.length === 0 ? (
              <Button block size="large" type="link" className="phrase-link-action" onClick={handlePaste}>
                {t('page.import.recovery.paste')}
              </Button>
            ) : (
              <Button block size="large" type="link" className="phrase-link-action" onClick={handleClearAll}>
                {t('page.import.recovery.clear')}
              </Button>
            )}
          </Flex>
        </Form>

        <Flex vertical gap={18} className="phrase-submit-row">
          {shouldShowWordError && <Text className="phrase-error-text">{t('page.import.recovery.invalid')}</Text>}
          <Button block size="large" shape="round" type="primary" loading={loading} disabled={!valid || loading} onClick={handleSubmit}>
            {t('page.import.recovery.submit')}
          </Button>
        </Flex>
      </Flex>

      <SecretRecoveryPhrase open={openExplain} onClose={() => setOpenExplain(false)} />
    </GenerateSteps>
  );
}
