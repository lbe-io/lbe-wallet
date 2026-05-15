import { getCosmosChainConfig, type CosmosChainInfo } from './chain-registry';
import type { NativeAssetContext, RuntimeChainInterpretation, RuntimeChainStatus, RuntimeUnsupportedReason } from './runtimeChainAdapter';
import { buildSuggestedChainLabel, buildSuggestedSurfaceDisplayTitle, resolveSuggestedChainName } from './suggestedChainDisplayCopy';
import type { SuggestedRuntimeChainApprovalPreviewDisplayContext, SuggestedRuntimeChainDisplayPropShape, SuggestedRuntimeChainPreviewInput } from './suggestedChainDisplayTypes';
import { buildRuntimeChainNativeAssetDisplayContext, type RuntimeChainNativeAssetDisplayContext } from './runtimeChainNativeAssetDisplayAdapter';
import { buildRuntimeChainApprovalAddressDisplayContext, type RuntimeChainApprovalAddressDisplayContext } from './runtimeChainAddressDisplayAdapter';

export type RuntimeChainDisplaySource = RuntimeChainInterpretation['source'] | 'unknown';

export type RuntimeChainDisplayContext = {
  source: RuntimeChainDisplaySource;
  runtimeStatus: RuntimeChainStatus;
  unsupportedReason?: RuntimeUnsupportedReason;
  chainId: string;
  chainName: string;
  chainLabel: string;
  chainTitle: string;
  nativeAssetDisplay: RuntimeChainNativeAssetDisplayContext | null;
};

export type RuntimeChainAddressDisplayContext = {
  address: string;
  resolution: 'derived' | 'typedFallback' | 'walletFallback' | 'unavailable';
  label: string;
  title: string;
};

export type { SuggestedRuntimeChainApprovalPreviewDisplayContext, SuggestedRuntimeChainDisplayPropShape, SuggestedRuntimeChainPreviewInput } from './suggestedChainDisplayTypes';

export type SuggestedRuntimeChainDisplayAssembly = {
  chainLabel: string;
  title: string;
  subtitle: string;
  explanation: string;
  chainTitle: string;
  nativeAssetLabel: string;
  nativeAssetFallbackText: string;
  addressLabel: string;
  addressSourceText: string;
  addressTitle: string;
  addressSubtitle: string;
  addressExplanation: string;
};

type SuggestedAssemblyNativeAssetDisplayInput = {
  nativeAssetLabel?: string;
  fallbackText?: string;
  previewTitle?: string;
  previewSubtitle?: string;
  previewExplanation?: string;
};

type DisplayInput = {
  source?: RuntimeChainDisplaySource;
  runtimeStatus?: RuntimeChainStatus;
  unsupportedReason?: RuntimeUnsupportedReason;
  chainId?: string;
  chainName?: string;
  nativeAssetContext?: NativeAssetContext | null;
};

const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const joinSegments = (...values: Array<unknown>) =>
  values
    .map((value) => normalize(value))
    .filter(Boolean)
    .join('\n');

const resolveSourceSuffix = (source: RuntimeChainDisplaySource) => {
  switch (source) {
    case 'custom':
      return ' (Custom)';
    case 'suggested':
      return ' (Suggested)';
    default:
      return '';
  }
};

const resolveChainName = (input: DisplayInput) => {
  const chainName = normalize(input.chainName);
  const chainId = normalize(input.chainId);
  if (chainName) {
    return chainName;
  }
  const builtin = chainId ? getCosmosChainConfig(chainId) : undefined;
  return builtin?.chainName || chainId || 'Unknown Chain';
};

const resolveDisplaySource = (input: DisplayInput): RuntimeChainDisplaySource => {
  if (input.source) {
    return input.source;
  }
  const chainId = normalize(input.chainId);
  return getCosmosChainConfig(chainId) ? 'builtin' : 'unknown';
};

const resolveRuntimeStatus = (input: DisplayInput): RuntimeChainStatus => {
  if (input.runtimeStatus) {
    return input.runtimeStatus;
  }
  return resolveDisplaySource(input) === 'builtin' ? 'supported' : 'partial';
};

const resolveLegacyNativeAssetTitle = (input: DisplayInput) => {
  const source = resolveDisplaySource(input);
  if (source === 'builtin') {
    return '';
  }
  const nativeAsset = input.nativeAssetContext;
  if (!nativeAsset) {
    return '';
  }
  const symbol = normalize(nativeAsset.symbol);
  const minimalDenom = normalize(nativeAsset.minimalDenom);
  const decimals = nativeAsset.decimals;
  if (!symbol || !minimalDenom || !Number.isFinite(decimals)) {
    return '';
  }

  const denomSuffix = symbol.toLowerCase() === minimalDenom.toLowerCase() ? symbol : `${symbol} (${minimalDenom})`;
  return `Native asset: ${denomSuffix}, ${decimals} decimals`;
};

