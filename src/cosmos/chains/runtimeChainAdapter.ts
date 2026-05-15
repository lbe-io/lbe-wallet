import type { CosmosChainInfo } from './chain-registry';
import type { GasPriceStep } from './chain-registry';
import type { BuiltinChainSourceEntry, ChainSourceEntry, CustomChainSourceEntry, SuggestedChainSourceEntry } from './chainSourceAdapter';
import type { AddressBech32Context, NativeAssetContext, RuntimeChainInterpretation } from './runtimeChainCapability';
import { attachRuntimeChainCapabilityMatrix } from './runtimeChainCapability';
import { buildCosmosBech32Config } from './chainMetadataAdapter';
import { resolvePersistedCustomChainAddressDerivationContext, resolvePersistedCustomChainGasPriceStep, resolvePersistedCustomChainNativeAssetContext, resolvePersistedCustomChainRestContext } from './customChainRuntimePolicy';
import { resolvePersistedSuggestedMetadataUnsupportedReason } from './suggestedChainSource';
export type {
  AddressBech32Context,
  NativeAssetContext,
  RuntimeCapabilityContractKind,
  RuntimeDisplayOnlyCapability,
  RuntimeExecutableCapability,
  RuntimeExecutableCapabilityResult,
  RuntimeExecutablePreconditions,
  RuntimeProviderAccountReadPreconditions,
  RuntimeProviderAccountReadResult,
  RuntimeProviderSignAminoPreconditions,
  RuntimeProviderSignAminoResult,
  RuntimeProviderSignArbitraryPreconditions,
  RuntimeProviderSignArbitraryResult,
  RuntimeProviderSendTxPreconditions,
  RuntimeProviderSendTxResult,
  RuntimeProviderSignDirectPreconditions,
  RuntimeProviderSignDirectResult,
  RuntimeSelectivePartialCapability,
  RuntimeChainCapability,
  RuntimeChainCapabilityMatrix,
  RuntimeChainCapabilitySupport,
  RuntimeChainInterpretation,
  RuntimeChainStatus,
  RuntimeUnsupportedDetails,
  RuntimeUnsupportedError,
  RuntimeUnsupportedReason,
} from './runtimeChainCapability';
export {
  buildRuntimeExecutablePreconditions,
  buildRuntimeUnsupportedEntryDetails,
  buildRuntimeUnsupportedEntryError,
  buildRuntimeUnsupportedDetails,
  buildRuntimeProviderAccountReadPreconditions,
  buildRuntimeProviderSignAminoPreconditions,
  buildRuntimeProviderSignArbitraryPreconditions,
  buildRuntimeProviderSendTxPreconditions,
  buildRuntimeProviderSignDirectPreconditions,
  ensureRuntimeChainAddressContext,
  ensureRuntimeChainApprovalDisplayContext,
  ensureRuntimeChainCapability,
  ensureRuntimeChainHydrationContext,
  ensureRuntimeChainNativeAssetContext,
  ensureRuntimeChainQueryContext,
  ensureRuntimeChainRestContext,
  ensureRuntimeChainRpcContext,
  ensureRuntimeChainSendFlowContext,
  ensureRuntimeExecutableCapability,
  ensureRuntimeProviderAccountReadContext,
  ensureRuntimeProviderSignAminoContext,
  ensureRuntimeProviderSignArbitraryContext,
  ensureRuntimeProviderSendTxContext,
  ensureRuntimeProviderSignDirectContext,
  ensureRuntimeExecutableQueryContext,
  ensureRuntimeExecutableSendFlowContext,
  ensureRuntimeChainSupported,
  getRuntimeUnsupportedErrorData,
  getRuntimeCapabilityContractKind,
  getRuntimeChainCapabilityResult,
  getRuntimeExecutableCapabilityResult,
  getRuntimeProviderAccountReadResult,
  getRuntimeProviderSignAminoResult,
  getRuntimeProviderSignArbitraryResult,
  getRuntimeProviderSendTxResult,
  getRuntimeProviderSignDirectResult,
  hasRuntimeChainCapability,
  resolveRuntimeProviderAccountReadUnsupportedReason,
  resolveRuntimeProviderSignAminoUnsupportedReason,
  resolveRuntimeProviderSignArbitraryUnsupportedReason,
  resolveRuntimeProviderSendTxUnsupportedReason,
  resolveRuntimeProviderSignDirectUnsupportedReason,
  resolveRuntimeExecutableUnsupportedReason,
} from './runtimeChainCapability';

