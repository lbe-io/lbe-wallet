import { useMemo } from 'react';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import { useAppSelector } from '@/popup/hooks/redux';
import type { WalletEntitySelectorResult, WalletSelectedChainEntity } from '@/popup/types/walletUi';

export const useWalletEntitySelector = (): WalletEntitySelectorResult => {
  const { selectedAccount, selectedWallet, selectedChain, activeChainId, networkMode } = useAppSelector((state) => state.application);

  return useMemo(() => {
    const normalizedAccount = {
      id: selectedAccount?.id || '',
      wid: selectedAccount?.wid || '',
      index: selectedAccount?.index === undefined || selectedAccount?.index === null ? '' : String(selectedAccount.index),
      name: selectedAccount?.name || '',
      ...(selectedAccount || {}),
    };
    const normalizedWallet = {
      id: selectedWallet?.id || '',
      name: selectedWallet?.name || '',
      photo: selectedWallet?.photo || '',
      ...(selectedWallet || {}),
    };
    const normalizedChain: WalletSelectedChainEntity = selectedChain?.name ? { name: selectedChain.name, ...(selectedChain || {}) } : { name: 'all' };
    const resolvedIsAllNetworks = networkMode === 'all' || normalizedChain.name === 'all';
    const resolvedActiveChainId = activeChainId || normalizedChain.chainId || DEFAULT_COSMOS_CHAIN_ID;

    return {
      selectedAccount: normalizedAccount,
      selectedWallet: normalizedWallet,
      selectedChain: normalizedChain,
      activeChainId: resolvedActiveChainId,
      isAllNetworks: resolvedIsAllNetworks,
      networkMode,
    };
  }, [activeChainId, networkMode, selectedAccount, selectedChain, selectedWallet]);
};

export default useWalletEntitySelector;
