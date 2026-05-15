import { useCallback, useEffect, useState } from 'react';
import type { Chain, ChainToken } from '@/cosmos/storage';
import eventBus from '@/shared/events';
import { EVENTS } from '@/shared/constants';
import { useWalletModalContext } from '@/popup/hooks/useWalletModalContext';
import type { SendSelectCryptoViewModelResult } from '@/popup/types/popupUi';
import { loadWalletModalSendTokens } from '@/popup/utils/walletModalDataFacade';
import { filterWalletModalCryptoBySymbol, resolveWalletModalGroupedCryptoByChain, resolveWalletModalNetworksFromGroupedCrypto } from '@/popup/utils/walletModalListBuilder';
import { useModalSearchList } from '@/popup/hooks/useModalSearchList';

export const useSendSelectCryptoViewModel = (isOpen: boolean): SendSelectCryptoViewModelResult => {
  const [selectedCurrencyList, setSelectedCurrencyList] = useState<ChainToken[]>([]);
  const [openSelectAddress, setOpenSelectAddress] = useState(false);
  const [crypto, setCrypto] = useState<ChainToken | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<ChainToken | null>(null);
  const [openNetwork, setOpenNetwork] = useState(false);
  const [network, setNetwork] = useState<Chain | null>(null);
  const [defaultNetworks, setDefaultNetworks] = useState<Chain[]>([]);
  const { selectedAccount, selectedChain, activeChainId, isAllNetworks } = useWalletModalContext();
  const { filteredList, setSearchValue } = useModalSearchList<ChainToken>({
    filterList: (value) => filterWalletModalCryptoBySymbol(selectedCurrencyList, value),
  });

  const refreshData = useCallback(() => {
    loadWalletModalSendTokens({
      selectedAccount,
      selectedChain,
      activeChainId,
      isAllNetworks,
    })
      .then((list: ChainToken[]) => {
        setSelectedCurrencyList(list);
      })
      .catch(() => {});
  }, [activeChainId, isAllNetworks, selectedAccount, selectedChain]);

  useEffect(() => {
    if (!isOpen) return;
    refreshData();
  }, [isOpen, refreshData]);

  useEffect(() => {
    const handleBalanceRefresh = () => {
      if (isOpen) {
        refreshData();
      }
    };

    eventBus.addEventListener(EVENTS.COSMOS_ASSET_REFRESH, handleBalanceRefresh);
    return () => eventBus.removeEventListener(EVENTS.COSMOS_ASSET_REFRESH, handleBalanceRefresh);
  }, [isOpen, refreshData]);

  const onSelectCurrency = (nextCrypto: ChainToken) => {
    if ((nextCrypto.currencyGroups?.length || 0) > 0) {
      setCrypto(nextCrypto);
      setDefaultNetworks(resolveWalletModalNetworksFromGroupedCrypto(nextCrypto));
      setOpenNetwork(true);
      return;
    }

    setOpenSelectAddress(true);
    setNetwork(nextCrypto.chainInfo);
    setSelectedCrypto(nextCrypto);
  };

  const onSelectNetwork = (chain: Chain | undefined) => {
    if (chain) {
      setNetwork(chain);
      const nextCrypto = resolveWalletModalGroupedCryptoByChain(crypto, chain.chainId);
      setSelectedCrypto(nextCrypto);
      setOpenSelectAddress(true);
    } else {
      setOpenNetwork(false);
    }
  };

  return {
    filteredList,
    setSearchValue,
    openSelectAddress,
    setOpenSelectAddress,
    selectedCrypto,
    openNetwork,
    defaultNetworks,
    network,
    onSelectCurrency,
    onSelectNetwork,
  };
};

export default useSendSelectCryptoViewModel;
