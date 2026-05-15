import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '@/popup/hooks/redux';
import { hideLoad, showLoad } from '@/popup/store/features/applicationSlice';
import { useWalletModalContext } from '@/popup/hooks/useWalletModalContext';
import { useModalSearchList } from '@/popup/hooks/useModalSearchList';
import type { ManageCryptoViewModelResult } from '@/popup/types/popupUi';
import { buildWalletModalUniqueGroupList, filterWalletModalManageCryptoList } from '@/popup/utils/walletModalListBuilder';
import { getAllChainTokens, getAllSelectedChainTokens, getChainTokensByChainId, getSelectedChainTokensByChainId, getTokensByGroupValue, type ChainToken, updateChainTokens } from '@/cosmos/storage';

export const useManageCryptoViewModel = (inViewport: boolean): ManageCryptoViewModelResult => {
  const dispatch = useAppDispatch();
  const { selectedChain, activeChainId, isAllNetworks } = useWalletModalContext();
  const [showList, setShowList] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(0);
  const [currencyList, setCurrencyList] = useState<ChainToken[]>([]);
  const [selectedCurrencyList, setSelectedCurrencyList] = useState<ChainToken[]>([]);

  const {
    searchValue,
    setSearchValue,
    filteredList: searchCurrencyList,
    isSearching,
    isEmpty,
  } = useModalSearchList<ChainToken>({
    filterList: (value) => filterWalletModalManageCryptoList(selectedCurrencyList, currencyList, value),
  });

  const getUnSelectedData = useCallback(
    (nextPage: number = 0) => {
      if (isAllNetworks) {
        getAllChainTokens(nextPage)
          .then((list: ChainToken[]) => {
            const listData = buildWalletModalUniqueGroupList(list);
            setCurrencyList((current) => (nextPage === 0 ? listData : [...current, ...listData]));
            setShowMore(list.length === 20);
            setShowList(true);
          })
          .catch(() => {});
      } else {
        getChainTokensByChainId(activeChainId, nextPage)
          .then((list: ChainToken[]) => {
            setCurrencyList((current) => (nextPage === 0 ? list : [...current, ...list]));
            setShowMore(list.length === 20);
            setShowList(true);
          })
          .catch(() => {});
      }
    },
    [activeChainId, isAllNetworks],
  );

  const refreshData = useCallback(() => {
    dispatch(showLoad());
    setPage(0);
    if (isAllNetworks) {
      getAllSelectedChainTokens()
        .then((list: ChainToken[]) => {
          const listData = buildWalletModalUniqueGroupList(list);
          setSelectedCurrencyList(listData);
          getUnSelectedData(0);
          dispatch(hideLoad());
        })
        .catch(() => {
          dispatch(hideLoad());
        });
      return;
    }

    getSelectedChainTokensByChainId(activeChainId)
      .then((list: ChainToken[]) => {
        setSelectedCurrencyList(list);
        getUnSelectedData(0);
        dispatch(hideLoad());
      })
      .catch(() => {
        dispatch(hideLoad());
      });
  }, [activeChainId, dispatch, getUnSelectedData, isAllNetworks]);

  useEffect(() => {
    refreshData();
  }, [refreshData, selectedChain, activeChainId, isAllNetworks]);

  useEffect(() => {
    if (inViewport && showMore && currencyList.length > 0) {
      const nextPage = page + 1;
      getUnSelectedData(nextPage);
      setPage(nextPage);
    }
  }, [currencyList.length, getUnSelectedData, inViewport, page, showMore]);

  const updateToken = (chainToken: ChainToken) => {
    if (chainToken.groupValue) {
      getTokensByGroupValue(chainToken.groupValue).then((list: ChainToken[]) => {
        const tokens = list.map((item) => ({ ...item, selected: chainToken.selected === '1' ? '0' : '1' }));
        updateChainTokens(tokens)
          .then(() => {
            refreshData();
          })
          .catch(() => {});
      });
      return;
    }

    const nextTokens = [{ ...chainToken, selected: chainToken.selected === '1' ? '0' : '1' }];
    updateChainTokens(nextTokens)
      .then(() => {
        refreshData();
      })
      .catch(() => {});
  };

  return {
    selectedChain,
    activeChainId,
    isAllNetworks,
    showList,
    showMore,
    page,
    currencyList,
    selectedCurrencyList,
    searchValue,
    setSearchValue,
    searchCurrencyList,
    isSearching,
    isEmpty,
    refreshData,
    updateToken,
  };
};

export default useManageCryptoViewModel;
