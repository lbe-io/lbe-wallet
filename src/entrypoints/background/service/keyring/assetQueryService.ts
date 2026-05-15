import type { RuntimeChainInterpretation } from '@/cosmos/chains/runtimeChainAdapter';
import { ensureRuntimeChainNativeAssetContext, ensureRuntimeExecutableQueryContext } from '@/cosmos/chains/runtimeChainAdapter';
import { formatAmountByDecimals } from './cosmosUtils';
import type { CosmosAssetSnapshot, CosmosNativeBalance, CosmosStakingSummary, CosmosTokenBalance, CosmosTokenBalanceRequest } from './types';

type BalanceCoin = {
  denom?: string;
  amount?: string;
};

type BalanceClient = {
  getAllBalances(address: string): Promise<readonly BalanceCoin[]>;
};

export type AssetQueryServiceDeps = {
  getRuntimeChainInterpretationByChainId(chainId: string): Promise<RuntimeChainInterpretation | undefined>;
  getStargateClientForChain(chainId: string): Promise<BalanceClient>;
  buildTokenBalanceRequests(chainId: string, options?: { extra?: CosmosTokenBalanceRequest[] }): CosmosTokenBalanceRequest[];
  getCosmosStakingSummary(chainId: string, address: string): Promise<CosmosStakingSummary>;
};

const EMPTY_STAKING_SUMMARY: CosmosStakingSummary = {
  delegations: [],
  rewards: [],
  totalDelegated: { denom: '', amount: '0', displayAmount: '0' },
  totalReward: { denom: '', amount: '0', displayAmount: '0' },
};

export const getCosmosTokenBalancesWithDeps = async (deps: AssetQueryServiceDeps, chainId: string, address: string): Promise<CosmosTokenBalance[]> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const supportedChain = ensureRuntimeExecutableQueryContext(chain, 'asset query');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(supportedChain, 'asset query');
  if (!address) {
    throw new Error('Address is required');
  }

  const requests = deps.buildTokenBalanceRequests(chainId);
  const client = await deps.getStargateClientForChain(chainId);
  const tokens = await client.getAllBalances(address);
  const decimalLookup = new Map<string, number>();
  requests.forEach((request) => {
    const key = (request?.denom || '').toLowerCase();
    if (key) {
      decimalLookup.set(key, request.decimals);
    }
  });

  const tokenBalances = new Map<string, CosmosTokenBalance>();
  tokens.forEach((coin) => {
    const denom = (coin?.denom || '').trim();
    if (!denom) {
      return;
    }
    const key = denom.toLowerCase();
    const decimals = decimalLookup.get(key) ?? nativeAssetContext.decimals ?? 6;
    const amount = coin.amount || '0';
    tokenBalances.set(key, {
      denom,
      amount,
      displayAmount: formatAmountByDecimals(amount, decimals),
    });
  });

  requests.forEach((request) => {
    const key = request.denom.toLowerCase();
    if (tokenBalances.has(key)) {
      const existing = tokenBalances.get(key)!;
      tokenBalances.set(key, {
        ...existing,
        displayAmount: formatAmountByDecimals(existing.amount, request.decimals),
      });
      return;
    }
    tokenBalances.set(key, {
      denom: request.denom,
      amount: '0',
      displayAmount: formatAmountByDecimals('0', request.decimals),
    });
  });

  return Array.from(tokenBalances.values());
};

export const getCosmosNativeBalanceWithDeps = async (deps: AssetQueryServiceDeps, chainId: string, address: string): Promise<CosmosNativeBalance> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const supportedChain = ensureRuntimeExecutableQueryContext(chain, 'native balance query');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(supportedChain, 'native balance query');
  const tokenBalances = await getCosmosTokenBalancesWithDeps(deps, chainId, address);
  const nativeDenom = nativeAssetContext.minimalDenom;
  const native = tokenBalances.find((balance) => balance.denom === nativeDenom);
  return {
    denom: nativeDenom,
    amount: native?.amount || '0',
    displayAmount: native?.displayAmount || '0',
  };
};

export const getCosmosAssetSnapshotWithDeps = async (deps: AssetQueryServiceDeps, chainId: string, address: string): Promise<CosmosAssetSnapshot> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const supportedChain = ensureRuntimeExecutableQueryContext(chain, 'asset snapshot query');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(supportedChain, 'asset snapshot query');

  const [tokenBalances, staking] = await Promise.all([getCosmosTokenBalancesWithDeps(deps, chainId, address), deps.getCosmosStakingSummary(chainId, address).catch(() => EMPTY_STAKING_SUMMARY)]);

  const nativeDenom = nativeAssetContext.minimalDenom;
  const nativeBalance = tokenBalances.find((token) => token.denom === nativeDenom) || {
    denom: nativeDenom,
    amount: '0',
    displayAmount: '0',
  };

  return {
    chainId,
    address,
    nativeBalance,
    tokenBalances,
    staking,
    updatedAt: Date.now(),
  };
};
