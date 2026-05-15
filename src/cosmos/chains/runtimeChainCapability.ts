import type { CosmosChainInfo } from './chain-registry';
import type { ChainSourceKind } from './chainSourceAdapter';
import { canSelectivelyUpgradeCustomChainHydrationContext } from './customChainRuntimePolicy';

export type RuntimeChainStatus = 'supported' | 'partial' | 'unsupported';

export type RuntimeUnsupportedReason =
  | 'custom_chain_missing_runtime_metadata'
  | 'suggested_chain_not_persisted'
  | 'missing_hydration_context'
  | 'missing_address_context'
  | 'missing_native_asset_context'
  | 'missing_rpc_context'
  | 'missing_rest_context'
  | 'missing_runtime_transport'
  | 'missing_address_metadata'
  | 'missing_native_asset_metadata'
  | 'missing_query_context'
  | 'missing_send_context'
  | 'not_persisted_runtime_candidate';

export type NativeAssetContext = {
  symbol: string;
  minimalDenom: string;
  decimals: number;
};

export type AddressBech32Context = {
  bech32Prefix: string;
  coinType: number;
};

export type RuntimeChainCapability = 'addressDerivation' | 'nativeAssetContext' | 'sendFlowContext' | 'queryContext' | 'approvalDisplayContext' | 'hydrationContext';

export type RuntimeDisplayOnlyCapability = 'approvalDisplayContext';

export type RuntimeSelectivePartialCapability = 'addressDerivation' | 'nativeAssetContext' | 'hydrationContext';

export type RuntimeExecutableCapability = 'sendFlowContext' | 'queryContext';

export type RuntimeCapabilityContractKind = 'display-only' | 'selective-partial' | 'runtime-executable';

export type RuntimeProviderAccountReadPreconditions = {
  stableChainId: boolean;
  stableBech32Prefix: boolean;
  stableCoinType: boolean;
};

export type RuntimeProviderSignDirectPreconditions = RuntimeProviderAccountReadPreconditions;

export type RuntimeProviderSignAminoPreconditions = RuntimeProviderAccountReadPreconditions;

export type RuntimeProviderSignArbitraryPreconditions = RuntimeProviderAccountReadPreconditions;

export type RuntimeProviderSendTxPreconditions = {
  stableChainId: boolean;
  validRpc: boolean;
};

export type RuntimeExecutablePreconditions = {
  stableChainId: boolean;
  validRpc: boolean;
  validRest: boolean;
  stableBech32Prefix: boolean;
  stableCoinType: boolean;
  stableNativeAssetMetadata: boolean;
  minimalGasFeeContext: boolean;
};

export type RuntimeChainCapabilitySupport = {
  supported: boolean;
  unsupportedReason?: RuntimeUnsupportedReason;
  contractKind: RuntimeCapabilityContractKind;
  preconditions?: RuntimeExecutablePreconditions;
};

export type RuntimeExecutableCapabilityResult = {
  capability: RuntimeExecutableCapability;
  supported: boolean;
  unsupportedReason?: RuntimeUnsupportedReason;
  contractKind: 'runtime-executable';
  preconditions: RuntimeExecutablePreconditions;
};

export type RuntimeProviderAccountReadResult = {
  supported: boolean;
  unsupportedReason?: RuntimeUnsupportedReason;
  contractKind: 'runtime-executable';
  preconditions: RuntimeProviderAccountReadPreconditions;
};

export type RuntimeProviderSignDirectResult = RuntimeProviderAccountReadResult;

export type RuntimeProviderSignAminoResult = RuntimeProviderAccountReadResult;

export type RuntimeProviderSignArbitraryResult = RuntimeProviderAccountReadResult;

export type RuntimeProviderSendTxResult = {
  supported: boolean;
  unsupportedReason?: RuntimeUnsupportedReason;
  contractKind: 'runtime-executable';
  preconditions: RuntimeProviderSendTxPreconditions;
};

export type RuntimeChainCapabilityMatrix = Record<RuntimeChainCapability, RuntimeChainCapabilitySupport>;

