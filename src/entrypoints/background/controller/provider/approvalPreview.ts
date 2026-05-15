import { getCosmosChainConfig, type CosmosChainInfo } from '@/cosmos/chains/chain-registry';
import type { SuggestedRuntimeChainApprovalPreviewDisplayContext } from '@/cosmos/chains/suggestedChainDisplayTypes';
import { buildRequestedRuntimeChainDisplayContext, buildSuggestedRuntimeChainDisplayContextFromInfo, buildSuggestedRuntimeChainApprovalPreviewDisplayContext } from '@/cosmos/chains/runtimeChainDisplayAdapter';
import { buildRuntimeChainApprovalAddressDisplayContext } from '@/cosmos/chains/runtimeChainAddressDisplayAdapter';
import { buildFallbackSendTxApprovalPreview } from '@/cosmos/tx/txPreviewAdapter';
import { decodeArbitraryData, decodeSignPreview, decodeTxPreview, getTxSize, type SendTxApprovalPreview, type SignApprovalPreview } from '@/shared/utils/approvalPreviewShared';
export type { SignApprovalPreview, SendTxApprovalPreview } from '@/shared/utils/approvalPreviewShared';

export type ApprovalSession = {
  origin: string;
  name: string;
  icon: string;
};

export type ConnectApprovalPreview = {
  session: ApprovalSession;
  requestMethod: string;
  requestedChainId: string;
  requestedChainName: string;
  requestedChainTitle?: string;
  requestedChainSubtitle?: string;
  requestedNativeAssetLabel?: string;
  requestedNativeAssetExplanation?: string;
  requestedAddressLabel?: string;
  requestedAddressSourceText?: string;
  requestedAddressTitle?: string;
  requestedAddressSubtitle?: string;
  requestedAddressExplanation?: string;
};

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const toChainInfoRecord = (value: unknown): CosmosChainInfo | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const chainInfo = value as Record<string, unknown>;
  if (typeof chainInfo.chainId !== 'string' || typeof chainInfo.chainName !== 'string') {
    return undefined;
  }
  return chainInfo as unknown as CosmosChainInfo;
};

const toAddressContext = (
  value: unknown,
): {
  bech32Prefix: string;
  coinType: number;
} | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const bech32Config = record.bech32Config && typeof record.bech32Config === 'object' && !Array.isArray(record.bech32Config) ? (record.bech32Config as Record<string, unknown>) : null;
  const bip44 = record.bip44 && typeof record.bip44 === 'object' && !Array.isArray(record.bip44) ? (record.bip44 as Record<string, unknown>) : null;

  const bech32Prefix = typeof record.bech32Prefix === 'string' ? record.bech32Prefix.trim() : typeof bech32Config?.bech32PrefixAccAddr === 'string' ? bech32Config.bech32PrefixAccAddr.trim() : '';
  const coinTypeValue =
    typeof record.coinType === 'number'
      ? record.coinType
      : typeof record.coinType === 'string' && record.coinType.trim()
        ? Number(record.coinType)
        : typeof bip44?.coinType === 'number'
          ? bip44.coinType
          : typeof bip44?.coinType === 'string' && bip44.coinType.trim()
            ? Number(bip44.coinType)
            : Number.NaN;

  if (!bech32Prefix || !Number.isFinite(coinTypeValue)) {
    return null;
  }

  return {
    bech32Prefix,
    coinType: Math.trunc(coinTypeValue),
  };
};

const toNativeAssetContext = (
  value: unknown,
): {
  symbol: string;
  minimalDenom: string;
  decimals: number;
} | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const symbol = typeof record.coinDenom === 'string' ? record.coinDenom.trim() : typeof record.symbol === 'string' ? record.symbol.trim() : '';
  const minimalDenom = typeof record.coinMinimalDenom === 'string' ? record.coinMinimalDenom.trim() : typeof record.minimalDenom === 'string' ? record.minimalDenom.trim() : '';
  const decimalsValue =
    typeof record.coinDecimals === 'number'
      ? record.coinDecimals
      : typeof record.coinDecimals === 'string' && record.coinDecimals.trim()
        ? Number(record.coinDecimals)
        : typeof record.decimals === 'number'
          ? record.decimals
          : typeof record.decimals === 'string' && record.decimals.trim()
            ? Number(record.decimals)
            : Number.NaN;

  if (!symbol || !minimalDenom || !Number.isFinite(decimalsValue)) {
    return null;
  }

  return {
    symbol,
    minimalDenom,
    decimals: Math.trunc(decimalsValue),
  };
};

const resolveRequestedNativeAssetContext = (payload: Record<string, unknown>, chainInfo?: CosmosChainInfo) =>
  (chainInfo?.stakeCurrency ? toNativeAssetContext(chainInfo.stakeCurrency) : null) || toNativeAssetContext(payload.nativeAssetContext) || toNativeAssetContext(payload.stakeCurrency) || toNativeAssetContext(payload);

const resolveRequestedAddressContext = (payload: Record<string, unknown>, chainInfo?: CosmosChainInfo) => (chainInfo ? toAddressContext(chainInfo) : null) || toAddressContext(payload.addressContext) || toAddressContext(payload);

