import { fromBech32 } from '@cosmjs/encoding';
import type { Address, Chain } from '@/cosmos/storage';
import type { AddressBech32Context, NativeAssetContext, RuntimeChainInterpretation } from './runtimeChainCapability';
import type { GasPriceStep } from './chain-registry';

type PersistedCustomChainRecord = Pick<Chain, 'chainId' | 'rpc' | 'type' | 'token' | 'symbol' | 'decimals'>;

type PersistedAddressProjection = Pick<Address, 'chainId' | 'address' | 'path'>;

const CUSTOM_CHAIN_ID_PATTERN = /^[^\s]+$/;
const HD_PATH_COIN_TYPE_PATTERN = /^m\/44'\/(\d+)'\/0'\/0\/\d+$/i;
const SUPPORTED_RPC_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:']);
const SUPPORTED_REST_PROTOCOLS = new Set(['http:', 'https:']);

const toFiniteInteger = (value: unknown) => {
  const normalized = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(normalized) || normalized < 0) {
    return undefined;
  }
  return Math.trunc(normalized);
};

const toFinitePositiveNumber = (value: unknown) => {
  const normalized = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return undefined;
  }
  return normalized;
};

const hasValidCustomChainId = (chainId: string) => {
  return CUSTOM_CHAIN_ID_PATTERN.test((chainId || '').trim());
};

const hasValidCustomChainRpc = (rpc: string) => {
  const value = (rpc || '').trim();
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return SUPPORTED_RPC_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
};

const toValidCustomChainUrl = (value: unknown, protocols: Set<string>) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    return null;
  }
  try {
    const parsed = new URL(normalized);
    return protocols.has(parsed.protocol) ? normalized : null;
  } catch {
    return null;
  }
};

const hasValidPersistedCustomChainRuntime = (chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc'>) => {
  return hasValidCustomChainId(chainRecord.chainId || '') && hasValidCustomChainRpc(chainRecord.rpc || '');
};

const parseCustomChainTypeMetadata = (value: string) => {
  const normalized = (value || '').trim();
  if (!normalized.startsWith('{')) {
    return null;
  }
  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const hasPersistedCustomRuntimeMetadataEnvelope = (chainRecord: Pick<PersistedCustomChainRecord, 'type'>) => {
  const normalized = (chainRecord.type || '').trim();
  if (!normalized.startsWith('{')) {
    return true;
  }
  return !!parseCustomChainTypeMetadata(normalized);
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
};

const toValidGasPriceStep = (value: unknown): GasPriceStep | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const low = toFinitePositiveNumber(record.low);
  const average = toFinitePositiveNumber(record.average);
  const high = toFinitePositiveNumber(record.high);
  if (low === undefined || average === undefined || high === undefined) {
    return null;
  }
  return {
    low,
    average,
    high,
  };
};

const resolveGasPriceStepFromFeeCurrencies = (value: unknown) => {
  const feeCurrencies = Array.isArray(value) ? value : [];
  for (const entry of feeCurrencies) {
    const record = asRecord(entry);
    const gasPriceStep = toValidGasPriceStep(record?.gasPriceStep);
    if (gasPriceStep) {
      return gasPriceStep;
    }
  }
  return null;
};

const resolveRestAddressFromApis = (metadata: Record<string, unknown>) => {
  const apis = asRecord(metadata.apis);
  const restEntries = Array.isArray(apis?.rest) ? apis.rest : [];
  for (const entry of restEntries) {
    const record = asRecord(entry);
    const value = toValidCustomChainUrl(record?.address, SUPPORTED_REST_PROTOCOLS);
    if (value) {
      return value;
    }
  }
  return null;
};

const toValidAddressContext = (bech32Prefix: unknown, coinType: unknown): AddressBech32Context | null => {
  const normalizedPrefix = typeof bech32Prefix === 'string' ? bech32Prefix.trim() : '';
  const normalizedCoinType = toFiniteInteger(coinType);
  if (!normalizedPrefix || normalizedCoinType === undefined) {
    return null;
  }
  return {
    bech32Prefix: normalizedPrefix,
    coinType: normalizedCoinType,
  };
};

const toValidNativeAssetContext = ({ symbol, minimalDenom, decimals }: { symbol: unknown; minimalDenom: unknown; decimals: unknown }): NativeAssetContext | null => {
  const normalizedSymbol = typeof symbol === 'string' ? symbol.trim() : '';
  const normalizedMinimalDenom = typeof minimalDenom === 'string' ? minimalDenom.trim() : '';
  const normalizedDecimals = toFiniteInteger(decimals);
  if (!normalizedSymbol || !normalizedMinimalDenom || normalizedDecimals === undefined) {
    return null;
  }
  return {
    symbol: normalizedSymbol,
    minimalDenom: normalizedMinimalDenom,
    decimals: normalizedDecimals,
  };
};

const parseCoinTypeFromPath = (path: string) => {
  const match = (path || '').trim().match(HD_PATH_COIN_TYPE_PATTERN);
  return match ? toFiniteInteger(match[1]) : undefined;
};

const parseAddressProjectionContext = (addressProjection: PersistedAddressProjection): AddressBech32Context | null => {
  const coinType = parseCoinTypeFromPath(addressProjection.path || '');
  if (coinType === undefined) {
    return null;
  }
  try {
    const decoded = fromBech32((addressProjection.address || '').trim());
    return toValidAddressContext(decoded.prefix, coinType);
  } catch {
    return null;
  }
};

