import { getChainByChainId } from '@/cosmos/storage';
import type { Chain } from '@/cosmos/storage';
import type { CosmosChainInfo, CosmosBech32Config, CosmosCurrency, CosmosFeeCurrencies } from './chain-registry';
import type { SuggestedChainSourceEntry } from './chainSourceAdapter';
import { buildCosmosBech32Config } from './chainMetadataAdapter';
import type { RuntimeUnsupportedReason } from './runtimeChainCapability';

const SUPPORTED_RPC_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:']);
const SUPPORTED_REST_PROTOCOLS = new Set(['http:', 'https:']);

const asRecord = (value: unknown): Record<string, unknown> | null => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null);

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toFiniteInteger = (value: unknown) => {
  const normalized = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(normalized)) {
    return undefined;
  }
  return Math.trunc(normalized);
};

const toFiniteNonNegativeInteger = (value: unknown) => {
  const normalized = toFiniteInteger(value);
  if (normalized === undefined || normalized < 0) {
    return undefined;
  }
  return normalized;
};

const hasValidRuntimeUrl = (value: string, protocols: Set<string>) => {
  const normalized = normalizeString(value);
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

const toCurrency = (value: unknown): CosmosCurrency | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const coinDenom = normalizeString(record.coinDenom);
  const coinMinimalDenom = normalizeString(record.coinMinimalDenom);
  const coinDecimals = toFiniteNonNegativeInteger(record.coinDecimals);
  if (!coinDenom || !coinMinimalDenom || coinDecimals === undefined) {
    return null;
  }
  return {
    coinDenom,
    coinMinimalDenom,
    coinDecimals,
  };
};

const toFeeCurrency = (value: unknown): CosmosFeeCurrencies | null => {
  const currency = toCurrency(value);
  if (!currency) {
    return null;
  }
  const record = asRecord(value);
  const gasPriceStep = asRecord(record?.gasPriceStep);
  const low = typeof gasPriceStep?.low === 'number' ? gasPriceStep.low : undefined;
  const average = typeof gasPriceStep?.average === 'number' ? gasPriceStep.average : undefined;
  const high = typeof gasPriceStep?.high === 'number' ? gasPriceStep.high : undefined;
  return {
    ...currency,
    ...(low !== undefined && average !== undefined && high !== undefined
      ? {
          gasPriceStep: {
            low,
            average,
            high,
          },
        }
      : {}),
  };
};

const toBech32Config = (value: unknown): CosmosBech32Config => {
  const record = asRecord(value);
  const prefix = normalizeString(record?.bech32PrefixAccAddr);
  if (!prefix) {
    return {
      bech32PrefixAccAddr: '',
      bech32PrefixAccPub: '',
      bech32PrefixValAddr: '',
      bech32PrefixValPub: '',
      bech32PrefixConsAddr: '',
      bech32PrefixConsPub: '',
    };
  }
  return buildCosmosBech32Config(prefix);
};

const parseSuggestedChainTypeMetadata = (value: string) => {
  const normalized = normalizeString(value);
  if (!normalized.startsWith('{')) {
    return null;
  }
  try {
    const parsed = JSON.parse(normalized) as Record<string, unknown>;
    const source = normalizeString(parsed.runtimeSource) || normalizeString(parsed.source);
    return source === 'suggested' ? parsed : null;
  } catch {
    return null;
  }
};

const hasSuggestedRuntimeSourceMarker = (value: string) => {
  const normalized = normalizeString(value);
  if (!normalized.startsWith('{')) {
    return false;
  }
  return /"(?:runtimeSource|source)"\s*:\s*"suggested"/.test(normalized);
};

export const hasPersistedSuggestedMetadataEnvelope = (chain: Pick<Chain, 'type'>) => {
  const normalized = normalizeString(chain.type);
  if (!normalized.startsWith('{')) {
    return false;
  }
  return !!parseSuggestedChainTypeMetadata(normalized) || hasSuggestedRuntimeSourceMarker(normalized);
};

const toChainRecordCurrency = (chain: Chain): CosmosCurrency | null =>
  toCurrency({
    coinDenom: chain.symbol,
    coinMinimalDenom: chain.token,
    coinDecimals: chain.decimals,
  });

const buildFallbackStakeCurrency = (chain: Chain): CosmosCurrency =>
  toChainRecordCurrency(chain) || {
    coinDenom: normalizeString(chain.symbol),
    coinMinimalDenom: normalizeString(chain.token),
    coinDecimals: toFiniteInteger(chain.decimals) ?? -1,
  };

