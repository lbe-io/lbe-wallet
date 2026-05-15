import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useWallet } from '@/app/contexts';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { useSendFeeViewModel } from '@/popup/hooks/useSendFeeViewModel';
import { useTranslation } from '@/popup/hooks/useTranslation';
import type { PopupWalletAccountMatch, SendInfoModalProps, SendInfoViewModelResult } from '@/popup/types/popupUi';
import { loadSendInfoContext, submitSendFlow } from '@/popup/utils/sendFlowFacade';

export const useSendInfoViewModel = ({ token, amount, toAddress, onSuccess }: Pick<SendInfoModalProps, 'token' | 'amount' | 'toAddress' | 'onSuccess'>): SendInfoViewModelResult => {
  const { t } = useTranslation();
  const [chainName, setChainName] = useState('');
  const [fromAddressIsMine, setFromAddressIsMine] = useState<PopupWalletAccountMatch | null>(null);
  const [toAddressIsMine, setToAddressIsMine] = useState<PopupWalletAccountMatch | null>(null);
  const feeSelection = useSendFeeViewModel();
  const walletController = useWallet();
  const { selectedAccount } = useWalletEntitySelector();
  const numericAmount = Number(amount) || 0;
  const displayAmount = amount || '0';
  const networkFeeLabel = chainName ? `${chainName} ${t('common.network.fee')}` : t('common.network.fee');
  const confirmDisabled = !numericAmount || feeSelection.submitting || !token;

  useEffect(() => {
    loadSendInfoContext({ token, toAddress }).then((context) => {
      setChainName(context.chainName);
      setFromAddressIsMine(context.fromAddressIsMine);
      setToAddressIsMine(context.toAddressIsMine);
    });
  }, [token?.chainId, token?.accountAddress, toAddress]);

  const handleConfirm = async () => {
    if (!token) {
      message.error(t('page.send.info.token.unavailable'));
      return;
    }
    const recipient = (toAddress || '').trim();
    if (!recipient) {
      message.error(t('page.send.info.address.invalid'));
      return;
    }
    if (!numericAmount || Number.isNaN(numericAmount)) {
      message.error(t('page.send.info.amount.invalid'));
      return;
    }
    try {
      const result = await feeSelection.runWithSubmitting(() =>
        submitSendFlow({
          walletController,
          token,
          amount,
          toAddress: recipient,
          selectedAccount,
          selectedFee: feeSelection.selectedFee,
        }),
      );

      const txHashPreview = result.hash.length > 12 ? `${result.hash.slice(0, 12)}...` : result.hash;
      message.success(t('page.send.info.broadcast.success', { hash: txHashPreview }));
      onSuccess?.(result);
    } catch (error: any) {
      message.error(error?.message || t('page.send.info.broadcast.fail'));
    }
  };

  return {
    chainName,
    fromAddressIsMine,
    toAddressIsMine,
    feeSelection,
    selectedFee: feeSelection.selectedFee,
    setSelectedFee: feeSelection.setSelectedFee,
    submitting: feeSelection.submitting,
    numericAmount,
    displayAmount,
    networkFeeLabel,
    confirmDisabled,
    handleConfirm,
  };
};
