import React, { useMemo, useRef, useState } from 'react';
import { Flex, Button, Form, Input, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/popup/hooks/useTranslation';
import FullScreen from '@/components/FullScreen';
import { useWallet } from '@/app/contexts';
import { useAppDispatch } from '@/popup/hooks/redux';
import { createImportedPrivateKeyAccountSource } from '@/cosmos/storage/accountIdentity';
import { getAllAccounts } from '@/cosmos/storage';
import { applyWalletBootstrap, finalizeWalletSetup } from '@/popup/utils/walletSetup';
import './index.css';

const { Text, Title } = Typography;

const PRIVATE_KEY_PATTERN = /^[0-9a-f]{64}$/i;
const normalizePrivateKeyInput = (value: string) => (value || '').trim().replace(/\s+/g, '').replace(/^0x/i, '');

export default function ImportWithAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const inputEl = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const privateKey = Form.useWatch('privateKey', form);
  const normalizedPrivateKey = useMemo(() => normalizePrivateKeyInput(privateKey || ''), [privateKey]);
  const isPrivateKeyValid = PRIVATE_KEY_PATTERN.test(normalizedPrivateKey);

  const handleSubmit = async ({ privateKey }: { privateKey: string }) => {
    const normalizedKey = normalizePrivateKeyInput(privateKey);
    if (!PRIVATE_KEY_PATTERN.test(normalizedKey)) {
      message.error(t('validation.wallet.private.key.invalid'));
      return;
    }

    try {
      setLoading(true);
      const isBooted = await walletController.isBooted();
      if (!isBooted) {
        throw new Error(t('page.import.account.need.wallet'));
      }

      const accounts = await getAllAccounts();
      const nextAccountIndex = accounts.reduce((max, account) => Math.max(max, Number(account.index) || 0), -1) + 1;
      const importedAccountSource = createImportedPrivateKeyAccountSource(nextAccountIndex);

      await walletController.setAccountPrivateKey(importedAccountSource.accountIndex, normalizedKey);
      const walletState = await finalizeWalletSetup(walletController, importedAccountSource.accountIndex);
      applyWalletBootstrap(dispatch, walletState);
      message.success(t('page.import.account.success'));
      form.resetFields();
      navigate(-1);
    } catch (error: any) {
      console.error('[import-account] Failed to import private key', error);
      message.error(error?.message || t('page.import.account.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullScreen title={t('page.import.account.title')} isOpen={true} onClose={() => navigate(-1)}>
      <Flex vertical className="import-account-container phrase-page-container">
        <Title level={4}>{t('page.import.account.label')}</Title>

        <Flex vertical className="import-account-description phrase-full-width" justify="center">
          <Text className="import-account-text phrase-body-text ui-text-md-primary">
            {t('page.import.account.description1')}
            <a href="" target="_blank" rel="noopener noreferrer" className="import-account-link phrase-body-text ui-text-md-primary">
              {t('page.import.account.description2')}
            </a>
            {t('page.import.account.description3')}
          </Text>
        </Flex>

        <Form autoComplete="off" title={t('page.import.account.label')} form={form} onFinish={handleSubmit} className="import-account-form">
          <Flex vertical className="import-account-form-layout phrase-size-full" justify="space-between">
            <Flex vertical gap={10} className="import-account-field phrase-full-width">
              <Text className="import-account-field-label phrase-body-text ui-text-md-primary">{t('page.import.account.input.label')}</Text>
              <Form.Item
                name="privateKey"
                rules={[
                  {
                    required: true,
                    message: t('validation.wallet.private.key.required'),
                  },
                  {
                    validator: (_rule, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const normalized = normalizePrivateKeyInput(value);
                      if (!PRIVATE_KEY_PATTERN.test(normalized)) {
                        return Promise.reject(new Error(t('validation.wallet.private.key.invalid')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password placeholder={t('page.import.account.placeholder')} type="password" ref={inputEl} spellCheck={false} />
              </Form.Item>
            </Flex>

            <Flex gap={16}>
              <Button block shape="round" size="large" color="default" variant="filled" onClick={() => navigate(-1)}>
                {t('page.import.account.cancel')}
              </Button>
              <Button block type="primary" size="large" shape="round" htmlType="submit" loading={loading} disabled={!isPrivateKeyValid || loading}>
                {t('page.import.account.submit')}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </Flex>
    </FullScreen>
  );
}
