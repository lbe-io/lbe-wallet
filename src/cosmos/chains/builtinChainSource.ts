import type { Chain } from '@/cosmos/storage';
import { COSMOS_CHAIN_REGISTRY, getCosmosChainConfig, isSupportedCosmosChain, toCosmosChainInfo, type CosmosChainRegistryItem } from './chain-registry';
import { toBuiltinChainMetadata, toBuiltinWalletChainRecord, type BuiltinChainMetadata } from './chainMetadataAdapter';
import type { BuiltinChainSourceEntry } from './chainSourceAdapter';

const CHAIN_FEATURES: Record<CosmosChainRegistryItem['chainId'], string[]> = {
  'cosmoshub-4': ['stargate', 'ibc-transfer'],
  'osmosis-1': ['stargate', 'ibc-transfer'],
  'injective-1': ['stargate', 'ibc-transfer'],
  'juno-1': ['stargate', 'ibc-transfer'],
  'lbe-1': ['stargate', 'ibc-transfer'],
};

export const getBuiltinChainFeatures = (chainId: CosmosChainRegistryItem['chainId']) => {
  return CHAIN_FEATURES[chainId] || ['stargate'];
};

export const toBuiltinChainSourceEntry = (chain: CosmosChainRegistryItem): BuiltinChainSourceEntry => {
  const metadata = toBuiltinChainMetadata(chain, getBuiltinChainFeatures(chain.chainId));
  const chainRecord = toBuiltinWalletChainRecord(metadata) as Chain;

  return {
    source: 'builtin',
    chainId: metadata.chainId,
    chainName: metadata.chainName,
    persisted: true,
    metadata,
    chainInfo: toCosmosChainInfo(chain),
    chainRecord,
  };
};

export const getBuiltinChainSource = (chainId: string): BuiltinChainSourceEntry | undefined => {
  if (!isSupportedCosmosChain(chainId)) {
    return undefined;
  }
  const chain = getCosmosChainConfig(chainId);
  return chain ? toBuiltinChainSourceEntry(chain) : undefined;
};

export const getBuiltinChainSourceList = (): BuiltinChainSourceEntry[] => {
  return (Object.keys(COSMOS_CHAIN_REGISTRY) as CosmosChainRegistryItem['chainId'][]).map((chainId) => toBuiltinChainSourceEntry(COSMOS_CHAIN_REGISTRY[chainId]));
};

export const toBuiltinChainMetadataFromSource = (entry: BuiltinChainSourceEntry): BuiltinChainMetadata => entry.metadata;

export const toBuiltinChainWriteRecord = (entry: BuiltinChainSourceEntry): Chain => ({
  ...entry.chainRecord,
});
