import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flex, Button, Form, Input, message, Typography, Modal } from 'antd';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/popup/hooks/useTranslation';
import FullScreen from '@/components/FullScreen';
import SecretRecoveryPhrase from '@/popup/app/modal/SecretRecoveryPhrase';
import { useWallet } from '@/app/contexts';
import { AppIcon } from '@/assets/icon';
import { isValidMnemonic } from '@/cosmos/wallet';
import { getAllAccounts } from '@/cosmos/storage';
import { useAppDispatch } from '@/popup/hooks/redux';
import { applyWalletBootstrap, finalizeWalletSetup, resetWalletEnvironment } from '@/popup/utils/walletSetup';
import './index.css';

const { Text, Title } = Typography;

const WORD_SIZES = [12, 24];
const BIP39_WORD_SET = new Set(wordlist);

const normalizeMnemonic = (mnemonic: string) => mnemonic.trim().replace(/\s+/g, ' ');

type FormValues = {
  mnemonic: string;
};

type InputKeyEvent = React.KeyboardEvent<HTMLInputElement>;
type TextareaKeyDown = React.KeyboardEvent<HTMLTextAreaElement>;

export default function ImportWithSrp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<FormValues>();

  const [gridMode, setGridMode] = useState(false);
  const [maskWords, setMaskWords] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [textareaValue, setTextareaValue] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [validatedWordIndices, setValidatedWordIndices] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [openExplain, setOpenExplain] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const isFinalSize = (length: number) => WORD_SIZES.includes(length);
  const completedWords = useMemo(() => words.filter((word) => word.trim().length > 0), [words]);
  const hasPendingWord = completedWords.length !== words.length;
  const isMnemonicComplete = isFinalSize(completedWords.length) && !hasPendingWord;
  const shouldShowWordError = completedWords.length > 0 && isMnemonicComplete && !valid;
  const invalidWordIndices = useMemo(() => {
    if (validatedWordIndices.size === 0) {
      return new Set<number>();
    }

    const invalid = new Set<number>();
    validatedWordIndices.forEach((index) => {
      const word = words[index];
      if (!word) {
        return;
      }
      const trimmed = word.trim().toLowerCase();
      if (!trimmed) {
        return;
      }
      if (!BIP39_WORD_SET.has(trimmed)) {
        invalid.add(index);
      }
    });
    return invalid;
  }, [validatedWordIndices, words]);

  const switchToGrid = (text: string) => {
    const split = text
      .trim()
      .replace(/\u3000/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.toLowerCase());

    const final = isFinalSize(split.length);
    setWords(final ? split : [...split, '']);
    setValidatedWordIndices(new Set(split.map((_, idx) => idx)));
    setGridMode(true);

    if (!final) {
      setTimeout(() => {
        inputRefs.current[split.length]?.focus();
      });
    }
  };

  const handleTextareaKeyDown = (e: TextareaKeyDown) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      switchToGrid(textareaValue);
    }
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData.getData('text');
    if (!paste.includes(' ')) {
      return;
    }

    e.preventDefault();
    switchToGrid(paste);
  };

  const updateWord = (index: number, value: string) => {
    setWords((previous) => {
      const next = [...previous];
      next[index] = value.toLowerCase();
      return next;
    });
  };

  const shiftValidatedIndices = (removedIndex: number) => {
    setValidatedWordIndices((previous) => {
      if (previous.size === 0) {
        return previous;
      }

      const next = new Set<number>();
      previous.forEach((value) => {
        if (value === removedIndex) {
          return;
        }

        if (value > removedIndex) {
          next.add(value - 1);
        } else {
          next.add(value);
        }
      });

      return next;
    });
  };

  const removeWord = (index: number) => {
    setWords((previous) => {
      const next = [...previous];
      next.splice(index, 1);
      const isEmpty = next.length === 0;

      if (isEmpty) {
        setGridMode(false);
        setMaskWords(false);
        setValid(false);
        setFocusIndex(null);
        setTextareaValue('');
        setValidatedWordIndices(new Set());
        return [];
      }

      shiftValidatedIndices(index);
      return next;
    });
  };

  const markWordValidated = (index: number) => {
    setValidatedWordIndices((previous) => {
      if (previous.has(index)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(index);
      return next;
    });
  };

  const addNext = (index: number) => {
    setWords((previous) => {
      if (previous.length >= 24) {
        return previous;
      }
      if (index !== previous.length - 1) {
        return previous;
      }
      return [...previous, ''];
    });

    setTimeout(() => {
      inputRefs.current[index + 1]?.focus();
    });
  };

  const handleKeyDown = (e: InputKeyEvent, index: number) => {
    const value = words[index] || '';

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!value.trim()) {
        return;
      }
      markWordValidated(index);
      addNext(index);
    }

    if (e.key === 'Backspace' && !value) {
      e.preventDefault();
      const nextIndex = Math.max(0, index - 1);
      removeWord(index);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      });
    }
  };

  useEffect(() => {
    const mnemonic = normalizeMnemonic(completedWords.join(' '));
    form.setFieldValue('mnemonic', mnemonic);

    if (!isMnemonicComplete) {
      setValid(false);
      setMaskWords(false);
      return;
    }

    const isReady = isValidMnemonic(mnemonic);
    setValid(isReady);
    setMaskWords(isReady);
  }, [completedWords, form, isMnemonicComplete]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        return;
      }
      switchToGrid(text);
    } catch {
      message.error(t('error.api.clipboard'));
    }
  };

  const handleClearAll = () => {
    setGridMode(false);
    setTextareaValue('');
    setWords([]);
    setValidatedWordIndices(new Set());
    setMaskWords(false);
    setValid(false);
    setFocusIndex(null);
  };

  const handleSubmit = async () => {
    const mnemonic = normalizeMnemonic(completedWords.join(' '));
    if (!isValidMnemonic(mnemonic)) {
      message.error(t('validation.wallet.mnemonic.invalid'));
      return;
    }

    try {
      setLoading(true);
      const isBooted = await walletController.isBooted();

      if (!isBooted) {
        await resetWalletEnvironment(walletController);
        await walletController.setPendingMnemonic(mnemonic);
        navigate('/create-password', { state: { type: 'import' } });
        return;
      }

      const currentMnemonic = await walletController
        .getMnemonic()
        .then((value) => normalizeMnemonic(value || ''))
        .catch(() => '');
      if (!currentMnemonic) {
        throw new Error(t('page.import.recovery.load.seed.fail'));
      }
      if (currentMnemonic === mnemonic) {
        throw new Error(t('page.import.recovery.duplicate'));
      }

      const accounts = await getAllAccounts();

      const nextAccountIndex = accounts.reduce((max, account) => Math.max(max, Number(account.index) || 0), -1) + 1;
      await walletController.setAccountMnemonic(nextAccountIndex, mnemonic);
      const walletState = await finalizeWalletSetup(walletController, nextAccountIndex, { mnemonicBackupPending: false });
      await walletController.setMnemonicBackupPending(false, walletState.wallet.id);
      applyWalletBootstrap(dispatch, walletState);
      message.success(t('page.import.recovery.success'));
      navigate(-1);
    } catch (error: any) {
      message.error(error?.message || t('page.import.recovery.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullScreen title={t('page.import.recovery.title')} isOpen={true} onClose={() => navigate(-1)}>
      <Flex vertical align="center" className="phrase-fullscreen-container phrase-page-container">
        <Title level={2}>{t('page.import.recovery.title')}</Title>
        <Flex className="phrase-tip-row phrase-full-width" justify="center" gap={8}>
          <Text className="phrase-tip-text ui-text-md-secondary">{t('page.import.recovery.tip')}</Text>
          <AppIcon name="TitleTooltipIcon" onClick={() => setOpenExplain(true)} />
        </Flex>

        <Flex vertical justify="space-between" gap={35} className="phrase-body-layout phrase-flex-fill">
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
              <Flex vertical className="import-recovery">
                <div className="phrase-mnemonic-grid">
                  {words.map((word, index) => {
                    const showGlobalError = word.trim() && shouldShowWordError;
                    const hasWordError = invalidWordIndices.has(index) || Boolean(showGlobalError);
                    return (
                      <div key={index} className={`mnemonic-item ${hasWordError ? 'error' : ''} ${focusIndex === index ? 'focused' : ''}`}>
                        <span className="mnemonic-index">{index + 1 + '.'}</span>
                        <Input
                          value={maskWords ? word : word}
                          className="phrase-input"
                          type={maskWords ? (focusIndex === index ? 'text' : 'password') : 'text'}
                          ref={(element) => {
                            if (element) {
                              inputRefs.current[index] = element.input!;
                            }
                          }}
                          onFocus={() => setFocusIndex(index)}
                          onBlur={() => {
                            setFocusIndex(null);
                            if (word.trim()) {
                              markWordValidated(index);
                            }
                          }}
                          onChange={(e) => updateWord(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          variant="borderless"
                        />
                      </div>
                    );
                  })}
                </div>
              </Flex>
            )}

            <Flex align="center" justify="center" gap={12} className="phrase-action-row">
              {completedWords.length === 0 ? (
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
            {isMnemonicComplete && !valid && <Text className="phrase-error-text">{t('page.import.recovery.invalid')}</Text>}
            <Button block size="large" shape="round" type="primary" loading={loading} disabled={!valid || loading} onClick={handleSubmit}>
              {t('page.import.recovery.submit')}
            </Button>
          </Flex>
        </Flex>

        <SecretRecoveryPhrase open={openExplain} onClose={() => setOpenExplain(false)} />
      </Flex>
    </FullScreen>
  );
}
