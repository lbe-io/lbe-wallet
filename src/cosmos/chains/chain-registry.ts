import { toBuiltinChainMetadata, toCosmosChainInfoFromMetadata, type BuiltinChainMetadata } from './chainMetadataAdapter';

export interface CosmosChainRegistryItem {
  chainId: 'cosmoshub-4' | 'osmosis-1' | 'injective-1' | 'juno-1' | 'lbe-1';
  chainName: string;
  bech32Prefix: string;
  rpc: string;
  rest: string;
  coinType: number;
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
  gasPriceStep: GasPriceStep;
  extraCurrencies?: CosmosCurrency[];
}

export interface CosmosCurrency {
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
}

export interface CosmosFeeCurrencies {
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
  gasPriceStep?: GasPriceStep;
}

export interface GasPriceStep {
  low: number;
  average: number;
  high: number;
}

export interface CosmosBip44 {
  coinType: number;
}

export interface CosmosBech32Config {
  bech32PrefixAccAddr: string;
  bech32PrefixAccPub: string;
  bech32PrefixValAddr: string;
  bech32PrefixValPub: string;
  bech32PrefixConsAddr: string;
  bech32PrefixConsPub: string;
}

export interface CosmosChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  stakeCurrency: CosmosCurrency;
  bip44: CosmosBip44;
  bech32Config: CosmosBech32Config;
  currencies: CosmosCurrency[];
  feeCurrencies: CosmosFeeCurrencies[];
  features: string[];
}

export const COSMOS_CHAIN_REGISTRY: Record<CosmosChainRegistryItem['chainId'], CosmosChainRegistryItem> = {
  'cosmoshub-4': {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    bech32Prefix: 'cosmos',
    rpc: 'https://cosmos-rpc.polkachu.com',
    rest: 'https://cosmos-api.polkachu.com',
    coinType: 118,
    coinDenom: 'ATOM',
    coinMinimalDenom: 'uatom',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.03,
    },
  },
  'osmosis-1': {
    chainId: 'osmosis-1',
    chainName: 'Osmosis',
    bech32Prefix: 'osmo',
    rpc: 'https://osmosis-rpc.polkachu.com',
    rest: 'https://osmosis-api.polkachu.com',
    coinType: 118,
    coinDenom: 'OSMO',
    coinMinimalDenom: 'uosmo',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0.03,
      average: 0.1,
      high: 0.16,
    },
  },
  'injective-1': {
    chainId: 'injective-1',
    chainName: 'Injective',
    bech32Prefix: 'inj',
    rpc: 'https://injective-rpc.polkachu.com',
    rest: 'https://injective-api.polkachu.com',
    coinType: 60,
    coinDenom: 'INJ',
    coinMinimalDenom: 'inj',
    coinDecimals: 18,
    gasPriceStep: {
      low: 160000000,
      average: 160000000,
      high: 160000000,
    },
  },
  'juno-1': {
    chainId: 'juno-1',
    chainName: 'Juno',
    bech32Prefix: 'juno',
    rpc: 'https://juno-rpc.polkachu.com',
    rest: 'https://juno-api.polkachu.com',
    coinType: 118,
    coinDenom: 'JUNO',
    coinMinimalDenom: 'ujuno',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0.075,
      average: 0.1,
      high: 0.125,
    },
  },
  'lbe-1': {
    chainId: 'lbe-1',
    chainName: 'LBE',
    bech32Prefix: 'cosmos',
    rpc: 'https://rpc.litbee.io',
    rest: 'https://api.litbee.io',
    coinType: 118,
    coinDenom: 'LBE',
    coinMinimalDenom: 'ulbe',
    coinDecimals: 18,
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.03,
    },
    extraCurrencies: [
      {
        coinDenom: 'ZDB',
        coinMinimalDenom: 'ZDB',
        coinDecimals: 18,
      },
    ],
  },
};

export const SUPPORTED_COSMOS_CHAIN_IDS = Object.keys(COSMOS_CHAIN_REGISTRY) as CosmosChainRegistryItem['chainId'][];

export const isSupportedCosmosChain = (chainId: string): chainId is CosmosChainRegistryItem['chainId'] => {
  return chainId in COSMOS_CHAIN_REGISTRY;
};

export const PREFERRED_DEFAULT_COSMOS_CHAIN_ID: CosmosChainRegistryItem['chainId'] = 'lbe-1';
export const DEFAULT_COSMOS_CHAIN_ID = isSupportedCosmosChain(PREFERRED_DEFAULT_COSMOS_CHAIN_ID) ? PREFERRED_DEFAULT_COSMOS_CHAIN_ID : SUPPORTED_COSMOS_CHAIN_IDS[0];

export const getCosmosChainConfig = (chainId: string): CosmosChainRegistryItem | undefined => {
  if (!isSupportedCosmosChain(chainId)) return undefined;
  return COSMOS_CHAIN_REGISTRY[chainId];
};

export const getBuiltinChainFeatures = (chainId: CosmosChainRegistryItem['chainId']) => {
  switch (chainId) {
    case 'cosmoshub-4':
    case 'osmosis-1':
    case 'injective-1':
    case 'juno-1':
    case 'lbe-1':
      return ['stargate', 'ibc-transfer'];
    default:
      return ['stargate'];
  }
};

export const toCosmosChainInfo = (chain: CosmosChainRegistryItem): CosmosChainInfo => {
  const metadata = toBuiltinChainMetadata(chain, getBuiltinChainFeatures(chain.chainId));
  return toCosmosChainInfoFromMetadata(metadata);
};

export const getBuiltinCosmosChainMetadata = (chainId: string): BuiltinChainMetadata | undefined => {
  const chain = getCosmosChainConfig(chainId);
  if (!chain) {
    return undefined;
  }
  return toBuiltinChainMetadata(chain, getBuiltinChainFeatures(chain.chainId));
};

export const getBuiltinCosmosChainMetadataList = (): BuiltinChainMetadata[] => {
  return SUPPORTED_COSMOS_CHAIN_IDS.map((chainId) => getBuiltinCosmosChainMetadata(chainId)!);
};

export const getCosmosChainInfos = (): CosmosChainInfo[] => {
  return getBuiltinCosmosChainMetadataList().map(toCosmosChainInfoFromMetadata);
};
