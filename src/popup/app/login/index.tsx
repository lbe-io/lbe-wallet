import { useMemo, useState } from 'react';
import { Button, Flex, Form, Input, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/popup/hooks/useTranslation';
import GenerateSteps from '@/components/GenerateSteps';
import { useWallet } from '@/app/contexts';
import { isValidMnemonic } from '@/cosmos/wallet';
import { resetWalletEnvironment } from '@/popup/utils/walletSetup';
import './index.css';

type FormValues = {
  mnemonic: string;
};

const normalizeMnemonic = (mnemonic: string) => mnemonic.trim().replace(/\s+/g, ' ');

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const mnemonicValue = Form.useWatch('mnemonic', form) || '';
  const normalizedMnemonic = useMemo(() => normalizeMnemonic(mnemonicValue), [mnemonicValue]);
  const isMnemonicReady = useMemo(() => isValidMnemonic(normalizedMnemonic), [normalizedMnemonic]);

  const handleImport = async (values: FormValues) => {
    const mnemonic = normalizeMnemonic(values.mnemonic || '');
    if (!isValidMnemonic(mnemonic)) {
      message.error(t('validation.wallet.mnemonic.invalid'));
      return;
    }

    try {
      setLoading(true);
      await resetWalletEnvironment(walletController);
      await walletController.setPendingMnemonic(mnemonic);

      message.success(t('page.login.mnemonic.success'));
      navigate('/create-password', { state: { type: 'import' } });
    } catch (error: any) {
      message.error(error?.message || t('page.login.mnemonic.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenerateSteps steps={2} curStep={1} title={t('page.login.title')} tip={t('page.login.tip')}>
      <Flex className="login-page-form-shell" vertical gap={16}>
        <Form<FormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleImport}>
          <Form.Item<FormValues> name="mnemonic" rules={[{ required: true, message: t('validation.wallet.mnemonic.required') }]} className="login-page-form-item">
            <Input.TextArea rows={8} disabled={loading} placeholder={t('page.login.mnemonic.placeholder')} className="login-page-mnemonic-textarea" spellCheck={false} />
          </Form.Item>

          <Typography.Text type={isMnemonicReady ? 'success' : 'secondary'}>{isMnemonicReady ? t('page.login.mnemonic.valid') : t('page.login.mnemonic.invalid')}</Typography.Text>

          <Button block size="large" shape="round" type="primary" htmlType="submit" loading={loading} disabled={!isMnemonicReady || loading} className="login-page-submit-btn">
            {t('page.login.submit')}
          </Button>
        </Form>
      </Flex>
    </GenerateSteps>
  );
}
