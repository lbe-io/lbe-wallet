import { useEffect, useRef, useState } from 'react';
import { Input, Form, Button, Flex, Typography, Modal } from 'antd';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useWalletRequest } from '@/app/hooks/walletHooks';
import { useApproval } from '@/app/hooks';
import { useWallet } from '@/app/contexts';
import { AppIcon } from '@/assets/icon';
import UnlockBg from '@/assets/icon/UnlockBg.svg';
import resetIcon from '@/assets/icon/resetIcon.svg';
import { CloseOutlined } from '@ant-design/icons';
import './index.css';

const { Title, Text } = Typography;

const PasswordPage = () => {
  const wallet = useWallet();
  const [, resolveApproval] = useApproval();
  const [form] = Form.useForm();
  const inputEl = useRef<any>(null);
  const isInNotification = window.location.search.includes('create=true');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isUnlockingRef = useRef(false);
  const password = Form.useWatch('password', form);
  const [resetOpen, setResetOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      if (isInNotification) {
        resolveApproval();
      } else {
        navigate('/home/wallet');
      }
    },
    onError(err: any) {
      form.setFields([
        {
          name: 'password',
          errors: [err?.message || t('error.api.invalid.password')],
        },
      ]);
    },
  });

  const handleSubmit = async ({ password }: { password: string }) => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    await run(password);
    isUnlockingRef.current = false;
  };

  return (
    <Flex className="password-page-shell" vertical align="center">
      <img src={UnlockBg} alt="Unlock wallet illustration" className="password-page-hero-image" />

      <Title level={2} className="password-page-title">
        {t('page.unlock.title')}
      </Title>

      <Form autoComplete="off" form={form} onFinish={handleSubmit} className="password-page-form">
        <Flex vertical className="password-page-form-layout" justify="space-between">
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: t('validation.wallet.password.required'),
              },
            ]}
          >
            <Input.Password placeholder={t('page.unlock.password.placeholder')} ref={inputEl} spellCheck={false} />
          </Form.Item>

          <Flex vertical gap={18} justify="center">
            <Button block size="large" shape="round" htmlType="submit" type="primary" disabled={!password}>
              {t('page.unlock.submit')}
            </Button>

            <Button type="link" block onClick={() => setResetOpen(true)}>
              {t('page.unlock.forgot.password')}
            </Button>
          </Flex>
        </Flex>
      </Form>

      <Modal open={resetOpen} width={420} footer={null} centered rootClassName="password-reset-modal" title={t('page.unlock.forgot.password.title')} onCancel={() => setResetOpen(false)}>
        <Flex vertical align="center" gap={36} className="password-modal-content">
          <Flex vertical align="center" gap={16} className="password-modal-copy-block">
            <Text className="password-modal-copy">{t('page.unlock.forgot.password.description1')}</Text>
            <Text className="password-modal-copy">{t('page.unlock.forgot.password.description2')}</Text>
          </Flex>

          <Flex vertical align="center" gap={12} className="password-modal-action-group">
            <Button
              block
              danger
              size="large"
              shape="round"
              type="primary"
              onClick={() => {
                setResetOpen(false);
                navigate('/import-with-recovery-phrase', { state: { fromForgotPassword: true } });
              }}
            >
              {t('page.unlock.forgot.password.import.wallet')}
            </Button>

            <Button
              block
              danger
              size="large"
              shape="round"
              onClick={() => {
                setResetOpen(false);
                setErrorOpen(true);
              }}
            >
              {t('page.unlock.forgot.password.reset.help')}
            </Button>
          </Flex>
        </Flex>
      </Modal>

      <Modal open={errorOpen} width={420} footer={null} centered closable={false} rootClassName="password-error-modal" onCancel={() => setErrorOpen(false)}>
        <Flex vertical align="center" gap={36} className="password-error-modal-content">
          <Flex align="flex-start" justify="space-between" className="password-error-modal-header-row">
            <Button
              type="text"
              size="small" 
              shape="circle"
              icon={<AppIcon name="LeftIcon" />}
              onClick={() => {
                setErrorOpen(false);
                setResetOpen(true);
              }}
            />
            <Flex vertical align="center" gap={16}>
              <img src={resetIcon} alt="Reset help illustration" className="password-error-modal-image" />
              <Title level={4}>{t('page.unlock.reset.help.title')}</Title>
            </Flex>
            <Button
              type="text"
              size="small" 
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => {
                setErrorOpen(false);
              }}
            />
          </Flex>

          <Flex vertical align="center" gap={16} className="password-modal-copy-block">
            <Text className="password-modal-copy">{t('page.unlock.reset.help.description1')}</Text>
            <Text className="password-modal-copy">{t('page.unlock.reset.help.description2')}</Text>
          </Flex>

          <Button
            block
            danger
            size="large"
            shape="round"
            type="primary"
            onClick={() => {
              setErrorOpen(false);
              navigate('/import-with-recovery-phrase', { state: { fromForgotPassword: true } });
            }}
          >
            {t('page.unlock.reset.help.confirm')}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default PasswordPage;
