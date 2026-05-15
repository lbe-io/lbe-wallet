import type { NativeAssetContext } from './runtimeChainAdapter';
import { buildSuggestedNativeAssetPreviewExplanation, buildSuggestedNativeAssetPreviewTitle, resolveSuggestedChainName } from './suggestedChainDisplayCopy';

export type RuntimeChainNativeAssetDisplaySource = 'builtin' | 'custom' | 'suggested' | 'unknown';

export type RuntimeChainNativeAssetDisplayContext = {
  nativeAssetLabel: string;
  symbolText: string;
  denomText: string;
  decimalsText: string;
  fallbackText: string;
  previewTitle: string;
  previewSubtitle: string;
  previewExplanation: string;
};

const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeDecimals = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

const buildNativeAssetFallbackText = (symbol: string, minimalDenom: string) => (symbol.toLowerCase() === minimalDenom.toLowerCase() ? symbol : `${symbol} (${minimalDenom})`);

export const buildRuntimeChainNativeAssetDisplayContext = ({
  source,
  chainName,
  nativeAssetContext,
}: {
  source: RuntimeChainNativeAssetDisplaySource;
  chainName?: string;
  nativeAssetContext?: NativeAssetContext | null;
}): RuntimeChainNativeAssetDisplayContext | null => {
  if (source !== 'custom' && source !== 'suggested') {
    return null;
  }

  const symbol = normalize(nativeAssetContext?.symbol);
  const minimalDenom = normalize(nativeAssetContext?.minimalDenom);
  const decimals = normalizeDecimals(nativeAssetContext?.decimals);
  if (!symbol || !minimalDenom || !decimals) {
    return null;
  }

  const chainLabel = normalize(chainName) || (source === 'suggested' ? resolveSuggestedChainName(chainName) : 'Custom chain');
  const fallbackText = buildNativeAssetFallbackText(symbol, minimalDenom);
  const previewSubtitle = source === 'suggested' ? `Symbol: ${symbol} - Denom: ${minimalDenom} - Decimals: ${decimals}` : `Symbol: ${symbol} 路 Denom: ${minimalDenom} 路 Decimals: ${decimals}`;

  if (source === 'suggested') {
    return {
      nativeAssetLabel: fallbackText,
      symbolText: symbol,
      denomText: minimalDenom,
      decimalsText: decimals,
      fallbackText,
      previewTitle: buildSuggestedNativeAssetPreviewTitle(chainLabel, fallbackText),
      previewSubtitle,
      previewExplanation: buildSuggestedNativeAssetPreviewExplanation(fallbackText),
    };
  }

  return {
    nativeAssetLabel: fallbackText,
    symbolText: symbol,
    denomText: minimalDenom,
    decimalsText: decimals,
    fallbackText,
    previewTitle: `${chainLabel} native asset: ${fallbackText}`,
    previewSubtitle,
    previewExplanation: `Custom chain native asset fallback uses ${fallbackText}. Other runtime capabilities may still be partial.`,
  };
};