export const resolveRequestedChainId = (params: unknown): string => {
  const payload = toObjectRecord(params);
  const chainId = typeof payload.chainId === 'string' ? payload.chainId.trim() : '';
  if (chainId) {
    return chainId;
  }

  const chainIds = payload.chainIds;
  if (typeof chainIds === 'string') {
    return chainIds.trim();
  }
  if (Array.isArray(chainIds)) {
    const first = chainIds.find((item) => typeof item === 'string' && item.trim());
    return (first || '').trim();
  }
  return '';
};

export const buildConnectApprovalParams = (requestMethod: string, params: unknown, session: ApprovalSession) => {
  const requestedChainId = resolveRequestedChainId(params);
  const payload = toObjectRecord(params);
  const builtinChainName = getCosmosChainConfig(requestedChainId)?.chainName;
  const chainInfo = toChainInfoRecord(payload.chainInfo);
  const requestedNativeAssetContext = resolveRequestedNativeAssetContext(payload, chainInfo);
  const requestedAddressContext = resolveRequestedAddressContext(payload, chainInfo);
  const requestedChainDisplay = chainInfo
    ? buildSuggestedRuntimeChainDisplayContextFromInfo(chainInfo)
    : buildRequestedRuntimeChainDisplayContext({
        chainId: requestedChainId,
        chainName: (typeof payload.chainName === 'string' && payload.chainName.trim()) || builtinChainName || requestedChainId,
        source: builtinChainName ? 'builtin' : 'custom',
        runtimeStatus: builtinChainName ? 'supported' : 'partial',
        unsupportedReason: builtinChainName ? undefined : 'custom_chain_missing_runtime_metadata',
        nativeAssetContext: requestedNativeAssetContext,
      });
  const requestedAddressDisplay = buildRuntimeChainApprovalAddressDisplayContext({
    source: chainInfo ? 'suggested' : builtinChainName ? 'builtin' : 'custom',
    chainName: requestedChainDisplay.chainName,
    addressContext: requestedAddressContext,
    addressDerivationSupported: !!requestedAddressContext,
  });
  const suggestedPreviewProps: SuggestedRuntimeChainApprovalPreviewDisplayContext | null = chainInfo
    ? buildSuggestedRuntimeChainApprovalPreviewDisplayContext({
        chainName: requestedChainDisplay.chainName,
        nativeAssetDisplay: requestedChainDisplay.nativeAssetDisplay,
        addressDisplay: requestedAddressDisplay,
        defaultChainTitle: requestedChainDisplay.chainTitle,
      })
    : null;
  return {
    method: 'connect',
    requestMethod,
    requestedChainId,
    data: payload,
    session,
    preview: {
      session,
      requestMethod,
      requestedChainId,
      requestedChainName: suggestedPreviewProps?.requestedChainName || requestedChainDisplay.chainLabel,
      requestedChainTitle: suggestedPreviewProps?.requestedChainTitle || requestedChainDisplay.chainTitle,
      requestedChainSubtitle: suggestedPreviewProps?.requestedChainSubtitle || requestedChainDisplay.nativeAssetDisplay?.previewSubtitle,
      requestedNativeAssetLabel: suggestedPreviewProps?.requestedNativeAssetLabel || requestedChainDisplay.nativeAssetDisplay?.nativeAssetLabel,
      requestedNativeAssetExplanation: suggestedPreviewProps?.requestedNativeAssetExplanation || requestedChainDisplay.nativeAssetDisplay?.previewExplanation,
      requestedAddressLabel: suggestedPreviewProps?.requestedAddressLabel || requestedAddressDisplay?.addressLabel,
      requestedAddressSourceText: suggestedPreviewProps?.requestedAddressSourceText || requestedAddressDisplay?.addressSourceText,
      requestedAddressTitle: suggestedPreviewProps?.requestedAddressTitle || requestedAddressDisplay?.previewTitle,
      requestedAddressSubtitle: suggestedPreviewProps?.requestedAddressSubtitle || requestedAddressDisplay?.previewSubtitle,
      requestedAddressExplanation: suggestedPreviewProps?.requestedAddressExplanation || requestedAddressDisplay?.previewExplanation,
    } satisfies ConnectApprovalPreview,
  };
};

export const buildCosmosSignApprovalParams = (method: string, params: unknown, session: ApprovalSession) => {
  const payload = toObjectRecord(params);
  const signDoc = (payload.signDoc && typeof payload.signDoc === 'object' ? payload.signDoc : {}) as Record<string, any>;
  const arbitraryData = payload.data as string | Uint8Array | number[] | undefined;
  const decoded = decodeSignPreview(method, signDoc);

  return {
    method,
    data: payload,
    session,
    preview: {
      ...decoded.preview,
      arbitraryData: method.toLowerCase().includes('signarbitrary') ? decodeArbitraryData(arbitraryData) : undefined,
      error: decoded.error || undefined,
    } satisfies SignApprovalPreview,
  };
};

export const buildCosmosSendTxApprovalParams = (method: string, params: unknown, session: ApprovalSession) => {
  const payload = toObjectRecord(params);
  const decoded = decodeTxPreview(payload.txBytes as Uint8Array | string | number[] | undefined, payload.mode);
  const fallbackPreview = buildFallbackSendTxApprovalPreview({
    txSize: getTxSize(payload.txBytes as Uint8Array | string | number[] | undefined),
    mode: payload.mode,
  });

  return {
    method,
    data: payload,
    session,
    preview: {
      ...(decoded.preview || fallbackPreview),
      error: decoded.error,
    } satisfies SendTxApprovalPreview,
  };
};
