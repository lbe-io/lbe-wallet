import { getAddressByChainId, getAddressesByWidId, getSelectedTokensBalance, getTokensBalanceByChainId, getTokensBalanceByGroupValue, type Address, type ChainToken, type StorageAccountQueryContext } from '@/cosmos/storage';
import type { WalletNetworkScope, WalletSelectedAccountLike, WalletSelectedCrypto } from '@/popup/types/walletUi';
import { mapWalletModalDetailTabs } from './walletModalListBuilder';

export const loadWalletModalAddresses = async (selectedAccount?: WalletSelectedAccountLike): Promise<Address[]> => {
  if (!selectedAccount?.wid || selectedAccount?.index === undefined) {
    return [];
  }
  return getAddressesByWidId(selectedAccount.wid, String(selectedAccount.index));
};

export const resolveWalletModalAddress = async (selectedAccount: WalletSelectedAccountLike | undefined, chainId: string) => {
  if (!selectedAccount?.wid || selectedAccount?.index === undefined) {
    return '';
  }

  const normalizedIndex = String(selectedAccount.index);
  const direct = await getAddressByChainId(selectedAccount.wid, normalizedIndex, chainId);
  if (direct?.address) {
    return direct.address;
  }

  const fallback = (await getAddressesByWidId(selectedAccount.wid, normalizedIndex))[0];
  return fallback?.address || '';
};

export const loadWalletModalSendTokens = async (params: WalletNetworkScope & { selectedAccount?: StorageAccountQueryContext }): Promise<ChainToken[]> => {
  if (params.isAllNetworks || params.selectedChain?.name === 'all') {
    return getSelectedTokensBalance(false, params.selectedAccount);
  }
  return getTokensBalanceByChainId(params.activeChainId || params.selectedChain?.chainId || '', false, params.selectedAccount);
};

export const loadWalletModalDetailTabs = async (selectedCrypto: WalletSelectedCrypto, selectedAccount?: StorageAccountQueryContext): Promise<any[]> => {
  if (!selectedCrypto) {
    return [];
  }

  if (selectedCrypto.groupValue) {
    const tokens = await getTokensBalanceByGroupValue(selectedCrypto.groupValue, false, selectedAccount);
    return mapWalletModalDetailTabs(tokens);
  }

  const balances = await getTokensBalanceByChainId(selectedCrypto.chainId, false, selectedAccount);
  return mapWalletModalDetailTabs(balances.filter((o) => o.address === selectedCrypto.address));
};
