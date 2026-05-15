import React, { useEffect, useState } from 'react';
import { Flex, Button, ConfigProvider, Form, Input } from 'antd';
import FullScreen from '@/components/FullScreen';
import useChainIdByRpcUrl from '@/popup/hooks/useChainIdByRpcUrl';
import { writeCustomChainRecord } from '@/cosmos/chains/chainRepository';
import type { NetworkEditModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { networkEditModalTheme } from '@/styles/antdThemeTokens';
import './index.css';

const NetworkEdit: React.FC<NetworkEditModalProps> = ({ isOpen, onClose, networkInfo, isAdd }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const url = Form.useWatch('url', form);
  const chainIdForm = Form.useWatch('chainId', form);
  const { chainId, error } = useChainIdByRpcUrl(url);
  const [formError, setFormError] = useState(false);

  useEffect(() => {
    if (!isAdd) {
      form.setFieldsValue(networkInfo);
    }
  }, [networkInfo, isAdd]);

  useEffect(() => {
    const chainIdError = t('page.network.edit.invalid.chain.id');
    if (error && chainIdForm) {
      form.setFields([{ name: 'chainId', errors: [chainIdError] }]);
      setFormError(true);
    } else if (chainIdForm && chainId && chainIdForm !== chainId) {
      form.setFields([{ name: 'chainId', errors: [chainIdError] }]);
      setFormError(true);
    } else {
      form.setFields([{ name: 'chainId', errors: [] }]);
      setFormError(false);
    }
  }, [error, chainIdForm, chainId, form, t]);

  const handleValidator = (_rule: any, value: string) => {
    const chainIdError = t('page.network.edit.invalid.chain.id');
    if (value && chainId && value !== chainId) {
      setFormError(true);
      return Promise.reject(chainIdError);
    }
    return Promise.resolve();
  };

  const onSubmit = () => {
    if (formError) {
      form.setFields([{ name: 'chainId', errors: [t('page.network.edit.invalid.chain.id')] }]);
      return;
    }
    const values = form.getFieldsValue();
    const chain = {
      chainId: values.chainId,
      custom: '1',
      decimals: '',
      dr: '0',
      explore: '',
      icon: '',
      muticall: '',
      name: values.name,
      nft: '',
      rpc: values.url,
      sorts: '',
      symbol: values.symbol,
      token: '',
      type: '',
    };
    writeCustomChainRecord(chain).then(() => {
      onClose(true);
    });
  };

  return (
    <FullScreen title={isAdd ? t('page.network.edit.add.title') : networkInfo?.name} isOpen={isOpen} onClose={() => onClose()}>
      <Flex vertical justify="space-between" className="network-edit-body">
        <ConfigProvider theme={networkEditModalTheme}>
          <Form form={form} onFinish={onSubmit} layout="vertical" disabled={!isAdd} requiredMark={false}>
            <Form.Item label={t('page.network.edit.network.label')} name="name" className="network-edit-form-item" rules={[{ required: true, message: t('page.network.edit.required.network') }]}>
              <Input placeholder={t('page.network.edit.network.placeholder')} />
            </Form.Item>
            <Form.Item label={t('page.network.edit.rpc.label')} name="url" className="network-edit-form-item" rules={[{ required: true, message: t('page.network.edit.required.rpc') }]}>
              <Input placeholder={t('page.network.edit.rpc.placeholder')} />
            </Form.Item>
            <Form.Item label={t('page.network.edit.chain.id.label')} name="chainId" className="network-edit-form-item" rules={[{ required: true, message: t('page.network.edit.required.chain.id') }, { validator: handleValidator }]}>
              <Input placeholder={t('page.network.edit.chain.id.placeholder')} />
            </Form.Item>
            <Form.Item label={t('page.network.edit.symbol.label')} name="symbol" className="network-edit-form-item" rules={[{ required: true, message: t('page.network.edit.required.symbol') }]}>
              <Input placeholder={t('page.network.edit.symbol.placeholder')} />
            </Form.Item>
            <Form.Item label={t('page.network.edit.explorer.label')} name="blockExplorer" className="network-edit-form-item">
              <Input placeholder={t('page.network.edit.explorer.placeholder')} />
            </Form.Item>
            {isAdd && (
              <Form.Item className="network-edit-submit-item">
                <Button block type="primary" size="large" shape="round" htmlType="submit">
                  {t('page.network.edit.submit')}
                </Button>
              </Form.Item>
            )}
          </Form>
        </ConfigProvider>
      </Flex>
    </FullScreen>
  );
};

export default NetworkEdit;
