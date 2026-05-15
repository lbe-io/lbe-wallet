import React, { useEffect, useState, useRef } from 'react';
import { Typography, Flex, Button, Input, Form } from 'antd';
import { AppIcon } from '@/assets/icon';
import FullScreen from '@/components/FullScreen';
import type { GasOption } from '@/components/gasInfo';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

type NetworkFeeProps = {
  isOpen: boolean;
  fadeInClass: string;
  networkFees: GasOption[];
  selectFee: GasOption;
  onClose: () => void;
  changeNetworkFee: (networkFee: GasOption) => void;
};

const NetworkFee: React.FC<NetworkFeeProps> = ({ isOpen, onClose, selectFee, changeNetworkFee, networkFees, fadeInClass }) => {
  const { t } = useTranslation();
  const customFeeTemplate: GasOption = {
    speed: t('common.custom'),
    time: '< 30 sec',
    gasPrice: selectFee?.gasPrice || networkFees[1]?.gasPrice || 0.01,
    gasLimit: selectFee?.gasLimit || networkFees[1]?.gasLimit || 150000,
    gwei: t('page.network.fee.custom.gas.settings'),
    usd: t('page.network.fee.custom.gas.settings'),
    icon: <AppIcon name="CustomIcon" />,
  };
  const [fadeClass, setFadeClass] = useState('');
  const [selectCostomFees, setSelectCostomFees] = useState(selectFee.speed);
  const [costomFees] = useState<GasOption[]>([customFeeTemplate]);
  const init = useRef(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (init.current) {
      setFadeClass(fadeInClass);
    } else {
      init.current = true;
    }
  }, [fadeInClass]);

  const onselect = (fee: GasOption) => {
    setSelectCostomFees(fee.speed);
    if (fee.speed !== t('common.custom')) {
      changeNetworkFee(fee);
      onClose();
    }
  };

  const handleValidator = () => Promise.resolve();

  const handleSubmit = async () => {
    form.validateFields().then(() => {
      onClose();
    });
  };

  const goBack = () => {
    onClose();
    setSelectCostomFees(selectFee.speed);
  };

  return (
    <FullScreen title={t('page.network.fee.title')} isOpen={isOpen} onClose={goBack}>
      <div className="networkFee">
        <Flex className="network-fee-list" gap={20} vertical align="center">
          {networkFees.map((item) => (
            <Flex className={`card ${item.speed === selectCostomFees ? 'check' : ''}`} onClick={() => onselect(item)} justify="space-between" align="center" gap={8} key={item.speed}>
              <Flex align="center">
                {item.icon}
                <Flex className="network-fee-speed" vertical>
                  <Text className="network-fee-speed-title ui-title-lg-primary-medium">{item.speed}</Text>
                  <Text className={`network-fee-meta ui-text-xs-secondary ${fadeClass}`}>{item.gwei}</Text>
                </Flex>
              </Flex>
              <Flex vertical align="flex-end" className={fadeClass}>
                <Text className="network-fee-speed-title ui-title-lg-primary-medium">{item.time}</Text>
                <Text ellipsis className="network-fee-meta network-fee-usd ui-text-xs-secondary">
                  {item.usd}
                </Text>
              </Flex>
            </Flex>
          ))}
          {costomFees.map((item) => (
            <Flex className={`card ${item.speed === selectCostomFees ? 'check costom' : ''}`} vertical key={item.speed}>
              <Flex onClick={() => onselect(item)} className="network-fee-custom-header" justify="space-between" align="center" gap={8}>
                <Flex align="center">
                  {item.icon}
                  <Flex className="network-fee-speed" vertical>
                    <Text className="network-fee-speed-title ui-title-lg-primary-medium">{item.speed}</Text>
                    <Text className={`network-fee-meta ui-text-xs-secondary ${fadeClass}`}>{item.gwei}</Text>
                  </Flex>
                </Flex>
                <Flex vertical align="flex-end" className={fadeClass}>
                  <Text className="network-fee-speed-title ui-title-lg-primary-medium">{item.time}</Text>
                  <Text ellipsis className="network-fee-meta network-fee-usd ui-text-xs-secondary">
                    {item.usd}
                  </Text>
                </Flex>
              </Flex>
              <Form className="network-fee-custom-form" size="small" requiredMark={false} onFinish={handleSubmit} form={form}>
                <Form.Item
                  label={
                    <Flex align="center" gap={14}>
                      <Text className="network-fee-label-main">{t('page.network.fee.base.label')}</Text>
                      <Text className="network-fee-label-tip ui-text-xs-secondary">{t('page.network.fee.base.tip', { fee: '0.01 Gwei' })}</Text>
                    </Flex>
                  }
                  name="maxFee"
                  rules={[{ required: true, message: t('page.network.fee.base.placeholder') }, { validator: handleValidator }]}
                >
                  <Input className="network-fee-input" placeholder={t('page.network.fee.base.placeholder')} suffix="Gwei" />
                </Form.Item>
                <Form.Item label={t('page.network.fee.priority.label')} name="bestFee" rules={[{ required: true, message: t('page.network.fee.priority.placeholder') }, { validator: handleValidator }]}>
                  <Input className="network-fee-input" placeholder={t('page.network.fee.priority.placeholder')} />
                </Form.Item>
                <Form.Item label={t('page.network.fee.gas.limit.label')} name="gasLimit" rules={[{ required: true, message: t('page.network.fee.gas.limit.placeholder') }, { validator: handleValidator }]}>
                  <Input className="network-fee-input" placeholder={t('page.network.fee.gas.limit.placeholder')} />
                </Form.Item>

                <Button className="network-fee-submit-btn" type="primary" htmlType="submit">
                  {t('common.confirm')}
                </Button>
              </Form>
            </Flex>
          ))}
        </Flex>
      </div>
    </FullScreen>
  );
};

export default NetworkFee;
