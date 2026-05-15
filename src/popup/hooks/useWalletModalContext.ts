import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import type { WalletModalContextValue } from '@/popup/types/walletUi';

export const useWalletModalContext = (): WalletModalContextValue => {
  const { selectedAccount, selectedWallet, selectedChain, activeChainId, isAllNetworks } = useWalletEntitySelector();

  return {
    selectedAccount,
    selectedWallet,
    selectedChain,
    activeChainId,
    isAllNetworks,
  };
};

export default useWalletModalContext;
