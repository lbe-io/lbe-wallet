import React from 'react';
import { Flex, Collapse, Button, Form, Input } from 'antd';
import FullScreen from '@/components/FullScreen';
import { AppIcon } from '@/assets/icon';
import SendAmount from '@/popup/app/modal/sendAmount';
import type { SelectAddressModalProps } from '@/popup/types/popupUi';
import { useSelectAddressViewModel } from '@/popup/hooks/useSelectAddressViewModel';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const SelectAddress: React.FC<SelectAddressModalProps> = ({ isOpen, onClose, token }) => {
  const { t } = useTranslation();
  const { form, collapses, items, openSendAmount, closeNextStep, handleSubmit, handleSendSuccess, handleValidator, sendAmountStep } = useSelectAddressViewModel({
    token,
    onClose,
  });

  return (
    <FullScreen title={t('page.send.address.title')} isOpen={isOpen} onClose={onClose}>
      {openSendAmount && <SendAmount {...sendAmountStep} isOpen={openSendAmount} onClose={closeNextStep} onSuccess={handleSendSuccess} />}
      <div className="ui-modal-shell">
        <div className="select-address-main">
          <Flex className="select-address-form-wrapper" align="flex-start">
            <Form className="select-address-form" onFinish={handleSubmit} form={form}>
              <Form.Item name="to" rules={[{ required: true, message: t('page.send.address.required') }, { validator: handleValidator }]} className="select-address-input-item">
                <Input className="select-address-input" placeholder={t('page.send.address.input.placeholder')} prefix={<AppIcon name="SearchIcon" />} variant="filled" />
              </Form.Item>
              <Flex className="select-address-collapse-scroll" vertical>
                <Collapse className="select-address-collapse" bordered={false} activeKey={collapses.map((item) => item.key)} expandIconPosition="end" items={items} />
              </Flex>

              <Button className="select-address-submit-btn ui-content-inset-16" type="primary" size="large" shape="round" htmlType="submit">
                {t('page.send.address.submit')}
              </Button>
            </Form>
          </Flex>
        </div>
      </div>
    </FullScreen>
  );
};

export default SelectAddress;