const buildPersistedSuggestedChainInfo = (chain: Chain, metadata: Record<string, unknown>): CosmosChainInfo => {
  const chainInfoRecord = asRecord(metadata.chainInfo);
  const currencies = Array.isArray(chainInfoRecord?.currencies) ? chainInfoRecord.currencies.map((item) => toCurrency(item)).filter((item): item is CosmosCurrency => !!item) : [];
  const feeCurrencies = Array.isArray(chainInfoRecord?.feeCurrencies) ? chainInfoRecord.feeCurrencies.map((item) => toFeeCurrency(item)).filter((item): item is CosmosFeeCurrencies => !!item) : [];
  const chainRecordCurrency = toChainRecordCurrency(chain);
  const stakeCurrency = (chainInfoRecord ? toCurrency(chainInfoRecord.stakeCurrency) : null) || currencies[0] || feeCurrencies[0] || chainRecordCurrency || buildFallbackStakeCurrency(chain);
  const chainId = normalizeString(chainInfoRecord?.chainId) || chain.chainId;
  const chainName = normalizeString(chainInfoRecord?.chainName) || chain.name;
  const rpc = normalizeString(chainInfoRecord?.rpc) || normalizeString(chain.rpc);
  const rest = normalizeString(chainInfoRecord?.rest);
  const features = Array.isArray(chainInfoRecord?.features) ? chainInfoRecord.features.filter((feature): feature is string => typeof feature === 'string') : ['stargate'];

  return {
    chainId,
    chainName,
    rpc,
    rest,
    stakeCurrency,
    bip44: {
      coinType: toFiniteNonNegativeInteger(asRecord(chainInfoRecord?.bip44)?.coinType) ?? -1,
    },
    bech32Config: toBech32Config(chainInfoRecord?.bech32Config),
    currencies: currencies.length ? currencies : chainRecordCurrency ? [chainRecordCurrency] : [],
    feeCurrencies: feeCurrencies.length ? feeCurrencies : chainRecordCurrency ? [chainRecordCurrency] : [],
    features,
  };
};

const resolvePersistedSuggestedAddressMetadataDrift = (chainInfo: CosmosChainInfo) => {
  return !normalizeString(chainInfo.bech32Config?.bech32PrefixAccAddr) || toFiniteNonNegativeInteger(chainInfo.bip44?.coinType) === undefined;
};

const resolvePersistedSuggestedNativeAssetMetadataDrift = (chainInfo: CosmosChainInfo) => !toCurrency(chainInfo.stakeCurrency);

const resolvePersistedSuggestedTransportMetadataDrift = (chainInfo: CosmosChainInfo) => !hasValidRuntimeUrl(chainInfo.rpc, SUPPORTED_RPC_PROTOCOLS) && !hasValidRuntimeUrl(chainInfo.rest, SUPPORTED_REST_PROTOCOLS);

export const resolvePersistedSuggestedMetadataUnsupportedReason = (chain: Chain): RuntimeUnsupportedReason | undefined => {
  if (!hasPersistedSuggestedMetadataEnvelope(chain)) {
    return undefined;
  }

  const metadata = parseSuggestedChainTypeMetadata(chain.type || '');
  const chainInfo = buildPersistedSuggestedChainInfo(chain, metadata || {});
  if (resolvePersistedSuggestedAddressMetadataDrift(chainInfo)) {
    return 'missing_address_metadata';
  }
  if (resolvePersistedSuggestedNativeAssetMetadataDrift(chainInfo)) {
    return 'missing_native_asset_metadata';
  }
  if (resolvePersistedSuggestedTransportMetadataDrift(chainInfo)) {
    return 'missing_runtime_transport';
  }
  return undefined;
};

const toSuggestedChainRecord = (chainInfo: CosmosChainInfo): Chain => ({
  chainId: chainInfo.chainId,
  custom: '1',
  decimals: String(chainInfo.stakeCurrency?.coinDecimals ?? ''),
  dr: '0',
  explore: '',
  icon: '',
  muticall: '',
  name: chainInfo.chainName,
  nft: '',
  rpc: chainInfo.rpc,
  sorts: '',
  symbol: chainInfo.stakeCurrency?.coinDenom || '',
  token: chainInfo.stakeCurrency?.coinMinimalDenom || '',
  type: JSON.stringify({
    runtimeSource: 'suggested',
    chainInfo,
  }),
});

export const toSuggestedChainSourceEntry = (chainInfo: CosmosChainInfo): SuggestedChainSourceEntry => ({
  source: 'suggested',
  chainId: chainInfo.chainId,
  chainName: chainInfo.chainName,
  persisted: false,
  chainInfo,
  chainRecord: toSuggestedChainRecord(chainInfo),
});

export const isPersistedSuggestedChainRecord = (chain: Pick<Chain, 'type'>) => hasPersistedSuggestedMetadataEnvelope(chain);

export const toPersistedSuggestedChainSourceEntry = (chain: Chain): SuggestedChainSourceEntry | undefined => {
  const metadata = parseSuggestedChainTypeMetadata(chain.type || '');
  if (!metadata && !hasPersistedSuggestedMetadataEnvelope(chain)) {
    return undefined;
  }

  const chainInfo = buildPersistedSuggestedChainInfo(chain, metadata || {});

  return {
    source: 'suggested',
    chainId: chain.chainId,
    chainName: chain.name || chainInfo.chainName,
    persisted: true,
    chainInfo,
    chainRecord: chain,
  };
};

export const getSuggestedChainSource = async (chainId: string): Promise<SuggestedChainSourceEntry | undefined> => {
  const chains = await getChainByChainId(chainId);
  for (const chain of chains) {
    const suggested = toPersistedSuggestedChainSourceEntry(chain);
    if (suggested) {
      return suggested;
    }
  }
  return undefined;
};