export const buildRuntimeChainDisplayContext = (interpretation: RuntimeChainInterpretation): RuntimeChainDisplayContext => {
  const chainName = resolveChainName(interpretation);
  const chainLabel = `${chainName}${resolveSourceSuffix(interpretation.source)}`;
  const nativeAssetDisplay = buildRuntimeChainNativeAssetDisplayContext({
    source: interpretation.source,
    chainName,
    nativeAssetContext: interpretation.nativeAssetContext,
  });
  const nativeAssetTitle = nativeAssetDisplay?.previewExplanation || resolveLegacyNativeAssetTitle(interpretation);
  const partialTitle = interpretation.runtimeStatus === 'supported' ? chainName : nativeAssetTitle ? `${chainLabel} - partial runtime support - ${nativeAssetTitle}` : `${chainLabel} - partial runtime support`;

  return {
    source: interpretation.source,
    runtimeStatus: interpretation.runtimeStatus,
    unsupportedReason: interpretation.unsupportedReason,
    chainId: interpretation.chainId,
    chainName,
    chainLabel,
    chainTitle: partialTitle,
    nativeAssetDisplay,
  };
};

export const buildRequestedRuntimeChainDisplayContext = (input: DisplayInput): RuntimeChainDisplayContext => {
  const source = resolveDisplaySource(input);
  const chainName = resolveChainName(input);
  const runtimeStatus = resolveRuntimeStatus(input);
  const unsupportedReason = input.unsupportedReason;
  const chainLabel = `${chainName}${resolveSourceSuffix(source)}`;
  const nativeAssetDisplay = buildRuntimeChainNativeAssetDisplayContext({
    source,
    chainName,
    nativeAssetContext: input.nativeAssetContext,
  });
  const nativeAssetTitle = nativeAssetDisplay?.previewExplanation || resolveLegacyNativeAssetTitle(input);
  const chainTitle = runtimeStatus === 'supported' ? chainName : nativeAssetTitle ? `${chainLabel} - partial runtime support - ${nativeAssetTitle}` : `${chainLabel} - partial runtime support`;

  return {
    source,
    runtimeStatus,
    unsupportedReason,
    chainId: normalize(input.chainId),
    chainName,
    chainLabel,
    chainTitle,
    nativeAssetDisplay,
  };
};

export const buildSuggestedRuntimeChainDisplayContextFromInfo = (chainInfo: CosmosChainInfo): RuntimeChainDisplayContext =>
  buildRequestedRuntimeChainDisplayContext({
    source: 'suggested',
    runtimeStatus: 'partial',
    unsupportedReason: 'suggested_chain_not_persisted',
    chainId: chainInfo.chainId,
    chainName: chainInfo.chainName,
    nativeAssetContext: chainInfo.stakeCurrency
      ? {
          symbol: chainInfo.stakeCurrency.coinDenom,
          minimalDenom: chainInfo.stakeCurrency.coinMinimalDenom,
          decimals: chainInfo.stakeCurrency.coinDecimals,
        }
      : null,
  });

export const buildSuggestedRuntimeChainDisplayAssembly = ({
  chainName,
  nativeAssetDisplay,
  addressDisplay,
  defaultChainTitle,
  defaultAddressTitle,
  surface = 'connect',
}: {
  chainName?: string;
  nativeAssetDisplay?: SuggestedAssemblyNativeAssetDisplayInput | null;
  addressDisplay?: RuntimeChainApprovalAddressDisplayContext | null;
  defaultChainTitle?: string;
  defaultAddressTitle?: string;
  surface?: 'connect' | 'add-token';
}): SuggestedRuntimeChainDisplayAssembly => {
  const resolvedChainName = resolveSuggestedChainName(chainName);
  const chainLabel = buildSuggestedChainLabel(chainName);
  const title = normalize(nativeAssetDisplay?.previewTitle) || buildSuggestedSurfaceDisplayTitle(chainName, surface);
  const subtitle = joinSegments(nativeAssetDisplay?.previewSubtitle, addressDisplay?.previewSubtitle);
  const explanation = joinSegments(nativeAssetDisplay?.previewExplanation, addressDisplay?.previewExplanation);
  const nativeAssetLabel = normalize(nativeAssetDisplay?.nativeAssetLabel);
  const nativeAssetFallbackText = normalize(nativeAssetDisplay?.fallbackText);
  const addressLabel = normalize(addressDisplay?.addressLabel) || 'Accounts connected';
  const addressSourceText = normalize(addressDisplay?.addressSourceText);
  const addressSubtitle = normalize(addressDisplay?.previewSubtitle);
  const addressExplanation = normalize(addressDisplay?.previewExplanation);

  return {
    chainLabel,
    title,
    subtitle,
    explanation,
    chainTitle: joinSegments(title, subtitle, nativeAssetLabel ? `Native asset: ${nativeAssetLabel}` : '', nativeAssetFallbackText, explanation, defaultChainTitle),
    nativeAssetLabel,
    nativeAssetFallbackText,
    addressLabel,
    addressSourceText,
    addressTitle: joinSegments(addressDisplay?.previewTitle, addressSubtitle, addressSourceText, addressExplanation, defaultAddressTitle),
    addressSubtitle,
    addressExplanation,
  };
};

