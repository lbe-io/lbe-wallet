import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import type { WalletNetworkScope } from '@/popup/types/walletUi';

export const useNetworkContext = (): WalletNetworkScope => {
  const { selectedChain, activeChainId, isAllNetworks } = useWalletEntitySelector();

  return {
    selectedChain,
    activeChainId: activeChainId || DEFAULT_COSMOS_CHAIN_ID,
    isAllNetworks,
  };
};
