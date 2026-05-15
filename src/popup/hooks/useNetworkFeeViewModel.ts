import { useEffect, useRef, useState } from 'react';
import { Form } from 'antd';
import type { NetworkFeeModalProps, NetworkFeeViewModelResult } from '@/popup/types/popupUi';

export const useNetworkFeeViewModel = ({
  fadeInClass,
  selectFee,
  changeNetworkFee,
  networkFees,
  onClose,
}: Pick<NetworkFeeModalProps, 'fadeInClass' | 'selectFee' | 'changeNetworkFee' | 'networkFees' | 'onClose'>): NetworkFeeViewModelResult => {
  const customFeeTemplate = {
    speed: 'Custom',
    time: '< 30 sec',
    gasPrice: selectFee?.gasPrice || networkFees[1]?.gasPrice || 0.01,
    gasLimit: selectFee?.gasLimit || networkFees[1]?.gasLimit || 150000,
    gwei: 'Custom fee',
    usd: 'Custom gas settings',
    icon: selectFee?.icon || networkFees[1]?.icon || networkFees[0]?.icon,
  };
  const [form] = Form.useForm();
  const [fadeClass, setFadeClass] = useState('');
  const [selectedCustomFee, setSelectedCustomFee] = useState(selectFee.speed);
  const [customFees] = useState([customFeeTemplate]);
  const init = useRef(false);

  useEffect(() => {
    if (init.current) {
      setFadeClass(fadeInClass);
    } else {
      init.current = true;
    }
  }, [fadeInClass]);

  const handleSelect = (fee: (typeof networkFees)[number]) => {
    setSelectedCustomFee(fee.speed);
    if (fee.speed !== 'Custom') {
      changeNetworkFee(fee);
      onClose();
    }
  };

  const handleValidator = () => Promise.resolve();

  const handleSubmit = () => {
    form.validateFields().then(() => {
      onClose();
    });
  };

  const handleClose = () => {
    onClose();
    setSelectedCustomFee(selectFee.speed);
  };

  return {
    form,
    fadeClass,
    selectedCustomFee,
    customFees,
    handleSelect,
    handleValidator,
    handleSubmit,
    handleClose,
  };
};
