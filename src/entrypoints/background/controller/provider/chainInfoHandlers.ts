import { buildSuggestedRuntimeChainInterpretationByInfo, buildSuggestedChainSource, listBuiltinChainSources } from '@/cosmos/chains/chainRepository';
import { rpcErrors } from '@/shared/rpc/errors';

import { validateSuggestedChainInfo } from './chainInfoShared';
import { ensureChainId, ensureSupportedChain, getProviderParams } from './controllerShared';
import type { ProviderRequestContext } from './types';

export const suggestChain = async (req: ProviderRequestContext) => {
  const chainInfo = getProviderParams(req).chainInfo;
  const chainInfoRecord = (chainInfo && typeof chainInfo === 'object' ? chainInfo : {}) as Record<string, unknown>;
  const chainId = ensureChainId(chainInfoRecord.chainId);
  ensureSupportedChain(chainId);
  const canonicalSource = listBuiltinChainSources().find((item) => item.chainId === chainId);
  if (!canonicalSource) {
    throw rpcErrors.rpc.invalidParams({
      message: `Unsupported chainId: ${chainId}`,
    });
  }
  const suggestedSource = buildSuggestedChainSource(chainInfo as any);
  const suggestedRuntime = buildSuggestedRuntimeChainInterpretationByInfo(chainInfo as any);
  const canonical = canonicalSource.chainInfo;
  void suggestedSource;
  void suggestedRuntime;
  validateSuggestedChainInfo(chainInfo, canonical);
  return true;
};

export const getChainInfos = async () => {
  return listBuiltinChainSources().map((item) => item.chainInfo);
};
