import type { CosmosBech32Config, CosmosChainInfo, CosmosChainRegistryItem, CosmosCurrency, CosmosFeeCurrencies } from './chain-registry';

export type BuiltinChainMetadata = {
  source: 'builtin';
  chainId: CosmosChainRegistryItem['chainId'];
  chainName: string;
  prettyName: string;
  rpc: string;
  rest: string;
  bech32Prefix: string;
  bip44: {
    coinType: number;
  };
  bech32Config: CosmosBech32Config;
  stakeCurrency: CosmosCurrency;
  currencies: CosmosCurrency[];
  feeCurrencies: CosmosFeeCurrencies[];
  gasPriceStep: CosmosChainRegistryItem['gasPriceStep'];
  features: string[];
};

export const buildCosmosBech32Config = (prefix: string): CosmosBech32Config => {
  return {
    bech32PrefixAccAddr: prefix,
    bech32PrefixAccPub: `${prefix}pub`,
    bech32PrefixValAddr: `${prefix}valoper`,
    bech32PrefixValPub: `${prefix}valoperpub`,
    bech32PrefixConsAddr: `${prefix}valcons`,
    bech32PrefixConsPub: `${prefix}valconspub`,
  };
};

export const toBuiltinChainMetadata = (chain: CosmosChainRegistryItem, features: string[] = ['stargate']): BuiltinChainMetadata => {
  const stakeCurrency: CosmosCurrency = {
    coinDenom: chain.coinDenom,
    coinMinimalDenom: chain.coinMinimalDenom,
    coinDecimals: chain.coinDecimals,
  };

  const feeCurrency: CosmosFeeCurrencies = {
    coinDenom: chain.coinDenom,
    coinMinimalDenom: chain.coinMinimalDenom,
    coinDecimals: chain.coinDecimals,
    gasPriceStep: chain.gasPriceStep,
  };

  return {
    source: 'builtin',
    chainId: chain.chainId,
    chainName: chain.chainName,
    prettyName: chain.chainName,
    rpc: chain.rpc,
    rest: chain.rest,
    bech32Prefix: chain.bech32Prefix,
    bip44: {
      coinType: chain.coinType,
    },
    bech32Config: buildCosmosBech32Config(chain.bech32Prefix),
    stakeCurrency,
    currencies: [stakeCurrency, ...(chain.extraCurrencies || [])],
    feeCurrencies: [feeCurrency],
    gasPriceStep: chain.gasPriceStep,
    features,
  };
};

export const toCosmosChainInfoFromMetadata = (metadata: BuiltinChainMetadata): CosmosChainInfo => {
  return {
    chainId: metadata.chainId,
    chainName: metadata.chainName,
    rpc: metadata.rpc,
    rest: metadata.rest,
    stakeCurrency: metadata.stakeCurrency,
    bip44: metadata.bip44,
    bech32Config: metadata.bech32Config,
    currencies: metadata.currencies,
    feeCurrencies: metadata.feeCurrencies,
    features: metadata.features,
  };
};

export const buildCosmosHdPath = (metadata: Pick<BuiltinChainMetadata, 'bip44'>, accountIndex: number) => `m/44'/${metadata.bip44.coinType}'/0'/0/${accountIndex}`;

export const toBuiltinWalletChainRecord = (metadata: BuiltinChainMetadata) => {
  return {
    chainId: metadata.chainId,
    custom: '0',
    decimals: String(metadata.stakeCurrency.coinDecimals),
    dr: '0',
    explore: '',
    icon: '',
    muticall: '',
    name: metadata.chainName,
    nft: '',
    rpc: metadata.rpc,
    sorts: '0',
    symbol: metadata.stakeCurrency.coinDenom,
    token: metadata.stakeCurrency.coinDenom,
    type: metadata.chainId,
  };
};

export const toBuiltinWalletTokenRecord = (metadata: BuiltinChainMetadata) => {
  return {
    chainId: metadata.chainId,
    type: 'native',
    assetType: 'token',
    address: metadata.stakeCurrency.coinMinimalDenom,
    addressLow: metadata.stakeCurrency.coinMinimalDenom.toLowerCase(),
    name: metadata.stakeCurrency.coinDenom,
    symbol: metadata.stakeCurrency.coinDenom,
    decimals: String(metadata.stakeCurrency.coinDecimals),
    logoURI: '',
    tags: '',
    groupValue: '',
    selected: '1',
    custom: '0',
    sorts: '0',
    dr: '0',
  };
};
