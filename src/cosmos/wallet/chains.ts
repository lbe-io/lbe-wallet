import { COSMOS_CHAIN_REGISTRY, type CosmosChainRegistryItem } from '@/cosmos/chains/chain-registry';

export interface CosmosChain {
  chainId: CosmosChainRegistryItem['chainId'];
  chainName: string;
  bech32Prefix: string;
  rpc: string;
  rest: string;
  coinType: number;
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
}

const WALLET_CHAIN_ORDER: CosmosChainRegistryItem['chainId'][] = ['cosmoshub-4', 'osmosis-1', 'injective-1', 'juno-1', 'lbe-1'];

export const COSMOS_CHAINS: CosmosChain[] = WALLET_CHAIN_ORDER.map((chainId) => {
  const chain = COSMOS_CHAIN_REGISTRY[chainId];
  return {
    chainId: chain.chainId,
    chainName: chain.chainName,
    bech32Prefix: chain.bech32Prefix,
    rpc: chain.rpc,
    rest: chain.rest,
    coinType: chain.coinType,
    coinDenom: chain.coinDenom,
    coinMinimalDenom: chain.coinMinimalDenom,
    coinDecimals: chain.coinDecimals,
  };
});
