import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Flex, Select, Avatar, Typography, InputNumber, message } from 'antd';
import FullScreen from '@/components/FullScreen';
import { ConfigProvider } from 'antd';
import { AppIcon } from '@/assets/icon';
import { getAllChains, ChainToken, updateChainToken } from '@/cosmos/storage';
import type { CustomCryptoModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { customCryptoModalTheme } from '@/styles/antdThemeTokens';
import './index.css';

const { Text } = Typography;

const CustomCrypto: React.FC<CustomCryptoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [allNetwork, setAllNetwork] = useState<any[]>([]);

  const fetchAllData = async () => {
    const chains = await getAllChains();
    const options = chains
      .filter((o) => !!o.chainId)
      .map((item) => ({
        value: item.chainId,
        label: (
          <Flex align="center">
            <Avatar src={item.icon || ''} size={24} className="custom-crypto-network-avatar">
              {item.name?.charAt(0)}
            </Avatar>
            <Flex className="custom-crypto-network-meta" vertical>
              <Text className="custom-crypto-network-name">{item.name}</Text>
            </Flex>
          </Flex>
        ),
      }));
    setAllNetwork(options);

    if (options[0]?.value) {
      form.setFieldValue('network', options[0].value);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onSubmit = async () => {
    const data = await form.validateFields();
    const chainId = data.network;
    const contractAddress = String(data.contractAddress || '').trim();
    const symbol = String(data.symbol || '').trim();
    const tokenName = String(data.name || '').trim();
    const decimals = String(data.decimals);

    const token: ChainToken[] = [
      {
        chainId,
        type: 'cw20',
        assetType: 'token',
        address: contractAddress,
        name: tokenName,
        symbol,
        addressLow: contractAddress.toLowerCase(),
        decimals,
        dr: '0',
        sorts: '0',
        selected: '1',
        logoURI: '',
        groupValue: '',
        tags: '',
        custom: '1',
      },
    ];

    updateChainToken(chainId, contractAddress, '1', token)
      .then(() => {
        message.success(t('page.custom.token.success'));
        onClose(true);
      })
      .catch((error: any) => {
        message.error(error?.message || t('page.custom.token.fail'));
      });
  };

  return (
    <FullScreen title={t('page.custom.token.title')} isOpen={isOpen} onClose={onClose}>
      <div className="custom-crypto-body">
        <ConfigProvider theme={customCryptoModalTheme}>
          <Form form={form} onFinish={onSubmit} layout="vertical" className="custom-crypto-form">
            <Flex vertical>
              <Form.Item label={t('page.custom.token.network.label')} name="network" className="custom-crypto-form-item" rules={[{ required: true, message: t('validation.network.required') }]}>
                <Select suffixIcon={<AppIcon name="RightIcon" />} className="custom-crypto-select" options={allNetwork} />
              </Form.Item>

              <Form.Item label={t('page.custom.token.address.label')} name="contractAddress" className="custom-crypto-form-item" rules={[{ required: true, message: t('validation.token.address.required') }]}>
                <Input placeholder={t('page.custom.token.address.placeholder')} />
              </Form.Item>

              <Form.Item label={t('page.custom.token.name.label')} name="name" className="custom-crypto-form-item" rules={[{ required: true, message: t('validation.token.name.required') }]}>
                <Input placeholder={t('page.custom.token.name.placeholder')} />
              </Form.Item>

              <Form.Item label={t('page.custom.token.symbol.label')} name="symbol" className="custom-crypto-form-item" rules={[{ required: true, message: t('validation.token.symbol.required') }]}>
                <Input placeholder={t('page.custom.token.symbol.placeholder')} />
              </Form.Item>

              <Form.Item label={t('page.custom.token.decimals.label')} name="decimals" className="custom-crypto-form-item" rules={[{ required: true, message: t('validation.token.decimals.required') }]}>
                <InputNumber min={0} max={18} precision={0} className="custom-crypto-decimals-input" placeholder={t('page.custom.token.decimals.placeholder')} />
              </Form.Item>
            </Flex>

            <Form.Item className="custom-crypto-submit-item">
              <Button className="custom-crypto-submit-btn" htmlType="submit" type="primary">
                {t('common.confirm')}
              </Button>
            </Form.Item>
          </Form>
        </ConfigProvider>
      </div>
    </FullScreen>
  );
};

export default CustomCrypto;