export type RuntimeChainInterpretation = {
  source: ChainSourceKind;
  runtimeStatus: RuntimeChainStatus;
  unsupportedReason?: RuntimeUnsupportedReason;
  persisted: boolean;
  chainId: string;
  chainName: string;
  rpc: string;
  rest?: string;
  chainInfo?: CosmosChainInfo;
  nativeAssetContext: NativeAssetContext | null;
  addressContext: AddressBech32Context | null;
  capabilityMatrix: RuntimeChainCapabilityMatrix;
};

export type RuntimeUnsupportedDetails = {
  source: ChainSourceKind;
  persisted: boolean;
  runtimeStatus: RuntimeChainStatus;
  unsupportedReason: RuntimeUnsupportedReason;
};

export type RuntimeUnsupportedError = Error & {
  data?: RuntimeUnsupportedDetails;
  runtimeUnsupported?: RuntimeUnsupportedDetails;
};

type RuntimeUnsupportedEntrySeed = {
  source?: ChainSourceKind;
  persisted?: boolean;
  runtimeStatus?: RuntimeChainStatus;
  unsupportedReason?: RuntimeUnsupportedReason;
};

export const RUNTIME_CHAIN_CAPABILITY_CONTRACT: Record<RuntimeChainCapability, RuntimeCapabilityContractKind> = {
  addressDerivation: 'selective-partial',
  nativeAssetContext: 'selective-partial',
  hydrationContext: 'selective-partial',
  approvalDisplayContext: 'display-only',
  sendFlowContext: 'runtime-executable',
  queryContext: 'runtime-executable',
};

const RUNTIME_CHAIN_ID_PATTERN = /^[^\s]+$/;
const RPC_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:']);
const REST_PROTOCOLS = new Set(['http:', 'https:']);

const isFiniteNonNegativeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && Math.trunc(value) === value;

const hasStableRuntimeChainId = (chainId: string) => RUNTIME_CHAIN_ID_PATTERN.test((chainId || '').trim());

const hasValidRuntimeUrl = (value: string | undefined, protocols: Set<string>) => {
  const normalized = (value || '').trim();
  if (!normalized) {
    return false;
  }
  try {
    const parsed = new URL(normalized);
    return protocols.has(parsed.protocol);
  } catch {
    return false;
  }
};

const hasStableBech32Prefix = (addressContext: AddressBech32Context | null | undefined) => !!(addressContext?.bech32Prefix || '').trim();

const hasStableCoinType = (addressContext: AddressBech32Context | null | undefined) => isFiniteNonNegativeInteger(addressContext?.coinType);

const hasStableNativeAssetMetadata = (nativeAssetContext: NativeAssetContext | null | undefined) => {
  return !!(nativeAssetContext?.symbol || '').trim() && !!(nativeAssetContext?.minimalDenom || '').trim() && isFiniteNonNegativeInteger(nativeAssetContext?.decimals);
};

const hasMinimalGasFeeContext = (interpretation: Pick<RuntimeChainInterpretation, 'chainInfo' | 'nativeAssetContext'>) => {
  if (!hasStableNativeAssetMetadata(interpretation.nativeAssetContext)) {
    return false;
  }
  const gasPriceAverage = interpretation.chainInfo?.feeCurrencies?.[0]?.gasPriceStep?.average;
  return typeof gasPriceAverage === 'number' && Number.isFinite(gasPriceAverage) && gasPriceAverage > 0;
};

export const buildRuntimeExecutablePreconditions = (interpretation: Pick<RuntimeChainInterpretation, 'chainId' | 'rpc' | 'rest' | 'addressContext' | 'nativeAssetContext' | 'chainInfo'>): RuntimeExecutablePreconditions => ({
  stableChainId: hasStableRuntimeChainId(interpretation.chainId),
  validRpc: hasValidRuntimeUrl(interpretation.rpc, RPC_PROTOCOLS),
  validRest: hasValidRuntimeUrl(interpretation.rest, REST_PROTOCOLS),
  stableBech32Prefix: hasStableBech32Prefix(interpretation.addressContext),
  stableCoinType: hasStableCoinType(interpretation.addressContext),
  stableNativeAssetMetadata: hasStableNativeAssetMetadata(interpretation.nativeAssetContext),
  minimalGasFeeContext: hasMinimalGasFeeContext(interpretation),
});

