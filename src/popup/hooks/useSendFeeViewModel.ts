import { useState } from 'react';
import type { GasOption } from '@/components/gasInfo';
import type { SendFeeSelectionResult } from '@/popup/types/popupUi';

export const useSendFeeViewModel = (): SendFeeSelectionResult => {
  const [selectedFee, setSelectedFee] = useState<GasOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runWithSubmitting = async <T>(task: () => Promise<T>) => {
    setSubmitting(true);
    try {
      return await task();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedFee,
    setSelectedFee,
    submitting,
    runWithSubmitting,
  };
};
