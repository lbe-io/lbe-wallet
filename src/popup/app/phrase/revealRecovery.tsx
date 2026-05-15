import React, { useEffect, useRef, useState } from 'react';
import { Button, Flex, Form, Input } from 'antd';
import { blo } from 'blo';
import type { Account, Wallet } from '@/cosmos/storage';
import { useWallet } from '@/app/contexts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/popup/hooks/redux';
import { hideLoad, showLoad } from '@/popup/store/features/applicationSlice';
import FullScreen from '@/components/FullScreen';
import './index.css';

type RevealRecoveryProps = {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
  wallet?: Wallet;
};

const RevealRecovery: React.FC<RevealRecoveryProps> = ({ isOpen, onClose, account, wallet }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const inputEl = useRef<any>(null);
  const password = Form.useWatch('password', form);

  const [loading, setLoading] = useState(false);
  const { selectedAccount, selectedWallet } = useAppSelector((state) => state.application);

  const resolvedAccount = account || selectedAccount;
  const resolvedWallet = wallet || selectedWallet;
  const accountIndex = resolvedAccount?.index ?? 0;

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setLoading(false);
    }
  }, [form, isOpen]);

  const handleSubmit = async ({ password }: { password: string }) => {
    if (loading) return;

    try {
      setLoading(true);
      dispatch(showLoad());
      await walletController.verifyPassword(password.trim());
      form.resetFields();
      onClose();
      navigate('/review-recovery-phrase', {
        state: {
          isFromReminder: true,
          accountIndex,
          walletId: resolvedWallet?.id,
        },
      });
    } catch (error: any) {
      form.setFields([
        {
          name: 'password',
          errors: [error?.message || t('error.api.invalid.password')],
        },
      ]);
    } finally {
      dispatch(hideLoad());
      setLoading(false);
    }
  };

  return (
    <FullScreen isOpen={isOpen} title={t('page.secret.recovery.phrase.reveal.title')} onClose={onClose}>
      <div className="reveal-recovery-container phrase-page-container">
        <Form autoComplete="off" form={form} onFinish={handleSubmit} className="reveal-recovery-form">
          <Flex vertical className="reveal-recovery-layout phrase-size-full" justify="space-between">
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
            >
              <Input.Password placeholder={t('page.secret.recovery.phrase.reveal.password.placeholder')} ref={inputEl} spellCheck={false} onPressEnter={() => form.submit()} />
            </Form.Item>

            <Button block size="large" shape="round" type="primary" disabled={!password || loading} loading={loading} htmlType="submit">
              {t('page.secret.recovery.phrase.reveal.submit')}
            </Button>
          </Flex>
        </Form>
      </div>
    </FullScreen>
  );
};

export default RevealRecovery;