const hasStableDisplayRuntimeContext = (interpretation: Pick<RuntimeChainInterpretation, 'chainName'>) => {
  return !!(interpretation.chainName || '').trim();
};

export const canSelectivelyUpgradeCustomChainAddressDerivation = (chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc'>) => {
  return hasValidPersistedCustomChainRuntime(chainRecord);
};

export const resolvePersistedCustomChainAddressDerivationContext = ({
  chainRecord,
  addressProjections = [],
}: {
  chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc' | 'type'>;
  addressProjections?: PersistedAddressProjection[];
}): AddressBech32Context | null => {
  if (!canSelectivelyUpgradeCustomChainAddressDerivation(chainRecord)) {
    return null;
  }
  if (!hasPersistedCustomRuntimeMetadataEnvelope(chainRecord)) {
    return null;
  }

  const typeMetadata = parseCustomChainTypeMetadata(chainRecord.type || '');
  const typeMetadataContext = typeMetadata ? toValidAddressContext(typeMetadata.bech32Prefix, typeMetadata.coinType) : null;
  if (typeMetadataContext) {
    return typeMetadataContext;
  }

  for (const addressProjection of addressProjections) {
    if (addressProjection.chainId !== chainRecord.chainId) {
      continue;
    }
    const addressContext = parseAddressProjectionContext(addressProjection);
    if (addressContext) {
      return addressContext;
    }
  }

  return null;
};

export const canSelectivelyUpgradeCustomChainHydrationContext = (interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'chainId' | 'chainName' | 'rpc' | 'addressContext'>) => {
  if (interpretation.source !== 'custom' || !interpretation.persisted) {
    return false;
  }

  if (!hasValidPersistedCustomChainRuntime(interpretation)) {
    return false;
  }

  return !!interpretation.addressContext || hasStableDisplayRuntimeContext(interpretation);
};

export const canSelectivelyUpgradeCustomChainNativeAssetContext = (chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc'>) => {
  return hasValidPersistedCustomChainRuntime(chainRecord);
};

export const resolvePersistedCustomChainRestContext = (chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc' | 'type'>): string | null => {
  if (!hasValidPersistedCustomChainRuntime(chainRecord)) {
    return null;
  }
  if (!hasPersistedCustomRuntimeMetadataEnvelope(chainRecord)) {
    return null;
  }

  const typeMetadata = parseCustomChainTypeMetadata(chainRecord.type || '');
  if (!typeMetadata) {
    return null;
  }

  return (
    toValidCustomChainUrl(typeMetadata.rest, SUPPORTED_REST_PROTOCOLS) ||
    toValidCustomChainUrl(typeMetadata.restUrl, SUPPORTED_REST_PROTOCOLS) ||
    toValidCustomChainUrl(typeMetadata.api, SUPPORTED_REST_PROTOCOLS) ||
    toValidCustomChainUrl(typeMetadata.lcd, SUPPORTED_REST_PROTOCOLS) ||
    toValidCustomChainUrl(asRecord(typeMetadata.chainInfo)?.rest, SUPPORTED_REST_PROTOCOLS) ||
    resolveRestAddressFromApis(typeMetadata) ||
    null
  );
};

export const resolvePersistedCustomChainGasPriceStep = (chainRecord: Pick<PersistedCustomChainRecord, 'chainId' | 'rpc' | 'type'>): GasPriceStep | null => {
  if (!hasValidPersistedCustomChainRuntime(chainRecord)) {
    return null;
  }
  if (!hasPersistedCustomRuntimeMetadataEnvelope(chainRecord)) {
    return null;
  }

  const typeMetadata = parseCustomChainTypeMetadata(chainRecord.type || '');
  if (!typeMetadata) {
    return null;
  }

  return (
    toValidGasPriceStep(typeMetadata.gasPriceStep) ||
    toValidGasPriceStep(asRecord(typeMetadata.feeCurrency)?.gasPriceStep) ||
    resolveGasPriceStepFromFeeCurrencies(typeMetadata.feeCurrencies) ||
    toValidGasPriceStep(asRecord(typeMetadata.chainInfo)?.gasPriceStep) ||
    resolveGasPriceStepFromFeeCurrencies(asRecord(typeMetadata.chainInfo)?.feeCurrencies) ||
    null
  );
};

export const resolvePersistedCustomChainNativeAssetContext = (chainRecord: PersistedCustomChainRecord): NativeAssetContext | null => {
  if (!canSelectivelyUpgradeCustomChainNativeAssetContext(chainRecord)) {
    return null;
  }
  if (!hasPersistedCustomRuntimeMetadataEnvelope(chainRecord)) {
    return null;
  }

  const typeMetadata = parseCustomChainTypeMetadata(chainRecord.type || '');
  const typeMetadataContext = typeMetadata
    ? toValidNativeAssetContext({
        symbol: typeMetadata.coinDenom ?? typeMetadata.symbol,
        minimalDenom: typeMetadata.coinMinimalDenom ?? typeMetadata.minimalDenom ?? typeMetadata.token,
        decimals: typeMetadata.coinDecimals ?? typeMetadata.decimals,
      })
    : null;
  if (typeMetadataContext) {
    return typeMetadataContext;
  }

  return toValidNativeAssetContext({
    symbol: chainRecord.symbol,
    minimalDenom: chainRecord.token,
    decimals: chainRecord.decimals,
  });
};
