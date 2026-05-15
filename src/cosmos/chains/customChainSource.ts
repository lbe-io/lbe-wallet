import { addChainLists, getChainByChainId, getCustomChains } from '@/cosmos/storage';
import type { Chain } from '@/cosmos/storage';
import type { CustomChainSourceEntry } from './chainSourceAdapter';
import { isPersistedSuggestedChainRecord } from './suggestedChainSource';

export const toCustomChainSourceEntry = (chain: Chain): CustomChainSourceEntry => ({
  source: 'custom',
  chainId: chain.chainId,
  chainName: chain.name,
  persisted: true,
  chainRecord: chain,
});

export const getCustomChainSourceList = async (): Promise<CustomChainSourceEntry[]> => {
  const chains = await getCustomChains();
  return chains.filter((chain) => !isPersistedSuggestedChainRecord(chain)).map(toCustomChainSourceEntry);
};

export const getCustomChainSource = async (chainId: string): Promise<CustomChainSourceEntry | undefined> => {
  const chains = await getChainByChainId(chainId);
  const chain = chains.find((item) => item.custom === '1' && !isPersistedSuggestedChainRecord(item));
  return chain ? toCustomChainSourceEntry(chain) : undefined;
};

export const writeCustomChainSourceRecord = async (chain: Chain): Promise<CustomChainSourceEntry> => {
  await addChainLists([chain]);
  return toCustomChainSourceEntry(chain);
};
