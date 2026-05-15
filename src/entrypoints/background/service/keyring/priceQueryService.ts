import type { RuntimeChainInterpretation } from '@/cosmos/chains/runtimeChainAdapter';
import { ensureRuntimeExecutableQueryContext } from '@/cosmos/chains/runtimeChainAdapter';
import { getCoinGeckoId } from './cosmosUtils';

type CoinGeckoPriceResponse = Record<string, { usd?: number }>;

export type PriceQueryServiceDeps = {
  getRuntimeChainInterpretationByChainId(chainId: string): Promise<RuntimeChainInterpretation | undefined>;
  fetchJson(url: string): Promise<CoinGeckoPriceResponse>;
};

export const getCosmosNativePriceUsdWithDeps = async (deps: PriceQueryServiceDeps, chainId: string): Promise<string> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  ensureRuntimeExecutableQueryContext(chain, 'native price query');
  const coinGeckoId = getCoinGeckoId(chainId);
  if (!coinGeckoId) {
    return '1';
  }
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinGeckoId)}&vs_currencies=usd`;
    const response = await deps.fetchJson(url);
    const usd = Number(response?.[coinGeckoId]?.usd);
    if (!Number.isFinite(usd) || usd <= 0) {
      return '1';
    }
    return usd.toString();
  } catch {
    return '1';
  }
};