export const buildRuntimeProviderAccountReadPreconditions = (interpretation: Pick<RuntimeChainInterpretation, 'chainId' | 'addressContext'>): RuntimeProviderAccountReadPreconditions => {
  const executablePreconditions = buildRuntimeExecutablePreconditions({
    ...interpretation,
    rpc: '',
    rest: '',
    nativeAssetContext: null,
    chainInfo: undefined,
  });
  return {
    stableChainId: executablePreconditions.stableChainId,
    stableBech32Prefix: executablePreconditions.stableBech32Prefix,
    stableCoinType: executablePreconditions.stableCoinType,
  };
};

export const buildRuntimeProviderSignDirectPreconditions = buildRuntimeProviderAccountReadPreconditions;

export const buildRuntimeProviderSignAminoPreconditions = buildRuntimeProviderAccountReadPreconditions;

export const buildRuntimeProviderSignArbitraryPreconditions = buildRuntimeProviderAccountReadPreconditions;

export const buildRuntimeProviderSendTxPreconditions = (interpretation: Pick<RuntimeChainInterpretation, 'chainId' | 'rpc'>): RuntimeProviderSendTxPreconditions => {
  const executablePreconditions = buildRuntimeExecutablePreconditions({
    ...interpretation,
    rest: '',
    addressContext: null,
    nativeAssetContext: null,
    chainInfo: undefined,
  });
  return {
    stableChainId: executablePreconditions.stableChainId,
    validRpc: executablePreconditions.validRpc,
  };
};

const hasSatisfiedRuntimeProviderAccountReadPreconditions = (preconditions: RuntimeProviderAccountReadPreconditions) => preconditions.stableChainId && preconditions.stableBech32Prefix && preconditions.stableCoinType;

const hasSatisfiedRuntimeProviderSendTxPreconditions = (preconditions: RuntimeProviderSendTxPreconditions) => preconditions.stableChainId && preconditions.validRpc;

const hasSatisfiedRuntimeQueryPreconditions = (preconditions: RuntimeExecutablePreconditions) =>
  preconditions.stableChainId && preconditions.validRpc && preconditions.validRest && preconditions.stableBech32Prefix && preconditions.stableCoinType && preconditions.stableNativeAssetMetadata;

const hasSatisfiedRuntimeSendPreconditions = (preconditions: RuntimeExecutablePreconditions) =>
  preconditions.stableChainId && preconditions.validRpc && preconditions.stableBech32Prefix && preconditions.stableCoinType && preconditions.stableNativeAssetMetadata && preconditions.minimalGasFeeContext;

const supportedCapability = (contractKind: RuntimeCapabilityContractKind, preconditions?: RuntimeExecutablePreconditions): RuntimeChainCapabilitySupport => ({
  supported: true,
  contractKind,
  ...(preconditions ? { preconditions } : {}),
});

const unsupportedCapability = (contractKind: RuntimeCapabilityContractKind, unsupportedReason: RuntimeUnsupportedReason, preconditions?: RuntimeExecutablePreconditions): RuntimeChainCapabilitySupport => ({
  supported: false,
  unsupportedReason,
  contractKind,
  ...(preconditions ? { preconditions } : {}),
});

const isRuntimeUnsupportedDetails = (value: unknown): value is RuntimeUnsupportedDetails => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.source === 'string' && typeof record.persisted === 'boolean' && typeof record.runtimeStatus === 'string' && typeof record.unsupportedReason === 'string';
};

export const buildRuntimeUnsupportedDetails = (interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'runtimeStatus'>, unsupportedReason: RuntimeUnsupportedReason): RuntimeUnsupportedDetails => ({
  source: interpretation.source,
  persisted: interpretation.persisted,
  runtimeStatus: interpretation.runtimeStatus,
  unsupportedReason,
});

const resolveRuntimeUnsupportedEntryReason = ({ source, persisted, unsupportedReason }: Pick<RuntimeUnsupportedEntrySeed, 'source' | 'persisted' | 'unsupportedReason'>): RuntimeUnsupportedReason => {
  if (unsupportedReason) {
    return unsupportedReason;
  }
  if (source === 'custom' && persisted) {
    return 'custom_chain_missing_runtime_metadata';
  }
  if (source === 'suggested' && !persisted) {
    return 'suggested_chain_not_persisted';
  }
  if (source === 'suggested' && persisted) {
    return 'missing_runtime_transport';
  }
  if (source === 'builtin') {
    return 'missing_runtime_transport';
  }
  return 'not_persisted_runtime_candidate';
};

