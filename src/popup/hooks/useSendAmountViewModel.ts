import type { RefObject } from 'react';
import { formatTokenAmount } from '@/shared/common';
import type { SendAmountModalProps, SendAmountViewModelResult } from '@/popup/types/popupUi';
import { useSendFlowStepController } from '@/popup/hooks/useSendFlowStepController';
import { useSendAmountUiState } from '@/popup/hooks/useSendAmountUiState';
import { buildSendFlowAmountStep } from '@/popup/utils/sendFlowFacade';

export const useSendAmountViewModel = ({
  token,
  toAddress,
  onClose,
  onSuccess,
}: Pick<SendAmountModalProps, 'token' | 'toAddress' | 'onClose' | 'onSuccess'>): SendAmountViewModelResult & {
  inputRef: RefObject<any>;
} => {
  const controller = useSendFlowStepController({
    initialStep: 'sendAmount',
    nextStep: 'sendInfo',
    onClose,
    onSuccess,
  });
  const uiState = useSendAmountUiState({
    token,
    isNextStepOpen: controller.isNextStepOpen,
  });
  const formattedTokenAmount = formatTokenAmount(String(token?.amount ?? '0'));

  return {
    ...uiState,
    uiState,
    currentStep: controller.currentStep,
    openSendInfo: controller.isNextStepOpen,
    closeCurrentStep: controller.closeCurrentStep,
    openNextStep: controller.openNextStep,
    closeNextStep: controller.closeNextStep,
    formattedTokenAmount,
    sendInfoStep: buildSendFlowAmountStep({ token, toAddress, amount: uiState.amount }),
    handleSendInfoSuccess: controller.handleStepSuccess,
  };
};
