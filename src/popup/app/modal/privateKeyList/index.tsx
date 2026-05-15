import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Flex, Form, Input, Typography } from 'antd';
import { blo } from 'blo';
import type { AccountPrivateKeyItem } from '@/app/contexts';
import { useWallet } from '@/app/contexts';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { useAppDispatch } from '@/popup/hooks/redux';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { hideLoad, showLoad } from '@/popup/store/features/applicationSlice';
import FullScreen from '@/components/FullScreen';
import { AppIcon } from '@/assets/icon';
import Item from '@/components/Item';
import type { PrivateKeyListModalProps } from '@/popup/types/popupUi';
import './index.css';

const { Text } = Typography;

type Stage = 'password' | 'list';

const PrivateKeyList: React.FC<PrivateKeyListModalProps> = ({ isOpen, onClose, account, wallet }) => {
  const { t } = useTranslation();
  const walletController = useWallet();
  const dispatch = useAppDispatch();
  const [, copyToClipboard] = useCopyClipboard();
  const [form] = Form.useForm();
  const inputEl = useRef<any>(null);
  const password = Form.useWatch('password', form);
  const [stage, setStage] = useState<Stage>('password');
  const [loading, setLoading] = useState(false);
  const [privateKeys, setPrivateKeys] = useState<AccountPrivateKeyItem[]>([]);
  const { selectedAccount, selectedWallet } = useWalletEntitySelector();

  const resolvedAccount = account || selectedAccount;
  const resolvedWallet = wallet || selectedWallet;
  const accountIndex = resolvedAccount?.index ?? 0;

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setStage('password');
      setLoading(false);
      setPrivateKeys([]);
      return;
    }

    if (stage === 'password' && inputEl.current) {
      setTimeout(() => {
        inputEl.current?.focus?.();
      }, 0);
    }
  }, [form, isOpen, stage]);

  const handleSubmit = async ({ password }: { password: string }) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      dispatch(showLoad());
      const result = await walletController.exportAccountPrivateKeys(password.trim(), accountIndex);
      setPrivateKeys(result);
      form.resetFields();
      setStage('list');
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
    <FullScreen isOpen={isOpen} title={stage === 'password' ? t('page.private.key.list.title') : `${resolvedAccount?.name || '--'} / ${t('page.private.key.list.title.suffix')}`} onClose={onClose}>
      <div className="private-key-list-body">
        <Flex className="private-key-list-warning" align="flex-start" gap={8}>
          <AppIcon name="WarningIcon" className="private-key-list-warning-icon" />
          <Text className="private-key-list-warning-text">{t('page.private.key.list.warning')}</Text>
        </Flex>

        {stage === 'password' ? (
          <Flex vertical className="private-key-list-password-stage" gap={8} align="center" justify="center">
            <Avatar src={resolvedWallet?.photo || blo(`0x${resolvedWallet?.id || resolvedAccount?.id || 'account'}`)} size={48} />

            <Text>{resolvedAccount?.name || '--'}</Text>

            <Form autoComplete="off" form={form} onFinish={handleSubmit} className="private-key-list-password-form">
              <Flex vertical className="private-key-list-password-layout" justify="space-between">
                <Form.Item
                  name="password"
                  label={t('page.private.key.list.password.label')}
                  required={false}
                  validateTrigger={['onChange', 'submit']}
                  rules={[
                    {
                      required: true,
                      message: t('validation.wallet.password.required'),
                    },
                  ]}
                >
                  <Input.Password placeholder={t('page.private.key.list.password.placeholder')} ref={inputEl} spellCheck={false} onPressEnter={() => form.submit()} />
                </Form.Item>

                <Flex gap={12} className="private-key-list-password-actions">
                  <Button block size="large" shape="round" color="primary" variant="outlined" onClick={onClose} className="private-key-list-btn">
                    {t('common.cancel')}
                  </Button>

                  <Button block size="large" shape="round" type="primary" disabled={!password || loading} loading={loading} htmlType="submit" className="private-key-list-btn private-key-list-confirm-btn">
                    {t('common.confirm')}
                  </Button>
                </Flex>
              </Flex>
            </Form>
          </Flex>
        ) : (
          <Flex vertical className="private-key-list-result-stage">
            {privateKeys.map((item) => (
              <Item
                key={item.chainId}
                type="address"
                isMultiToken={false}
                name={item.chainName}
                describe={item.privateKey}
                rightBtn={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.privateKey);
                }}
              />
            ))}
          </Flex>
        )}
      </div>
    </FullScreen>
  );
};

export default PrivateKeyList;