export const buildRuntimeUnsupportedEntryDetails = ({ source, persisted, runtimeStatus, unsupportedReason }: RuntimeUnsupportedEntrySeed = {}): RuntimeUnsupportedDetails => ({
  source: source || 'custom',
  persisted: persisted ?? false,
  runtimeStatus: runtimeStatus || 'unsupported',
  unsupportedReason: resolveRuntimeUnsupportedEntryReason({
    source,
    persisted,
    unsupportedReason,
  }),
});

export const buildRuntimeUnsupportedEntryError = ({
  message,
  source,
  persisted,
  runtimeStatus,
  unsupportedReason,
}: RuntimeUnsupportedEntrySeed & {
  message: string;
}): RuntimeUnsupportedError => {
  const details = buildRuntimeUnsupportedEntryDetails({
    source,
    persisted,
    runtimeStatus,
    unsupportedReason,
  });
  const error = new Error(message) as RuntimeUnsupportedError;
  error.data = details;
  error.runtimeUnsupported = details;
  return error;
};

export const getRuntimeUnsupportedErrorData = (error: unknown): RuntimeUnsupportedDetails | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const record = error as Record<string, unknown>;
  const runtimeUnsupported = record.runtimeUnsupported;
  if (isRuntimeUnsupportedDetails(runtimeUnsupported)) {
    return runtimeUnsupported;
  }
  const data = record.data;
  if (isRuntimeUnsupportedDetails(data)) {
    return data;
  }
  return undefined;
};

const buildRuntimeCapabilityError = (
  interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'runtimeStatus' | 'chainId' | 'unsupportedReason' | 'capabilityMatrix'>,
  capability: string,
  fallbackReason: RuntimeUnsupportedReason,
) => {
  const reason = fallbackReason || resolveRuntimeCapabilityUnsupportedReason(interpretation, fallbackReason);
  const details = buildRuntimeUnsupportedDetails(interpretation, reason);
  const error = new Error(`Chain "${interpretation.chainId}" cannot be used for ${capability}: ${reason}`) as RuntimeUnsupportedError;
  error.data = details;
  error.runtimeUnsupported = details;
  return error;
};

const resolveBaseUnsupportedReason = (interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'unsupportedReason'>) => {
  if (interpretation.unsupportedReason) {
    return interpretation.unsupportedReason;
  }
  if (interpretation.source !== 'builtin' && !interpretation.persisted) {
    return 'not_persisted_runtime_candidate';
  }
  if (interpretation.source === 'suggested') {
    return 'suggested_chain_not_persisted';
  }
  if (interpretation.source === 'custom') {
    return 'custom_chain_missing_runtime_metadata';
  }
  return 'missing_rpc_context';
};

const resolveContextReason = (interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'unsupportedReason'>, fallbackReason: RuntimeUnsupportedReason) => {
  if (interpretation.source === 'builtin') {
    return fallbackReason;
  }
  return resolveBaseUnsupportedReason(interpretation);
};

export const resolveRuntimeExecutableUnsupportedReason = (
  interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'runtimeStatus' | 'unsupportedReason'>,
  capability: RuntimeExecutableCapability,
  preconditions: RuntimeExecutablePreconditions,
): RuntimeUnsupportedReason => {
  if (interpretation.source !== 'builtin' && !interpretation.persisted) {
    return 'not_persisted_runtime_candidate';
  }
  if (!preconditions.stableChainId || !preconditions.validRpc || (capability === 'queryContext' && !preconditions.validRest)) {
    return 'missing_runtime_transport';
  }
  if (!preconditions.stableBech32Prefix || !preconditions.stableCoinType) {
    return 'missing_address_metadata';
  }
  if (!preconditions.stableNativeAssetMetadata) {
    return 'missing_native_asset_metadata';
  }
  if (capability === 'queryContext') {
    return 'missing_query_context';
  }
  if (interpretation.source === 'builtin' && interpretation.runtimeStatus !== 'supported') {
    return 'missing_send_context';
  }
  if (!preconditions.minimalGasFeeContext) {
    return 'missing_send_context';
  }
  return 'missing_send_context';
};