const toFiniteInteger = (value: unknown) => {
  const normalized = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(normalized) || normalized < 0) {
    return undefined;
  }
  return Math.trunc(normalized);
};

const toBuiltinNativeAssetContext = (entry: BuiltinChainSourceEntry): NativeAssetContext => ({
  symbol: entry.metadata.stakeCurrency.coinDenom,
  minimalDenom: entry.metadata.stakeCurrency.coinMinimalDenom,
  decimals: entry.metadata.stakeCurrency.coinDecimals,
});

const toBuiltinAddressContext = (entry: BuiltinChainSourceEntry): AddressBech32Context => ({
  bech32Prefix: entry.metadata.bech32Prefix,
  coinType: entry.metadata.bip44.coinType,
});

const toCustomNativeAssetContext = (entry: CustomChainSourceEntry): NativeAssetContext | null => {
  const minimalDenom = (entry.chainRecord.token || '').trim();
  const symbol = (entry.chainRecord.symbol || '').trim();
  const decimals = toFiniteInteger(entry.chainRecord.decimals);
  if (!minimalDenom || !symbol || decimals === undefined) {
    return null;
  }
  return {
    symbol,
    minimalDenom,
    decimals,
  };
};

const toSuggestedNativeAssetContext = (entry: SuggestedChainSourceEntry): NativeAssetContext | null => {
  const currency = entry.chainInfo?.stakeCurrency;
  const symbol = (currency?.coinDenom || '').trim();
  const minimalDenom = (currency?.coinMinimalDenom || '').trim();
  const decimals = toFiniteInteger(currency?.coinDecimals);
  if (!symbol || !minimalDenom || decimals === undefined) {
    return null;
  }
  return {
    symbol,
    minimalDenom,
    decimals,
  };
};

const toSuggestedAddressContext = (entry: SuggestedChainSourceEntry): AddressBech32Context | null => {
  const bech32Prefix = (entry.chainInfo?.bech32Config?.bech32PrefixAccAddr || '').trim();
  const coinType = toFiniteInteger(entry.chainInfo?.bip44?.coinType);
  if (!bech32Prefix || coinType === undefined) {
    return null;
  }
  return {
    bech32Prefix,
    coinType,
  };
};

const buildPersistedCustomChainInfo = ({
  entry,
  addressContext,
  nativeAssetContext,
  gasPriceStep,
  rest,
}: {
  entry: CustomChainSourceEntry;
  addressContext: AddressBech32Context | null;
  nativeAssetContext: NativeAssetContext | null;
  gasPriceStep: GasPriceStep | null;
  rest?: string | null;
}): CosmosChainInfo | undefined => {
  if (!addressContext || !nativeAssetContext || !gasPriceStep) {
    return undefined;
  }

  const stakeCurrency = {
    coinDenom: nativeAssetContext.symbol,
    coinMinimalDenom: nativeAssetContext.minimalDenom,
    coinDecimals: nativeAssetContext.decimals,
  };

  return {
    chainId: entry.chainId,
    chainName: entry.chainName,
    rpc: entry.chainRecord.rpc || '',
    rest: rest || '',
    stakeCurrency,
    bip44: {
      coinType: addressContext.coinType,
    },
    bech32Config: buildCosmosBech32Config(addressContext.bech32Prefix),
    currencies: [stakeCurrency],
    feeCurrencies: [
      {
        ...stakeCurrency,
        gasPriceStep,
      },
    ],
    features: ['stargate'],
  };
};

