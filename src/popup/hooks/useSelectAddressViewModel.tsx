import { useEffect, useMemo, useState } from 'react';
import { Typography, Flex } from 'antd';
import type { CollapseProps } from 'antd';
import Item from '@/components/Item';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import type { SelectAddressModalProps, SelectAddressViewModelResult } from '@/popup/types/popupUi';
import { useSendFlowStepController } from '@/popup/hooks/useSendFlowStepController';
import { useSelectAddressFormState } from '@/popup/hooks/useSelectAddressFormState';
import { buildSendFlowTarget, loadSelectAddressGroups } from '@/popup/utils/sendFlowFacade';

const { Text } = Typography;

export const useSelectAddressViewModel = ({ token, onClose }: Pick<SelectAddressModalProps, 'token' | 'onClose'>): SelectAddressViewModelResult => {
  const [collapses, setCollapses] = useState<SelectAddressViewModelResult['collapses']>([]);
  const { selectedAccount } = useWalletEntitySelector();
  const controller = useSendFlowStepController({
    initialStep: 'selectAddress',
    nextStep: 'sendAmount',
    onClose,
  });
  const { form, toAddress, handleValidator, handleSubmit, handleQuickSelect } = useSelectAddressFormState({
    chainId: token?.chainId || '',
    onSubmit: controller.openNextStep,
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) {
        setCollapses([]);
        return;
      }
      const nextCollapses = await loadSelectAddressGroups({ token, selectedAccount });
      setCollapses(nextCollapses);
    };

    fetchAllData();
  }, [selectedAccount, token]);

  const items: CollapseProps['items'] = useMemo(
    () =>
      collapses.map((collapse) => ({
        key: collapse.key,
        label: <Text style={{ fontSize: 16, fontWeight: 500 }}>{collapse.name}</Text>,
        children: (
          <Flex vertical>
            {collapse.accounts.map((item) => (
              <Item key={item} type="selectAddress" onClick={() => handleQuickSelect(item)} name={item} selected={item === toAddress} />
            ))}
          </Flex>
        ),
      })),
    [collapses, handleQuickSelect, toAddress],
  );

  return {
    form,
    collapses,
    items,
    toAddress,
    currentStep: controller.currentStep,
    openSendAmount: controller.isNextStepOpen,
    closeCurrentStep: controller.closeCurrentStep,
    openNextStep: controller.openNextStep,
    closeNextStep: controller.closeNextStep,
    handleSubmit,
    handleSendSuccess: controller.handleStepSuccess,
    handleValidator,
    sendAmountStep: buildSendFlowTarget({ token, toAddress }),
  };
};
