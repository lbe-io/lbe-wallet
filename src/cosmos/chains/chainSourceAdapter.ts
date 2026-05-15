import type { Chain } from '@/cosmos/storage';
import type { CosmosChainInfo } from './chain-registry';
import type { BuiltinChainMetadata } from './chainMetadataAdapter';

export type ChainSourceKind = 'builtin' | 'custom' | 'suggested';

export type ChainSourceBase = {
  source: ChainSourceKind;
  chainId: string;
  chainName: string;
  persisted: boolean;
};

export type BuiltinChainSourceEntry = ChainSourceBase & {
  source: 'builtin';
  metadata: BuiltinChainMetadata;
  chainInfo: CosmosChainInfo;
  chainRecord: Chain;
};

export type CustomChainSourceEntry = ChainSourceBase & {
  source: 'custom';
  chainRecord: Chain;
};

export type SuggestedChainSourceEntry = ChainSourceBase & {
  source: 'suggested';
  chainInfo: CosmosChainInfo;
  chainRecord: Chain;
};

export type ChainSourceEntry = BuiltinChainSourceEntry | CustomChainSourceEntry | SuggestedChainSourceEntry;

export const resolvePersistedChainSource = (chain: Pick<Chain, 'custom'>): Extract<ChainSourceKind, 'builtin' | 'custom'> => {
  return chain.custom === '1' ? 'custom' : 'builtin';
};

export const isBuiltinChainSource = (entry: ChainSourceEntry): entry is BuiltinChainSourceEntry => entry.source === 'builtin';
export const isCustomChainSource = (entry: ChainSourceEntry): entry is CustomChainSourceEntry => entry.source === 'custom';
export const isSuggestedChainSource = (entry: ChainSourceEntry): entry is SuggestedChainSourceEntry => entry.source === 'suggested';
