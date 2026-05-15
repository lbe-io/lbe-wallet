import type { RuntimeChainInterpretation } from '@/cosmos/chains/runtimeChainAdapter';
import { ensureRuntimeChainNativeAssetContext, ensureRuntimeExecutableQueryContext } from '@/cosmos/chains/runtimeChainAdapter';
import type { CosmosStakingSummary } from './types';

export type StakingQueryServiceDeps = {
  getRuntimeChainInterpretationByChainId(chainId: string): Promise<RuntimeChainInterpretation | undefined>;
};

export const getCosmosStakingSummaryWithDeps = async (deps: StakingQueryServiceDeps, chainId: string, _address: string): Promise<CosmosStakingSummary> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const supportedChain = ensureRuntimeExecutableQueryContext(chain, 'staking query');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(supportedChain, 'staking query');

  return {
    delegations: [],
    rewards: [],
    totalDelegated: {
      denom: nativeAssetContext.minimalDenom,
      amount: '0',
      displayAmount: '0',
    },
    totalReward: {
      denom: nativeAssetContext.minimalDenom,
      amount: '0',
      displayAmount: '0',
    },
  };
};
