import type { RuntimeChainInterpretation } from './runtimeChainAdapter';
import type { SuggestedRuntimeChainAddTokenDisplayContext as RuntimeChainAddTokenDisplayContext } from './suggestedChainDisplayTypes';
import { buildRuntimeChainApprovalAddressDisplayContext } from './runtimeChainAddressDisplayAdapter';
import { buildRuntimeChainNativeAssetDisplayContext } from './runtimeChainNativeAssetDisplayAdapter';
import { buildSuggestedRuntimeChainDisplayPropShape } from './runtimeChainDisplayAdapter';
import {
  buildSuggestedAddTokenAddressLabel,
  buildSuggestedAddTokenAddressPreviewExplanation,
  buildSuggestedAddTokenAddressPreviewTitle,
  buildSuggestedAddTokenAddressSourceText,
  buildSuggestedAddTokenNativeAssetFallbackText,
  buildSuggestedAddTokenNativeAssetPreviewExplanation,
  buildSuggestedAddTokenNativeAssetPreviewTitle,
  resolveSuggestedChainName,
} from './suggestedChainDisplayCopy';

export type RuntimeChainAddTokenAddressDisplayContext = {
  addressLabel: string;
  addressSourceText: string;
  previewTitle: string;
  previewSubtitle: string;
  previewExplanation: string;
};

export type RuntimeChainAddTokenNativeAssetDisplayContext = {
  nativeAssetLabel: string;
  fallbackText: string;
  previewTitle: string;
  previewSubtitle: string;
  previewExplanation: string;
};

export type { SuggestedRuntimeChainAddTokenDisplayContext as RuntimeChainAddTokenDisplayContext } from './suggestedChainDisplayTypes';

type AddressResolution = 'derived' | 'typedFallback' | 'walletFallback' | 'unavailable';

const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeCoinType = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(Math.trunc(value)) : '');

const joinSegments = (...values: Array<unknown>) =>
  values
    .map((value) => normalize(value))
    .filter(Boolean)
    .join('\n');

const resolvePreviewSubtitle = (interpretation: RuntimeChainInterpretation, fallbackSubtitle?: string) => {
  const previewSubtitle = normalize(fallbackSubtitle);
  if (previewSubtitle) {
    return previewSubtitle;
  }

  const bech32Prefix = normalize(interpretation.addressContext?.bech32Prefix);
  const coinType = normalizeCoinType(interpretation.addressContext?.coinType);
  if (bech32Prefix && coinType) {
    return `bech32 prefix ${bech32Prefix} 路 coin type ${coinType}`;
  }
  if (bech32Prefix) {
    return `bech32 prefix ${bech32Prefix}`;
  }
  return '';
};

export const buildRuntimeChainAddTokenAddressDisplayContext = ({ interpretation, resolution }: { interpretation?: RuntimeChainInterpretation | null; resolution: AddressResolution }): RuntimeChainAddTokenAddressDisplayContext | null => {
  if (!interpretation || (interpretation.source !== 'custom' && interpretation.source !== 'suggested')) {
    return null;
  }

  const chainName = normalize(interpretation.chainName) || (interpretation.source === 'suggested' ? 'Suggested chain' : 'Custom chain');
  const baseDisplay = buildRuntimeChainApprovalAddressDisplayContext({
    source: interpretation.source,
    chainName,
    addressContext: interpretation.addressContext,
    addressDerivationSupported: !!interpretation.addressContext,
  });
  const previewSubtitle = resolvePreviewSubtitle(interpretation, baseDisplay?.previewSubtitle);

  if (interpretation.source === 'suggested') {
    if (resolution === 'derived') {
      return {
        addressLabel: buildSuggestedAddTokenAddressLabel(resolution),
        addressSourceText: buildSuggestedAddTokenAddressSourceText({
          resolution,
          defaultSourceText: baseDisplay?.addressSourceText,
        }),
        previewTitle: buildSuggestedAddTokenAddressPreviewTitle(chainName, resolution),
        previewSubtitle,
        previewExplanation: buildSuggestedAddTokenAddressPreviewExplanation(resolution),
      };
    }

    if (resolution === 'typedFallback') {
      return {
        addressLabel: buildSuggestedAddTokenAddressLabel(resolution),
        addressSourceText: buildSuggestedAddTokenAddressSourceText({
          resolution,
          defaultSourceText: baseDisplay?.addressSourceText,
        }),
        previewTitle: buildSuggestedAddTokenAddressPreviewTitle(chainName, resolution),
        previewSubtitle: previewSubtitle || 'Typed fallback selected for suggested chain token approval',
        previewExplanation: buildSuggestedAddTokenAddressPreviewExplanation(resolution),
      };
    }

    if (resolution === 'walletFallback') {
      return {
        addressLabel: buildSuggestedAddTokenAddressLabel(resolution),
        addressSourceText: buildSuggestedAddTokenAddressSourceText({
          resolution,
        }),
        previewTitle: buildSuggestedAddTokenAddressPreviewTitle(chainName, resolution),
        previewSubtitle: previewSubtitle || 'Wallet fallback selected for suggested chain token approval',
        previewExplanation: buildSuggestedAddTokenAddressPreviewExplanation(resolution),
      };
    }

    return {
      addressLabel: buildSuggestedAddTokenAddressLabel(resolution),
      addressSourceText: buildSuggestedAddTokenAddressSourceText({
        resolution,
      }),
      previewTitle: buildSuggestedAddTokenAddressPreviewTitle(chainName, resolution),
      previewSubtitle,
      previewExplanation: buildSuggestedAddTokenAddressPreviewExplanation(resolution),
    };
  }

  if (resolution === 'derived') {
    return {
      addressLabel: baseDisplay?.addressLabel || 'Accounts connected (chain-specific)',
      addressSourceText: baseDisplay?.addressSourceText || 'Derived using custom-chain address context',
      previewTitle: baseDisplay?.previewTitle || `${chainName} Add Token address context`,
      previewSubtitle,
      previewExplanation: 'This custom chain can resolve a chain-specific derived address for token approval. Other runtime capabilities may still be partial.',
    };
  }

  if (resolution === 'typedFallback') {
    return {
      addressLabel: 'Accounts connected (typed fallback)',
      addressSourceText: baseDisplay?.addressSourceText || 'Using typed fallback address for this custom chain',
      previewTitle: `${chainName} Add Token address fallback`,
      previewSubtitle: previewSubtitle || 'Typed fallback selected for token approval',
      previewExplanation: 'This custom chain exposes address metadata, but AddToken is currently using a typed fallback address. Other runtime capabilities may still be partial.',
    };
  }

  if (resolution === 'walletFallback') {
    return {
      addressLabel: 'Accounts connected (wallet fallback)',
      addressSourceText: 'Using wallet fallback address for this custom chain',
      previewTitle: `${chainName} Add Token wallet fallback`,
      previewSubtitle: previewSubtitle || 'Wallet fallback selected for token approval',
      previewExplanation: 'This custom chain cannot resolve a chain-specific token address here, so AddToken is using a wallet fallback address. Other runtime capabilities may still be partial.',
    };
  }

  return {
    addressLabel: 'Accounts connected',
    addressSourceText: 'No local address available for this custom chain',
    previewTitle: `${chainName} Add Token address unavailable`,
    previewSubtitle,
    previewExplanation: 'No local address is available for this custom chain in AddToken. Other runtime capabilities may still be partial.',
  };
};

