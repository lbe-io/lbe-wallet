import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChainToken } from '@/cosmos/storage';
import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';
import { useWallet } from '@/app/contexts';
import { useWalletModalContext } from '@/popup/hooks/useWalletModalContext';
import type { CryptoDetailViewModelResult } from '@/popup/types/popupUi';
import { loadWalletModalDetailTabs, resolveWalletModalAddress } from '@/popup/utils/walletModalDataFacade';

const DETAIL_REFRESH_INTERVAL_MS = 30_000;

const toSafeNumber = (value: any) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

export const formatCryptoDetailUsdPrice = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0.000000';
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
};

export const formatCryptoDetailChangePercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const useCryptoDetailViewModel = (isOpen: boolean, selectedCrypto: ChainToken | null): CryptoDetailViewModelResult => {
  const { selectedAccount } = useWalletModalContext();
  const walletController = useWallet();
  const [tokenTx, setTokenTx] = useState<Record<string, any>[]>([]);
  const [tabs, setTabs] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [openSelectAddress, setOpenSelectAddress] = useState(false);
  const [openReceiveQrcode, setOpenReceiveQrcode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentPriceUsd, setCurrentPriceUsd] = useState(0);
  const [liveAmount, setLiveAmount] = useState(0);
  const [liveBalanceUsd, setLiveBalanceUsd] = useState(0);
  const [priceChangePercent24h, setPriceChangePercent24h] = useState<number | null>(null);

  const currentToken = useMemo(() => {
    if (tabs.length > 0 && tabs[tab]) return tabs[tab] as ChainToken;
    return selectedCrypto;
  }, [tabs, tab, selectedCrypto]);

  const fetchTokensBalance = useCallback(async () => {
    if (!selectedCrypto) return;
    const nextTabs = await loadWalletModalDetailTabs(selectedCrypto, selectedAccount);
    setTabs(nextTabs);
  }, [selectedAccount, selectedCrypto]);

  const getLiveMetrics = useCallback(
    async (token: ChainToken | null, resolvedAddress: string) => {
      if (!token) {
        return {
          amount: 0,
          balance: 0,
          priceUsd: 0,
          changePercent24h: null as number | null,
        };
      }

      const chain = getCosmosChainConfig(token.chainId);
      const isNativeToken = !!chain && token.address === chain.coinMinimalDenom;
      const denomKey = (token.addressLow || token.address || chain?.coinMinimalDenom || '').toLowerCase();

      let amount = toSafeNumber(token.amount);
      let balance = toSafeNumber(token.balance);
      let priceUsd = 1;
      let changePercent24h: number | null = null;

      if (resolvedAddress) {
        const snapshot = await walletController.getCosmosAssetSnapshot(token.chainId, resolvedAddress).catch(() => null);
        if (snapshot) {
          const matchingToken = snapshot.tokenBalances?.find((item) => (item?.denom || '').toLowerCase() === denomKey);
          const balanceSource = matchingToken || (isNativeToken ? snapshot.nativeBalance : null);
          if (balanceSource?.displayAmount !== undefined) {
            amount = toSafeNumber(balanceSource.displayAmount);
          }
        }
      }

      balance = amount * priceUsd;

      if (!Number.isFinite(balance) || balance < 0) {
        balance = toSafeNumber(token.balance);
      }

      return {
        amount,
        balance,
        priceUsd,
        changePercent24h,
      };
    },
    [walletController],
  );

  useEffect(() => {
    if (!selectedCrypto || !isOpen) return;
    fetchTokensBalance();

    const timer = window.setInterval(() => {
      fetchTokensBalance();
    }, DETAIL_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchTokensBalance, isOpen, selectedAccount?.index, selectedAccount?.wid, selectedCrypto]);

  useEffect(() => {
    setTab(0);
    setTokenTx([]);
    setCurrentAddress('');
    setCurrentPriceUsd(0);
    setLiveAmount(0);
    setLiveBalanceUsd(0);
    setPriceChangePercent24h(null);
  }, [isOpen, selectedCrypto?.address, selectedCrypto?.chainId, selectedCrypto?.groupValue]);

  useEffect(() => {
    if (!currentToken?.chainId || !selectedAccount?.wid || selectedAccount?.index === undefined) {
      setCurrentAddress('');
      return;
    }

    resolveWalletModalAddress(selectedAccount, currentToken.chainId)
      .then((address) => {
        setCurrentAddress(address || currentToken?.accountAddress || '');
      })
      .catch(() => {
        setCurrentAddress(currentToken?.accountAddress || '');
      });
  }, [currentToken?.accountAddress, currentToken?.chainId, selectedAccount?.index, selectedAccount?.wid]);

  useEffect(() => {
    if (!isOpen || !currentToken) return;

    let disposed = false;
    const resolvedAddress = currentAddress || currentToken.accountAddress || '';

    const refreshLiveMetrics = async () => {
      const metrics = await getLiveMetrics(currentToken, resolvedAddress).catch(() => null);

      if (!metrics || disposed) return;

      setLiveAmount(metrics.amount);
      setLiveBalanceUsd(metrics.balance);
      setCurrentPriceUsd(metrics.priceUsd);
      setPriceChangePercent24h(metrics.changePercent24h);
    };

    refreshLiveMetrics();

    const timer = window.setInterval(() => {
      refreshLiveMetrics();
    }, DETAIL_REFRESH_INTERVAL_MS);

    const refreshOnForeground = () => {
      if (document.visibilityState === 'visible') {
        refreshLiveMetrics();
      }
    };

    window.addEventListener('focus', refreshOnForeground);
    document.addEventListener('visibilitychange', refreshOnForeground);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshOnForeground);
      document.removeEventListener('visibilitychange', refreshOnForeground);
    };
  }, [currentAddress, currentToken, getLiveMetrics, isOpen]);

  useEffect(() => {
    if (!currentToken?.chainId || !selectedAccount?.wid || selectedAccount?.index === undefined) {
      setTokenTx([]);
      return;
    }

    resolveWalletModalAddress(selectedAccount, currentToken.chainId)
      .then(async (address) => {
        if (!address) {
          setTokenTx([]);
          return;
        }

        const chain = getCosmosChainConfig(currentToken.chainId);
        const isNativeToken = !!chain && currentToken.address === chain.coinMinimalDenom;
        if (!isNativeToken) {
          setTokenTx([]);
          return;
        }

        const history = await walletController.getCosmosTxHistory(currentToken.chainId, address, 30).catch(() => []);
        setTokenTx(history as any[]);
      })
      .catch(() => {
        setTokenTx([]);
      });
  }, [currentToken?.address, currentToken?.chainId, selectedAccount?.index, selectedAccount?.wid, walletController]);

  return {
    currentToken,
    tokenTx,
    tabs,
    tab,
    setTab,
    openSelectAddress,
    setOpenSelectAddress,
    openReceiveQrcode,
    setOpenReceiveQrcode,
    currentAddress,
    currentPriceUsd,
    liveAmount,
    liveBalanceUsd,
    priceChangePercent24h,
    openSend: () => setOpenSelectAddress(true),
    openReceive: () => setOpenReceiveQrcode(true),
  };
};

export default useCryptoDetailViewModel;
