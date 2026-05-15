import type { Chain, ChainToken } from '@/cosmos/storage';

export const mapWalletModalDetailTabs = (tokens: ChainToken[]) => {
  return tokens.map((item: any, index: number) => ({
    ...item,
    key: String(index),
    label: item.chainName || '',
  }));
};

export const filterWalletModalCryptoBySymbol = (list: ChainToken[], searchValue: string) => {
  const keyword = searchValue.toLowerCase();
  return list.filter((item) => (item.symbol || '').toLowerCase().includes(keyword));
};

export const filterWalletModalManageCryptoList = (selectedCurrencyList: ChainToken[], currencyList: ChainToken[], searchValue: string) => {
  const keyword = searchValue.trim().toLowerCase();
  if (!keyword) {
    return [];
  }
  const source = [...selectedCurrencyList, ...currencyList];
  return source.filter((crypto) => {
    const name = crypto.name?.toLowerCase() || '';
    const symbol = crypto.symbol?.toLowerCase() || '';
    const address = crypto.address?.toLowerCase() || '';
    return name.includes(keyword) || symbol.includes(keyword) || address.includes(keyword);
  });
};

export const buildWalletModalUniqueGroupList = (list: ChainToken[]) => {
  const groupValueSet = new Set<string>();
  return list.filter((item) => {
    if (!item.groupValue) {
      return true;
    }
    const isNew = !groupValueSet.has(item.groupValue);
    if (isNew) {
      groupValueSet.add(item.groupValue);
    }
    return isNew;
  });
};

export const resolveWalletModalNetworksFromGroupedCrypto = (crypto: ChainToken | null): Chain[] => {
  return ((crypto?.currencyGroups || []) as any[]).map((item) => item.chainInfo).filter(Boolean);
};

export const resolveWalletModalGroupedCryptoByChain = (crypto: ChainToken | null, chainId: string) => {
  const grouped = (crypto?.currencyGroups || []) as any[];
  return grouped.find((item) => item.chainId === chainId) || null;
};
