import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/app/contexts';
import { ChainToken } from '@/cosmos/storage';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { useFetchWalletData } from '@/popup/hooks/useFetchWalletData';
import type { WalletAssetViewModelResult } from '@/popup/types/walletUi';
import eventBus from '@/shared/events';
import { EVENTS } from '@/shared/constants';
import { calculateWalletBalanceTotal, loadWalletAssetDisplayData, refreshWalletAssetSnapshots } from '@/popup/utils/walletAssetFacade';

export const useWalletAssetViewModel = (): WalletAssetViewModelResult => {
  useFetchWalletData();

  const refreshingAssetsRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [tokenList, setTokenList] = useState<ChainToken[]>([]);
  const [currencyList, setCurrencyList] = useState<ChainToken[]>([]);
  const [currencyGroupList, setCurrencyGroupList] = useState<ChainToken[]>([]);

  const { selectedAccount, selectedWallet, selectedChain, activeChainId, isAllNetworks } = useWalletEntitySelector();
  const walletController = useWallet();

  const reloadDisplayData = useCallback(
    async (isBalanceRefresh: boolean = false) => {
      try {
        const next = await loadWalletAssetDisplayData({
          isAllNetworks,
          activeChainId,
          selectedChain,
          selectedAccount,
          preserveTokenList: isBalanceRefresh,
        });
        setCurrencyList(next.currencyList);
        setCurrencyGroupList(next.currencyGroupList);
        if (!isBalanceRefresh) {
          setTokenList(next.tokenList || []);
        }
      } catch {
        // Keep current UI snapshot when refresh fails.
      }
    },
    [isAllNetworks, activeChainId, selectedChain, selectedAccount?.wid, selectedAccount?.index],
  );

  const refreshAssets = useCallback(async () => {
    if (!selectedAccount?.wid || selectedAccount?.index === undefined || !currencyList.length || refreshingAssetsRef.current) {
      return;
    }

    refreshingAssetsRef.current = true;
    setIsRefreshing(true);
    try {
      const updated = await refreshWalletAssetSnapshots({
        walletController,
        currencyList,
        wid: selectedAccount.wid,
        accountIndex: selectedAccount.index,
      });
      if (updated) {
        await reloadDisplayData(true);
      }
    } finally {
      refreshingAssetsRef.current = false;
      setIsRefreshing(false);
    }
  }, [currencyList, selectedAccount?.wid, selectedAccount?.index, walletController, reloadDisplayData]);

  useEffect(() => {
    reloadDisplayData();
  }, [reloadDisplayData]);

  useEffect(() => {
    if (currencyList.length > 0) {
      setBalance(calculateWalletBalanceTotal(currencyList));
    }
  }, [currencyList]);

  useEffect(() => {
    if (tokenList.length > 0) {
      void refreshAssets();
    }
  }, [tokenList, refreshAssets]);

  useEffect(() => {
    const handleBalanceRefresh = () => {
      void refreshAssets();
    };
    eventBus.addEventListener(EVENTS.COSMOS_ASSET_REFRESH, handleBalanceRefresh);
    return () => eventBus.removeEventListener(EVENTS.COSMOS_ASSET_REFRESH, handleBalanceRefresh);
  }, [refreshAssets]);

  return {
    selectedAccount,
    selectedWallet,
    selectedChain,
    activeChainId,
    isAllNetworks,
    balance,
    currencyGroupList,
    isRefreshing,
    reloadDisplayData,
    refreshAssets,
  };
};

export default useWalletAssetViewModel;
