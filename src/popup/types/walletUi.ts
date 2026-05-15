import type { ChainToken } from '@/cosmos/storage';

export type WalletSelectedAccountLike = {
  id?: string;
  wid?: string;
  index?: number | string;
  name?: string;
  [key: string]: any;
};

export type WalletSelectedChainLike = {
  chainId?: string;
  name?: string;
  icon?: string;
  type?: string;
  [key: string]: any;
};

export type WalletSelectedWalletLike = {
  id?: string;
  name?: string;
  photo?: string;
  [key: string]: any;
};

export type WalletNetworkScope = {
  selectedChain: WalletSelectedChainEntity;
  activeChainId: string;
  isAllNetworks: boolean;
};

export type WalletModalContextValue = WalletNetworkScope & {
  selectedAccount: WalletSelectedAccountEntity;
  selectedWallet: WalletSelectedWalletEntity;
};

export type WalletSelectedCrypto = ChainToken | null;

export type WalletRefreshAction = () => Promise<void> | void;

export type WalletSelectedAccountEntity = WalletSelectedAccountLike & {
  id: string;
  wid: string;
  index: string;
  name: string;
};

export type WalletSelectedWalletEntity = WalletSelectedWalletLike & {
  id: string;
  name: string;
  photo: string;
};

export type WalletSelectedChainEntity = WalletSelectedChainLike & {
  name: string;
};

export type WalletEntitySelectorResult = {
  selectedAccount: WalletSelectedAccountEntity;
  selectedWallet: WalletSelectedWalletEntity;
  selectedChain: WalletSelectedChainEntity;
  activeChainId: string;
  isAllNetworks: boolean;
  networkMode: 'all' | 'single';
};

export type WalletAssetViewModelResult = WalletModalContextValue & {
  balance: number;
  currencyGroupList: ChainToken[];
  isRefreshing: boolean;
  reloadDisplayData: WalletRefreshAction;
  refreshAssets: WalletRefreshAction;
};
