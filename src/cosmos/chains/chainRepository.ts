import { addChainLists, getAllAddresses, getChainByChainId } from '@/cosmos/storage';
import type { Chain } from '@/cosmos/storage';
import { getBuiltinChainSource, getBuiltinChainSourceList, toBuiltinChainWriteRecord } from './builtinChainSource';
import type { ChainSourceEntry, CustomChainSourceEntry } from './chainSourceAdapter';
import { getCustomChainSource, getCustomChainSourceList, toCustomChainSourceEntry, writeCustomChainSourceRecord } from './customChainSource';
import { getSuggestedChainSource, isPersistedSuggestedChainRecord, toSuggestedChainSourceEntry } from './suggestedChainSource';
import type { CosmosChainInfo } from './chain-registry';
import { buildPersistedCustomRuntimeChainInterpretation, buildRuntimeChainInterpretation, buildSuggestedRuntimeChainInterpretation, type RuntimeChainInterpretation } from './runtimeChainAdapter';
import {
  buildRuntimeExecutablePreconditions,
  getRuntimeChainCapabilityResult,
  getRuntimeExecutableCapabilityResult,
  type RuntimeExecutableCapability,
  type RuntimeExecutableCapabilityResult,
  type RuntimeExecutablePreconditions,
  type RuntimeChainCapability,
  type RuntimeChainCapabilitySupport,
} from './runtimeChainCapability';

export const listBuiltinChainSources = () => getBuiltinChainSourceList();

export const listBuiltinChainRecords = (): Chain[] => {
  return getBuiltinChainSourceList().map(toBuiltinChainWriteRecord);
};

export const listCustomChainSources = async () => getCustomChainSourceList();

export const listCustomChainRecords = async (): Promise<Chain[]> => {
  const entries = await getCustomChainSourceList();
  return entries.map((entry) => entry.chainRecord);
};

export const getChainSourceByChainId = async (chainId: string): Promise<ChainSourceEntry | undefined> => {
  const builtin = getBuiltinChainSource(chainId);
  if (builtin) {
    return builtin;
  }

  const suggested = await getSuggestedChainSource(chainId);
  if (suggested) {
    return suggested;
  }

  const custom = await getCustomChainSource(chainId);
  if (custom) {
    return custom;
  }

  const chains = await getChainByChainId(chainId);
  const chain = chains.find((item) => item.custom === '1' && !isPersistedSuggestedChainRecord(item));
  return chain ? toCustomChainSourceEntry(chain) : undefined;
};

export const writeBuiltinChainRecords = async (chains?: Chain[]) => {
  const records = chains || listBuiltinChainRecords();
  await addChainLists(records);
  return records;
};

export const writeCustomChainRecord = async (chain: Chain) => writeCustomChainSourceRecord(chain);

export const buildSuggestedChainSource = (chainInfo: CosmosChainInfo) => toSuggestedChainSourceEntry(chainInfo);

const buildRuntimeChainInterpretationBySource = async (source: ChainSourceEntry): Promise<RuntimeChainInterpretation> => {
  if (source.source !== 'custom' || !source.persisted) {
    return buildRuntimeChainInterpretation(source);
  }

  const addressProjections = (await getAllAddresses())
    .filter((address) => address.chainId === source.chainId)
    .map((address) => ({
      chainId: address.chainId,
      address: address.address,
      path: address.path,
    }));

  return buildPersistedCustomRuntimeChainInterpretation(source as CustomChainSourceEntry, { addressProjections });
};

export const getRuntimeChainInterpretationByChainId = async (chainId: string): Promise<RuntimeChainInterpretation | undefined> => {
  const source = await getChainSourceByChainId(chainId);
  return source ? buildRuntimeChainInterpretationBySource(source) : undefined;
};

export const buildSuggestedRuntimeChainInterpretationByInfo = (chainInfo: CosmosChainInfo): RuntimeChainInterpretation => {
  return buildSuggestedRuntimeChainInterpretation(buildSuggestedChainSource(chainInfo));
};

export const getRuntimeChainCapabilityByChainId = async (chainId: string, capability: RuntimeChainCapability): Promise<RuntimeChainCapabilitySupport | undefined> => {
  const interpretation = await getRuntimeChainInterpretationByChainId(chainId);
  return interpretation ? getRuntimeChainCapabilityResult(interpretation, capability) : undefined;
};

export const getRuntimeExecutableCapabilityByChainId = async (chainId: string, capability: RuntimeExecutableCapability): Promise<RuntimeExecutableCapabilityResult | undefined> => {
  const interpretation = await getRuntimeChainInterpretationByChainId(chainId);
  return interpretation ? getRuntimeExecutableCapabilityResult(interpretation, capability) : undefined;
};

export const getRuntimeExecutablePreconditionsByChainId = async (chainId: string): Promise<RuntimeExecutablePreconditions | undefined> => {
  const interpretation = await getRuntimeChainInterpretationByChainId(chainId);
  return interpretation ? buildRuntimeExecutablePreconditions(interpretation) : undefined;
};