export const resolveRuntimeProviderAccountReadUnsupportedReason = (
  interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'unsupportedReason'>,
  preconditions: RuntimeProviderAccountReadPreconditions,
): RuntimeUnsupportedReason => {
  if (interpretation.source !== 'builtin' && !interpretation.persisted) {
    return 'not_persisted_runtime_candidate';
  }
  if (!preconditions.stableChainId) {
    if (interpretation.source === 'suggested' && interpretation.persisted) {
      return 'missing_address_context';
    }
    return resolveBaseUnsupportedReason(interpretation);
  }
  if (!preconditions.stableBech32Prefix || !preconditions.stableCoinType) {
    return 'missing_address_metadata';
  }
  return resolveContextReason(interpretation, 'missing_address_context');
};

export const resolveRuntimeProviderSignDirectUnsupportedReason = resolveRuntimeProviderAccountReadUnsupportedReason;

export const resolveRuntimeProviderSignAminoUnsupportedReason = resolveRuntimeProviderAccountReadUnsupportedReason;

export const resolveRuntimeProviderSignArbitraryUnsupportedReason = resolveRuntimeProviderAccountReadUnsupportedReason;

export const resolveRuntimeProviderSendTxUnsupportedReason = (interpretation: Pick<RuntimeChainInterpretation, 'source' | 'persisted' | 'unsupportedReason'>, preconditions: RuntimeProviderSendTxPreconditions): RuntimeUnsupportedReason => {
  if (interpretation.source !== 'builtin' && !interpretation.persisted) {
    return 'not_persisted_runtime_candidate';
  }
  if (!preconditions.stableChainId || !preconditions.validRpc) {
    return 'missing_runtime_transport';
  }
  return resolveContextReason(interpretation, 'missing_rpc_context');
};

const buildRuntimeSendCapabilitySupport = (interpretation: Omit<RuntimeChainInterpretation, 'capabilityMatrix'>): RuntimeChainCapabilitySupport => {
  const preconditions = buildRuntimeExecutablePreconditions(interpretation);
  const supported =
    (interpretation.source === 'builtin' && interpretation.runtimeStatus === 'supported' && hasSatisfiedRuntimeSendPreconditions(preconditions)) ||
    (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeSendPreconditions(preconditions)) ||
    (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeSendPreconditions(preconditions));
  if (supported) {
    return supportedCapability('runtime-executable', preconditions);
  }
  return unsupportedCapability('runtime-executable', resolveRuntimeExecutableUnsupportedReason(interpretation, 'sendFlowContext', preconditions), preconditions);
};

const buildRuntimeQueryCapabilitySupport = (interpretation: Omit<RuntimeChainInterpretation, 'capabilityMatrix'>): RuntimeChainCapabilitySupport => {
  const preconditions = buildRuntimeExecutablePreconditions(interpretation);
  const supported =
    (interpretation.source === 'builtin' && interpretation.runtimeStatus === 'supported' && hasSatisfiedRuntimeQueryPreconditions(preconditions)) ||
    (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeQueryPreconditions(preconditions)) ||
    (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeQueryPreconditions(preconditions));
  if (supported) {
    return supportedCapability('runtime-executable', preconditions);
  }
  return unsupportedCapability('runtime-executable', resolveRuntimeExecutableUnsupportedReason(interpretation, 'queryContext', preconditions), preconditions);
};

export const buildRuntimeChainCapabilityMatrix = (interpretation: Omit<RuntimeChainInterpretation, 'capabilityMatrix'>): RuntimeChainCapabilityMatrix => {
  const hasAddressContext = !!interpretation.addressContext;
  const hasNativeAssetContext = !!interpretation.nativeAssetContext;
  const supportsDisplay = !!interpretation.chainId && !!interpretation.chainName;
  const supportsHydration = interpretation.source === 'builtin' ? !!interpretation.chainId : interpretation.source === 'custom' ? canSelectivelyUpgradeCustomChainHydrationContext(interpretation) : false;

  return {
    addressDerivation: hasAddressContext ? supportedCapability('selective-partial') : unsupportedCapability('selective-partial', resolveContextReason(interpretation, 'missing_address_context')),
    nativeAssetContext: hasNativeAssetContext ? supportedCapability('selective-partial') : unsupportedCapability('selective-partial', resolveContextReason(interpretation, 'missing_native_asset_context')),
    sendFlowContext: buildRuntimeSendCapabilitySupport(interpretation),
    queryContext: buildRuntimeQueryCapabilitySupport(interpretation),
    approvalDisplayContext: supportsDisplay ? supportedCapability('display-only') : unsupportedCapability('display-only', resolveBaseUnsupportedReason(interpretation)),
    hydrationContext: supportsHydration ? supportedCapability('selective-partial') : unsupportedCapability('selective-partial', resolveContextReason(interpretation, 'missing_hydration_context')),
  };
};

