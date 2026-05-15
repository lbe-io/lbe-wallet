import { Form } from 'antd';
import type { SelectAddressFormStateResult } from '@/popup/types/popupUi';
import { validateSendAddressForChain } from '@/popup/utils/sendFlowFacade';

type UseSelectAddressFormStateParams = {
  chainId: string;
  onSubmit: () => void;
};

export const useSelectAddressFormState = ({ chainId, onSubmit }: UseSelectAddressFormStateParams): SelectAddressFormStateResult => {
  const [form] = Form.useForm();
  const toAddress = Form.useWatch('to', form) || '';

  const handleValidator = (_unused: unknown, value: string) => validateSendAddressForChain(value, chainId);

  const handleQuickSelect = (address: string) => {
    form.setFieldValue('to', address);
    form.validateFields();
  };

  const handleSubmit = () => {
    form.validateFields().then(() => {
      onSubmit();
    });
  };

  return {
    form,
    toAddress,
    handleValidator,
    handleSubmit,
    handleQuickSelect,
  };
};