export const buildSuggestedRuntimeChainDisplayPropShape = ({
  chainName,
  nativeAssetDisplay,
  addressDisplay,
  defaultChainTitle,
  defaultAddressTitle,
  surface = 'connect',
}: {
  chainName?: string;
  nativeAssetDisplay?: SuggestedAssemblyNativeAssetDisplayInput | null;
  addressDisplay?: RuntimeChainApprovalAddressDisplayContext | null;
  defaultChainTitle?: string;
  defaultAddressTitle?: string;
  surface?: 'connect' | 'add-token';
}): SuggestedRuntimeChainDisplayPropShape => {
  const assembly = buildSuggestedRuntimeChainDisplayAssembly({
    chainName,
    nativeAssetDisplay,
    addressDisplay,
    defaultChainTitle,
    defaultAddressTitle,
    surface,
  });

  return {
    chainLabel: assembly.chainLabel,
    title: assembly.title,
    subtitle: assembly.subtitle,
    explanation: assembly.explanation,
    chainTitle: assembly.chainTitle,
    nativeAssetLabel: assembly.nativeAssetLabel || normalize(nativeAssetDisplay?.nativeAssetLabel),
    nativeAssetFallbackText: assembly.nativeAssetFallbackText || normalize(nativeAssetDisplay?.fallbackText),
    nativeAssetExplanation: assembly.explanation || normalize(nativeAssetDisplay?.previewExplanation),
    addressLabel: assembly.addressLabel || normalize(addressDisplay?.addressLabel) || 'Accounts connected',
    addressSourceText: assembly.addressSourceText || normalize(addressDisplay?.addressSourceText),
    addressTitle: assembly.addressTitle || normalize(addressDisplay?.previewTitle),
    addressSubtitle: assembly.addressSubtitle || normalize(addressDisplay?.previewSubtitle),
    addressExplanation: assembly.addressExplanation || normalize(addressDisplay?.previewExplanation),
  };
};

export const buildSuggestedRuntimeChainDisplayPropShapeFromPreview = (preview: SuggestedRuntimeChainPreviewInput): SuggestedRuntimeChainDisplayPropShape | null => {
  const chainLabel = normalize(preview?.requestedChainName);
  const chainTitle = normalize(preview?.requestedChainTitle);
  const nativeAssetExplanation = normalize(preview?.requestedNativeAssetExplanation);
  const addressSourceText = normalize(preview?.requestedAddressSourceText);
  const looksSuggested = chainLabel.includes('(Suggested)') || nativeAssetExplanation.toLowerCase().includes('suggested') || addressSourceText.toLowerCase().includes('suggested');

  if (!looksSuggested) {
    return null;
  }

  const subtitle = normalize(preview?.requestedChainSubtitle);
  const addressExplanation = normalize(preview?.requestedAddressExplanation);

  return {
    chainLabel,
    title: chainTitle,
    subtitle,
    explanation: nativeAssetExplanation || addressExplanation,
    chainTitle,
    nativeAssetLabel: normalize(preview?.requestedNativeAssetLabel),
    nativeAssetFallbackText: '',
    nativeAssetExplanation,
    addressLabel: normalize(preview?.requestedAddressLabel) || 'Accounts connected',
    addressSourceText,
    addressTitle: normalize(preview?.requestedAddressTitle),
    addressSubtitle: normalize(preview?.requestedAddressSubtitle),
    addressExplanation,
  };
};