export const attachRuntimeChainCapabilityMatrix = (interpretation: Omit<RuntimeChainInterpretation, 'capabilityMatrix'>): RuntimeChainInterpretation => ({
  ...interpretation,
  capabilityMatrix: buildRuntimeChainCapabilityMatrix(interpretation),
});

export const resolveRuntimeCapabilityUnsupportedReason = (interpretation: Pick<RuntimeChainInterpretation, 'capabilityMatrix' | 'unsupportedReason'>, fallbackReason: RuntimeUnsupportedReason) => {
  if (interpretation.unsupportedReason) {
    return interpretation.unsupportedReason;
  }
  const firstUnsupported = Object.values(interpretation.capabilityMatrix).find((capability) => !capability.supported && capability.unsupportedReason);
  return firstUnsupported?.unsupportedReason || fallbackReason;
};

export const getRuntimeCapabilityContractKind = (capability: RuntimeChainCapability) => RUNTIME_CHAIN_CAPABILITY_CONTRACT[capability];

export const getRuntimeChainCapabilityResult = (interpretation: RuntimeChainInterpretation, capability: RuntimeChainCapability): RuntimeChainCapabilitySupport => interpretation.capabilityMatrix[capability];

export const getRuntimeExecutableCapabilityResult = (interpretation: RuntimeChainInterpretation, capability: RuntimeExecutableCapability): RuntimeExecutableCapabilityResult => {
  const support = getRuntimeChainCapabilityResult(interpretation, capability);
  return {
    capability,
    supported: support.supported,
    unsupportedReason: support.unsupportedReason,
    contractKind: 'runtime-executable',
    preconditions: support.preconditions || buildRuntimeExecutablePreconditions(interpretation),
  };
};

export const getRuntimeProviderAccountReadResult = (interpretation: RuntimeChainInterpretation): RuntimeProviderAccountReadResult => {
  const preconditions = buildRuntimeProviderAccountReadPreconditions(interpretation);
  const addressSupport = getRuntimeChainCapabilityResult(interpretation, 'addressDerivation');
  const supported =
    addressSupport.supported &&
    ((interpretation.source === 'builtin' && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)));

  if (supported) {
    return {
      supported: true,
      contractKind: 'runtime-executable',
      preconditions,
    };
  }

  return {
    supported: false,
    unsupportedReason: addressSupport.unsupportedReason || resolveRuntimeProviderAccountReadUnsupportedReason(interpretation, preconditions),
    contractKind: 'runtime-executable',
    preconditions,
  };
};

export const getRuntimeProviderSignDirectResult = (interpretation: RuntimeChainInterpretation): RuntimeProviderSignDirectResult => {
  const preconditions = buildRuntimeProviderSignDirectPreconditions(interpretation);
  const addressSupport = getRuntimeChainCapabilityResult(interpretation, 'addressDerivation');
  const supported =
    addressSupport.supported &&
    ((interpretation.source === 'builtin' && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)));

  if (supported) {
    return {
      supported: true,
      contractKind: 'runtime-executable',
      preconditions,
    };
  }

  return {
    supported: false,
    unsupportedReason: addressSupport.unsupportedReason || resolveRuntimeProviderSignDirectUnsupportedReason(interpretation, preconditions),
    contractKind: 'runtime-executable',
    preconditions,
  };
};

