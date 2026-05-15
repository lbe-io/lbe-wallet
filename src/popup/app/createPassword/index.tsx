import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Form, Button, Flex, Checkbox } from 'antd';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { useWallet } from '@/app/contexts';
import { useAppDispatch } from '@/popup/hooks/redux';
import { generateRandomMnemonic } from '@/cosmos/wallet';
import GenerateSteps from '@/components/GenerateSteps';
import { openWalletHome } from '@/popup/utils/openWalletHome';
import { applyWalletBootstrap, finalizeWalletSetup } from '@/popup/utils/walletSetup';
import './index.css';

const MINIMUM_PASSWORD_LENGTH = 8;

const getPasswordChecks = (password = '') => {
  const normalized = password.normalize('NFKC');
  return {
    normalized,
    lengthOk: normalized.length >= MINIMUM_PASSWORD_LENGTH,
    hasLetter: /[A-Za-z]/.test(normalized),
    hasNumber: /[0-9]/.test(normalized),
  };
};

const getPasswordErrorMessages = (password = '', t: ReturnType<typeof useTranslation>['t']) => {
  const checks = getPasswordChecks(password);
  const errors: string[] = [];
  if (!checks.lengthOk) errors.push(t('validation.wallet.password.too.short'));
  if (!checks.hasLetter) errors.push(t('validation.wallet.password.no.letter'));
  if (!checks.hasNumber) errors.push(t('validation.wallet.password.no.number'));
  return errors;
};

const CreatePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const type = location.state?.type || 'create';
  const fromForgotPassword = !!location.state?.fromForgotPassword;

  const [loading, setLoading] = useState(false);

  const init = async () => {
    if (await wallet.isBooted()) {
      if (await wallet.isUnlocked()) {
        await openWalletHome(navigate);
      } else {
        navigate('/password');
      }
    }
  };

  const [agreeTerm, toggleAgreeTerm] = useState(false);
  const passwordValue = Form.useWatch('password', form) || '';
  const confirmPasswordValue = Form.useWatch('confirmPassword', form) || '';
  const passwordChecks = useMemo(() => getPasswordChecks(passwordValue), [passwordValue]);
  const passwordErrors = useMemo(() => getPasswordErrorMessages(passwordValue, t), [passwordValue, t]);
  const normalizedPassword = useMemo(() => passwordValue.normalize('NFKC'), [passwordValue]);
  const normalizedConfirmPassword = useMemo(() => confirmPasswordValue.normalize('NFKC'), [confirmPasswordValue]);
  const passwordScore = useMemo(() => [passwordChecks.lengthOk, passwordChecks.hasLetter, passwordChecks.hasNumber].filter(Boolean).length, [passwordChecks]);

  const passwordStrengthLabel = useMemo(() => {
    if (!passwordValue) return '';
    if (passwordScore <= 1) return t('page.password.strength.weak');
    if (passwordScore === 2) return t('page.password.strength.medium');
    return t('page.password.strength.strong');
  }, [passwordScore, passwordValue, t]);

  const strengthTone = useMemo(() => {
    if (!passwordValue) return 'neutral';
    if (passwordScore <= 1) return 'weak';
    if (passwordScore === 2) return 'medium';
    return 'strong';
  }, [passwordScore, passwordValue]);

  const disable = useMemo(() => {
    if (!agreeTerm) return true;
    if (!passwordValue || !confirmPasswordValue) return true;
    if (passwordErrors.length > 0) return true;
    if (normalizedPassword !== normalizedConfirmPassword) return true;
    return false;
  }, [agreeTerm, passwordErrors.length, passwordValue, confirmPasswordValue, normalizedPassword, normalizedConfirmPassword]);

  useEffect(() => {
    void init();
  }, []);

  return (
    <GenerateSteps steps={type === 'import' ? 2 : 3} curStep={type === 'create' ? 1 : 2} title={t('page.password.title')} tip={t('page.password.tip')}>
      <Form
        className="create-password-form"
        onFinish={async ({ password }) => {
          try {
            setLoading(true);
            const normalized = password.trim();
            if (type === 'create') {
              const existingMnemonic = await wallet.getPendingMnemonic();
              if (!existingMnemonic) {
                await wallet.setPendingMnemonic(generateRandomMnemonic(12));
              }
            }
            await wallet.boot(normalized);
            if (type === 'import') {
              const walletState = await finalizeWalletSetup(wallet, 0, { mnemonicBackupPending: false });
              await wallet.setMnemonicBackupPending(false, walletState.wallet.id);
              applyWalletBootstrap(dispatch, walletState);
              if (fromForgotPassword) {
                await openWalletHome(navigate);
              } else {
                navigate('/onboarding-complete');
              }
            } else {
              navigate('/review-recovery-phrase');
            }
          } catch (err: any) {
            form.setFields([
              {
                name: 'password',
                errors: [err?.message || t('error.api.invalid.password')],
              },
            ]);
          } finally {
            setLoading(false);
          }
        }}
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Flex vertical className="create-password-form-layout" justify="space-between">
          <Flex vertical>
            <Form.Item
              name="password"
              label={t('page.password.create.label')}
              validateTrigger={['onChange', 'submit']}
              rules={[
                {
                  required: true,
                  message: t('validation.wallet.password.required'),
                },
                () => ({
                  validator(_, value: string) {
                    if (!value) return Promise.resolve();
                    const errors = getPasswordErrorMessages(value, t);
                    if (errors.length === 0) return Promise.resolve();
                    return Promise.reject(new Error(errors[0]));
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('page.password.placeholder')} type="password" autoFocus spellCheck={false} />
            </Form.Item>

            {passwordValue && (
              <Flex vertical gap={8} className="create-password-strength-wrap">
                <Flex align="center" gap={8}>
                  <div className="create-password-strength-label">{t('page.password.strength.label')}</div>
                  <Flex gap={6} className="create-password-strength-bars">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className={`create-password-strength-bar ${passwordScore >= idx ? `is-active tone-${strengthTone}` : ''}`} />
                    ))}
                  </Flex>
                  <div className={`create-password-strength-value tone-${strengthTone}`}>{passwordStrengthLabel}</div>
                </Flex>
              </Flex>
            )}

            <Form.Item
              name="confirmPassword"
              label={t('page.password.confirm.label')}
              validateTrigger={['onChange', 'onsubmit']}
              rules={[
                {
                  required: true,
                  message: t('validation.wallet.password.required'),
                },
                ({ getFieldValue }) => ({
                  validator(_, value: string) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('validation.wallet.password.mismatch')));
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('page.password.placeholder')} type="password" spellCheck={false} />
            </Form.Item>
          </Flex>

          <Flex vertical gap={14}>
            <Checkbox checked={agreeTerm} onChange={(e) => toggleAgreeTerm(e.target.checked)}>
              {t('page.password.reminder')}
            </Checkbox>
            <Button block size="large" shape="round" type="primary" htmlType="submit" disabled={disable || loading} loading={loading}>
              {t('page.password.submit')}
            </Button>
          </Flex>
        </Flex>
      </Form>
    </GenerateSteps>
  );
};

export default CreatePassword;
