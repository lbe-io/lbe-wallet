import { useMemo, useState } from 'react';
import type { CosmosSendResult } from '@/popup/utils/cosmosSend';
import type { SendFlowCloseHandler, SendFlowStep, SendFlowSuccessHandler } from '@/popup/types/popupUi';

type UseSendFlowStepControllerParams = {
  initialStep: SendFlowStep;
  nextStep: SendFlowStep;
  onClose: SendFlowCloseHandler;
  onSuccess?: SendFlowSuccessHandler;
};

export const useSendFlowStepController = ({ initialStep, nextStep, onClose, onSuccess }: UseSendFlowStepControllerParams) => {
  const [currentStep, setCurrentStep] = useState<SendFlowStep>(initialStep);

  const openNextStep = () => setCurrentStep(nextStep);
  const closeNextStep = () => setCurrentStep(initialStep);
  const closeCurrentStep = () => onClose();

  const handleStepSuccess = (result: CosmosSendResult) => {
    setCurrentStep(initialStep);
    onClose();
    onSuccess?.(result);
  };

  return useMemo(
    () => ({
      currentStep,
      openNextStep,
      closeNextStep,
      closeCurrentStep,
      isNextStepOpen: currentStep === nextStep,
      handleStepSuccess,
    }),
    [currentStep, nextStep, onClose, onSuccess],
  );
};