export const getRuntimeProviderSignAminoResult = (interpretation: RuntimeChainInterpretation): RuntimeProviderSignAminoResult => {
  const preconditions = buildRuntimeProviderSignAminoPreconditions(interpretation);
  const addressSupport = getRuntimeChainCapabilityResult(interpretation, 'addressDerivation');
  const supported =
    addressSupport.supported &&
    ((interpretation.source === 'builtin' && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)));

  if (supported) {
    return {
      supported: true,
      contractKind: 'runtime-executable',
      preconditions,
    };
  }

  return {
    supported: false,
    unsupportedReason: addressSupport.unsupportedReason || resolveRuntimeProviderSignAminoUnsupportedReason(interpretation, preconditions),
    contractKind: 'runtime-executable',
    preconditions,
  };
};

export const getRuntimeProviderSignArbitraryResult = (interpretation: RuntimeChainInterpretation): RuntimeProviderSignArbitraryResult => {
  const preconditions = buildRuntimeProviderSignArbitraryPreconditions(interpretation);
  const addressSupport = getRuntimeChainCapabilityResult(interpretation, 'addressDerivation');
  const supported =
    addressSupport.supported &&
    ((interpretation.source === 'builtin' && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)) ||
      (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeProviderAccountReadPreconditions(preconditions)));

  if (supported) {
    return {
      supported: true,
      contractKind: 'runtime-executable',
      preconditions,
    };
  }

  return {
    supported: false,
    unsupportedReason: addressSupport.unsupportedReason || resolveRuntimeProviderSignArbitraryUnsupportedReason(interpretation, preconditions),
    contractKind: 'runtime-executable',
    preconditions,
  };
};

export const getRuntimeProviderSendTxResult = (interpretation: RuntimeChainInterpretation): RuntimeProviderSendTxResult => {
  const preconditions = buildRuntimeProviderSendTxPreconditions(interpretation);
  const supported =
    (interpretation.source === 'builtin' && hasSatisfiedRuntimeProviderSendTxPreconditions(preconditions)) ||
    (interpretation.source === 'custom' && interpretation.persisted && hasSatisfiedRuntimeProviderSendTxPreconditions(preconditions)) ||
    (interpretation.source === 'suggested' && interpretation.persisted && hasSatisfiedRuntimeProviderSendTxPreconditions(preconditions));

  if (supported) {
    return {
      supported: true,
      contractKind: 'runtime-executable',
      preconditions,
    };
  }

  return {
    supported: false,
    unsupportedReason: resolveRuntimeProviderSendTxUnsupportedReason(interpretation, preconditions),
    contractKind: 'runtime-executable',
    preconditions,
  };
};

export const hasRuntimeChainCapability = (interpretation: RuntimeChainInterpretation | null | undefined, capability: RuntimeChainCapability) => !!interpretation && getRuntimeChainCapabilityResult(interpretation, capability).supported;

export const ensureRuntimeChainCapability = (interpretation: RuntimeChainInterpretation, capability: RuntimeChainCapability, usageLabel: string, fallbackReason: RuntimeUnsupportedReason) => {
  const support = getRuntimeChainCapabilityResult(interpretation, capability);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, usageLabel, support.unsupportedReason || fallbackReason);
  }
  return interpretation;
};

export const ensureRuntimeExecutableCapability = (interpretation: RuntimeChainInterpretation, capability: RuntimeExecutableCapability, usageLabel: string, fallbackReason: RuntimeUnsupportedReason) => {
  const support = getRuntimeExecutableCapabilityResult(interpretation, capability);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, usageLabel, support.unsupportedReason || fallbackReason);
  }
  return interpretation;
};

export const ensureRuntimeChainSupported = (interpretation: RuntimeChainInterpretation, capability: string = 'runtime access'): RuntimeChainInterpretation => {
  if (interpretation.runtimeStatus !== 'supported') {
    throw buildRuntimeCapabilityError(interpretation, capability, interpretation.unsupportedReason || 'missing_rpc_context');
  }
  return interpretation;
};

export const ensureRuntimeChainHydrationContext = (interpretation: RuntimeChainInterpretation, capability: string = 'wallet hydration'): RuntimeChainInterpretation =>
  ensureRuntimeChainCapability(interpretation, 'hydrationContext', capability, interpretation.unsupportedReason || 'missing_hydration_context');

export const ensureRuntimeChainApprovalDisplayContext = (interpretation: RuntimeChainInterpretation, capability: string = 'approval display'): RuntimeChainInterpretation =>
  ensureRuntimeChainCapability(interpretation, 'approvalDisplayContext', capability, interpretation.unsupportedReason || 'missing_address_context');