export const buildRuntimeChainAddTokenNativeAssetDisplayContext = ({ interpretation }: { interpretation?: RuntimeChainInterpretation | null }): RuntimeChainAddTokenNativeAssetDisplayContext | null => {
  if (!interpretation || interpretation.source !== 'suggested') {
    return null;
  }

  const chainName = resolveSuggestedChainName(interpretation.chainName);
  const nativeAssetDisplay = buildRuntimeChainNativeAssetDisplayContext({
    source: interpretation.source,
    chainName,
    nativeAssetContext: interpretation.nativeAssetContext,
  });

  if (!nativeAssetDisplay) {
    return null;
  }

  const fallbackText = buildSuggestedAddTokenNativeAssetFallbackText(nativeAssetDisplay.fallbackText);

  return {
    nativeAssetLabel: nativeAssetDisplay.nativeAssetLabel,
    fallbackText,
    previewTitle: buildSuggestedAddTokenNativeAssetPreviewTitle(chainName),
    previewSubtitle: nativeAssetDisplay.previewSubtitle || `Suggested native asset ${nativeAssetDisplay.fallbackText}`,
    previewExplanation: buildSuggestedAddTokenNativeAssetPreviewExplanation(nativeAssetDisplay.fallbackText),
  };
};

export const buildSuggestedRuntimeChainAddTokenDisplayContext = ({
  interpretation,
  resolution,
  addressFallbackTitle,
  defaultChainTitle,
}: {
  interpretation?: RuntimeChainInterpretation | null;
  resolution: AddressResolution;
  addressFallbackTitle?: string;
  defaultChainTitle?: string;
}): RuntimeChainAddTokenDisplayContext | null => {
  if (!interpretation || interpretation.source !== 'suggested') {
    return null;
  }

  const addressDisplay = buildRuntimeChainAddTokenAddressDisplayContext({
    interpretation,
    resolution,
  });
  const nativeAssetDisplay = buildRuntimeChainAddTokenNativeAssetDisplayContext({
    interpretation,
  });
  const propShape = buildSuggestedRuntimeChainDisplayPropShape({
    chainName: interpretation.chainName,
    nativeAssetDisplay,
    addressDisplay,
    defaultChainTitle,
    defaultAddressTitle: addressFallbackTitle,
    surface: 'add-token',
  });

  return {
    chainLabel: propShape.chainLabel,
    title: propShape.title,
    subtitle: propShape.subtitle,
    explanation: propShape.explanation,
    chainTitle: propShape.chainTitle,
    chainSubtitle: propShape.subtitle,
    chainExplanation: propShape.explanation,
    addressLabel: propShape.addressLabel,
    addressTitle: propShape.addressTitle,
    addressSourceText: propShape.addressSourceText,
    addressSubtitle: propShape.addressSubtitle,
    addressExplanation: propShape.addressExplanation,
    nativeAssetLabel: propShape.nativeAssetLabel,
    nativeAssetFallbackText: propShape.nativeAssetFallbackText,
    nativeAssetExplanation: propShape.nativeAssetExplanation,
    previewTitle: propShape.title,
    previewSubtitle: propShape.subtitle,
    previewExplanation: propShape.explanation,
    fallbackText: propShape.nativeAssetFallbackText || propShape.addressSourceText,
  };
};
