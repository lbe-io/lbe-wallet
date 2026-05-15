import { useEffect, useState } from 'react';
import type { GasOption } from '@/components/gasInfo';
import type { GasInfoUiStateResult } from '@/popup/types/popupUi';

export const useGasInfoUiState = ({ networkFees, onChangeFee }: { networkFees: GasOption[]; onChangeFee: (selectFee: GasOption) => void }): GasInfoUiStateResult => {
  const [openNetworkFee, setOpenNetworkFee] = useState(false);
  const [fadeInClass, setFadeInClass] = useState('');
  const [selectedFee, setSelectedFee] = useState<GasOption | null>(null);

  useEffect(() => {
    if (networkFees.length) {
      setSelectedFee(networkFees[1] || networkFees[0]);
      setFadeInClass('fade-in-text');
    }
  }, [networkFees]);

  useEffect(() => {
    if (selectedFee) {
      onChangeFee(selectedFee);
    }
  }, [selectedFee, onChangeFee]);

  return {
    openNetworkFee,
    setOpenNetworkFee,
    fadeInClass,
    selectedFee,
    setSelectedFee,
  };
};