export const buildSuggestedRuntimeChainApprovalPreviewDisplayContext = ({
  chainName,
  nativeAssetDisplay,
  addressDisplay,
  defaultChainTitle,
}: {
  chainName?: string;
  nativeAssetDisplay?: SuggestedAssemblyNativeAssetDisplayInput | null;
  addressDisplay?: RuntimeChainApprovalAddressDisplayContext | null;
  defaultChainTitle?: string;
}): SuggestedRuntimeChainApprovalPreviewDisplayContext => {
  const propShape = buildSuggestedRuntimeChainDisplayPropShape({
    chainName,
    nativeAssetDisplay,
    addressDisplay,
    defaultChainTitle,
    surface: 'connect',
  });

  return {
    requestedChainName: propShape.chainLabel,
    requestedChainTitle: propShape.chainTitle,
    requestedChainSubtitle: propShape.subtitle,
    requestedNativeAssetLabel: propShape.nativeAssetLabel,
    requestedNativeAssetExplanation: propShape.nativeAssetExplanation,
    requestedAddressLabel: propShape.addressLabel,
    requestedAddressSourceText: propShape.addressSourceText,
    requestedAddressTitle: propShape.addressTitle,
    requestedAddressSubtitle: propShape.addressSubtitle,
    requestedAddressExplanation: propShape.addressExplanation,
  };
};

export const resolveRuntimeChainAddressDisplayContext = ({
  interpretation,
  derivedAddress,
  typedFallbackAddress,
  walletFallbackAddress,
}: {
  interpretation?: RuntimeChainInterpretation | null;
  derivedAddress?: string | null;
  typedFallbackAddress?: string | null;
  walletFallbackAddress?: string | null;
}): RuntimeChainAddressDisplayContext => {
  const derived = normalize(derivedAddress);
  const typedFallback = normalize(typedFallbackAddress);
  const walletFallback = normalize(walletFallbackAddress);
  const source = interpretation?.source || 'unknown';
  const sourceAddressDisplay = buildRuntimeChainApprovalAddressDisplayContext({
    source,
    chainName: interpretation?.chainName,
    addressContext: interpretation?.addressContext,
    addressDerivationSupported: !!interpretation?.addressContext,
  });

  if (derived) {
    return {
      address: derived,
      resolution: 'derived',
      label: source === 'custom' ? sourceAddressDisplay?.addressLabel || 'Accounts connected (chain-specific)' : source === 'suggested' ? sourceAddressDisplay?.addressLabel || 'Accounts connected (suggested context)' : 'Accounts connected',
      title:
        source === 'custom'
          ? sourceAddressDisplay?.previewExplanation || 'Using chain-specific derived address for this custom chain'
          : source === 'suggested'
            ? sourceAddressDisplay?.previewExplanation || 'Using suggested-chain address metadata for display only'
            : 'Using chain-specific derived address',
    };
  }

  if (typedFallback) {
    return {
      address: typedFallback,
      resolution: 'typedFallback',
      label: source === 'builtin' ? 'Accounts connected' : source === 'custom' ? 'Accounts connected (typed fallback)' : source === 'suggested' ? 'Accounts connected (suggested fallback)' : 'Accounts connected (fallback)',
      title:
        source === 'builtin'
          ? 'Using compatible chain address fallback'
          : source === 'custom'
            ? sourceAddressDisplay?.previewExplanation || 'Using typed fallback address because custom-chain derivation is unavailable'
            : source === 'suggested'
              ? sourceAddressDisplay?.previewExplanation || 'Using suggested-chain fallback address because runtime support is still partial for this chain'
              : 'Using fallback address because runtime support is partial for this chain',
    };
  }

  if (walletFallback) {
    return {
      address: walletFallback,
      resolution: 'walletFallback',
      label: source === 'custom' ? 'Accounts connected (wallet fallback)' : source === 'suggested' ? 'Accounts connected (suggested fallback)' : 'Accounts connected (fallback)',
      title:
        source === 'custom'
          ? sourceAddressDisplay?.previewExplanation || 'Using wallet fallback address because custom-chain address context is unavailable'
          : source === 'suggested'
            ? sourceAddressDisplay?.previewExplanation || 'Using wallet fallback address because suggested-chain address context is display-only'
            : 'Using wallet fallback address because chain-specific address context is unavailable',
    };
  }

  return {
    address: '',
    resolution: 'unavailable',
    label: 'Accounts connected',
    title:
      source === 'custom'
        ? sourceAddressDisplay?.previewExplanation || 'No local address available for this custom chain'
        : source === 'suggested'
          ? sourceAddressDisplay?.previewExplanation || 'No local address available for this suggested chain'
          : 'No local address available for this chain',
  };
};