export const buildBuiltinRuntimeChainInterpretation = (entry: BuiltinChainSourceEntry): RuntimeChainInterpretation =>
  attachRuntimeChainCapabilityMatrix({
    source: 'builtin',
    runtimeStatus: 'supported',
    persisted: entry.persisted,
    chainId: entry.chainId,
    chainName: entry.chainName,
    rpc: entry.metadata.rpc,
    rest: entry.metadata.rest,
    chainInfo: entry.chainInfo,
    nativeAssetContext: toBuiltinNativeAssetContext(entry),
    addressContext: toBuiltinAddressContext(entry),
  });

export const buildCustomRuntimeChainInterpretation = (
  entry: CustomChainSourceEntry,
  options?: {
    addressContext?: AddressBech32Context | null;
    nativeAssetContext?: NativeAssetContext | null;
    rest?: string | null;
    chainInfo?: CosmosChainInfo;
  },
): RuntimeChainInterpretation =>
  attachRuntimeChainCapabilityMatrix({
    source: 'custom',
    runtimeStatus: 'partial',
    unsupportedReason: 'custom_chain_missing_runtime_metadata',
    persisted: entry.persisted,
    chainId: entry.chainId,
    chainName: entry.chainName,
    rpc: entry.chainRecord.rpc || '',
    rest: options?.rest || undefined,
    chainInfo: options?.chainInfo,
    nativeAssetContext: options?.nativeAssetContext !== undefined ? options.nativeAssetContext : toCustomNativeAssetContext(entry),
    addressContext: options?.addressContext || null,
  });

export const buildSuggestedRuntimeChainInterpretation = (entry: SuggestedChainSourceEntry): RuntimeChainInterpretation =>
  attachRuntimeChainCapabilityMatrix({
    source: 'suggested',
    runtimeStatus: 'partial',
    unsupportedReason: entry.persisted ? resolvePersistedSuggestedMetadataUnsupportedReason(entry.chainRecord) : 'suggested_chain_not_persisted',
    persisted: entry.persisted,
    chainId: entry.chainId,
    chainName: entry.chainName,
    rpc: entry.chainInfo?.rpc || entry.chainRecord.rpc || '',
    rest: entry.chainInfo?.rest || undefined,
    chainInfo: entry.chainInfo,
    nativeAssetContext: toSuggestedNativeAssetContext(entry),
    addressContext: toSuggestedAddressContext(entry),
  });

export const buildRuntimeChainInterpretation = (entry: ChainSourceEntry): RuntimeChainInterpretation => {
  switch (entry.source) {
    case 'builtin':
      return buildBuiltinRuntimeChainInterpretation(entry);
    case 'custom':
      return buildCustomRuntimeChainInterpretation(entry);
    case 'suggested':
      return buildSuggestedRuntimeChainInterpretation(entry);
  }
};

export const buildPersistedCustomRuntimeChainInterpretation = (
  entry: CustomChainSourceEntry,
  options?: {
    addressProjections?: Array<{
      chainId: string;
      address: string;
      path: string;
    }>;
  },
): RuntimeChainInterpretation => {
  const addressContext = resolvePersistedCustomChainAddressDerivationContext({
    chainRecord: entry.chainRecord,
    addressProjections: options?.addressProjections,
  });
  const nativeAssetContext = resolvePersistedCustomChainNativeAssetContext(entry.chainRecord);
  const rest = resolvePersistedCustomChainRestContext(entry.chainRecord);
  const gasPriceStep = resolvePersistedCustomChainGasPriceStep(entry.chainRecord);
  const chainInfo = buildPersistedCustomChainInfo({
    entry,
    addressContext,
    nativeAssetContext,
    gasPriceStep,
    rest,
  });

  return buildCustomRuntimeChainInterpretation(entry, {
    addressContext,
    nativeAssetContext,
    rest,
    chainInfo,
  });
};
