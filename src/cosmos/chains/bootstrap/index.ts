import { COSMOS_CHAIN_REGISTRY, getCosmosChainConfig, isSupportedCosmosChain } from '@/cosmos/chains/chain-registry';
import { getChainByChainId } from '@/cosmos/storage';
import { listBuiltinChainRecords, writeBuiltinChainRecords } from '@/cosmos/chains/chainRepository';

type ChainRegistryId = keyof typeof COSMOS_CHAIN_REGISTRY;

export const COSMOS_CHAINS = COSMOS_CHAIN_REGISTRY;

export const initializeCosmosChains = async (): Promise<void> => {
  const chainIds = Object.keys(COSMOS_CHAIN_REGISTRY) as ChainRegistryId[];
  const existing = await Promise.all(chainIds.map((chainId) => getChainByChainId(chainId)));
  const allInitialized = existing.every((items) => items.length > 0);
  if (allInitialized) {
    return;
  }

  await writeBuiltinChainRecords(listBuiltinChainRecords());
};

export const getChainConfig = async (chainId: string) => {
  if (!isSupportedCosmosChain(chainId)) {
    return undefined;
  }
  return getCosmosChainConfig(chainId);
};

export const getAllChains = async () => {
  return Object.values(COSMOS_CHAIN_REGISTRY);
};

export const getMainnetChains = async () => {
  return Object.values(COSMOS_CHAIN_REGISTRY);
};