export const ensureRuntimeExecutableSendFlowContext = (interpretation: RuntimeChainInterpretation, capability: string = 'send flow'): RuntimeChainInterpretation =>
  ensureRuntimeExecutableCapability(interpretation, 'sendFlowContext', capability, 'missing_send_context');

export const ensureRuntimeExecutableQueryContext = (interpretation: RuntimeChainInterpretation, capability: string = 'query access'): RuntimeChainInterpretation =>
  ensureRuntimeExecutableCapability(interpretation, 'queryContext', capability, 'missing_query_context');

export const ensureRuntimeProviderAccountReadContext = (interpretation: RuntimeChainInterpretation, capability: string = 'provider account read'): RuntimeChainInterpretation => {
  const support = getRuntimeProviderAccountReadResult(interpretation);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, capability, support.unsupportedReason || 'missing_address_context');
  }
  return interpretation;
};

export const ensureRuntimeProviderSignDirectContext = (interpretation: RuntimeChainInterpretation, capability: string = 'provider signDirect'): RuntimeChainInterpretation => {
  const support = getRuntimeProviderSignDirectResult(interpretation);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, capability, support.unsupportedReason || 'missing_address_context');
  }
  return interpretation;
};

export const ensureRuntimeProviderSignAminoContext = (interpretation: RuntimeChainInterpretation, capability: string = 'provider signAmino'): RuntimeChainInterpretation => {
  const support = getRuntimeProviderSignAminoResult(interpretation);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, capability, support.unsupportedReason || 'missing_address_context');
  }
  return interpretation;
};

export const ensureRuntimeProviderSignArbitraryContext = (interpretation: RuntimeChainInterpretation, capability: string = 'provider signArbitrary'): RuntimeChainInterpretation => {
  const support = getRuntimeProviderSignArbitraryResult(interpretation);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, capability, support.unsupportedReason || 'missing_address_context');
  }
  return interpretation;
};

export const ensureRuntimeProviderSendTxContext = (interpretation: RuntimeChainInterpretation, capability: string = 'provider sendTx'): RuntimeChainInterpretation => {
  const support = getRuntimeProviderSendTxResult(interpretation);
  if (!support.supported) {
    throw buildRuntimeCapabilityError(interpretation, capability, support.unsupportedReason || 'missing_runtime_transport');
  }
  return interpretation;
};

export const ensureRuntimeChainSendFlowContext = ensureRuntimeExecutableSendFlowContext;

export const ensureRuntimeChainQueryContext = ensureRuntimeExecutableQueryContext;

export const ensureRuntimeChainAddressContext = (interpretation: RuntimeChainInterpretation, capability: string = 'address resolution'): AddressBech32Context => {
  ensureRuntimeChainCapability(interpretation, 'addressDerivation', capability, 'missing_address_context');
  if (!interpretation.addressContext) {
    throw buildRuntimeCapabilityError(interpretation, capability, 'missing_address_context');
  }
  return interpretation.addressContext;
};

export const ensureRuntimeChainNativeAssetContext = (interpretation: RuntimeChainInterpretation, capability: string = 'native asset access'): NativeAssetContext => {
  ensureRuntimeChainCapability(interpretation, 'nativeAssetContext', capability, 'missing_native_asset_context');
  if (!interpretation.nativeAssetContext) {
    throw buildRuntimeCapabilityError(interpretation, capability, 'missing_native_asset_context');
  }
  return interpretation.nativeAssetContext;
};

export const ensureRuntimeChainRpcContext = (interpretation: RuntimeChainInterpretation, capability: string = 'RPC access'): string => {
  const rpc = (interpretation.rpc || '').trim();
  if (!rpc) {
    throw buildRuntimeCapabilityError(interpretation, capability, 'missing_rpc_context');
  }
  return rpc;
};

export const ensureRuntimeChainRestContext = (interpretation: RuntimeChainInterpretation, capability: string = 'REST access'): string => {
  const rest = (interpretation.rest || '').trim();
  if (!rest) {
    throw buildRuntimeCapabilityError(interpretation, capability, 'missing_rest_context');
  }
  return rest;
};
