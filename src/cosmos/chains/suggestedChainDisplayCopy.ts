export type SuggestedDisplaySurface = 'connect' | 'add-token';

export type SuggestedAddTokenAddressResolution = 'derived' | 'typedFallback' | 'walletFallback' | 'unavailable';

const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const SUGGESTED_PARTIAL_PERSISTED_RUNTIME_COPY = 'Runtime support remains partial until the chain is persisted and explicitly upgraded.';

export const SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY = 'Runtime support remains partial and display-only.';

const joinSentence = (head: string, tail: string) => (head ? `${head} ${tail}` : tail);

export const resolveSuggestedChainName = (chainName?: string) => normalize(chainName) || 'Suggested chain';

export const buildSuggestedChainLabel = (chainName?: string) => `${resolveSuggestedChainName(chainName)} (Suggested)`;

export const buildSuggestedSurfaceDisplayTitle = (chainName?: string, surface: SuggestedDisplaySurface = 'connect') => `${resolveSuggestedChainName(chainName)} ${surface === 'add-token' ? 'Add Token' : 'Connect'} suggested display`;

export const buildSuggestedNativeAssetPreviewTitle = (chainName?: string, fallbackText?: string) => `${resolveSuggestedChainName(chainName)} suggested native asset: ${normalize(fallbackText)}`;

export const buildSuggestedNativeAssetPreviewExplanation = (fallbackText?: string) => joinSentence(`Suggested chain display uses ${normalize(fallbackText)} as native asset context.`, SUGGESTED_PARTIAL_PERSISTED_RUNTIME_COPY);

export const buildSuggestedAddTokenNativeAssetFallbackText = (fallbackText?: string) => `Using suggested native asset ${normalize(fallbackText)} for AddToken display`;

export const buildSuggestedAddTokenNativeAssetPreviewTitle = (chainName?: string) => `${resolveSuggestedChainName(chainName)} Add Token suggested native asset`;

export const buildSuggestedAddTokenNativeAssetPreviewExplanation = (fallbackText?: string) =>
  joinSentence(`AddToken is using ${normalize(fallbackText)} as the suggested chain native asset context for display only.`, SUGGESTED_PARTIAL_PERSISTED_RUNTIME_COPY);

export const buildSuggestedAddressSourceText = (bech32Prefix?: string) => {
  const prefix = normalize(bech32Prefix);
  return prefix ? `Suggested bech32 prefix ${prefix}` : '';
};

export const buildSuggestedApprovalAddressPreviewTitle = (chainName?: string) => `${resolveSuggestedChainName(chainName)} suggested address context`;

export const buildSuggestedApprovalAddressPreviewExplanation = () => 'This suggested chain includes address metadata for display, but approval may still use fallback addresses and runtime support remains partial.';

export const buildSuggestedAddTokenAddressLabel = (resolution: SuggestedAddTokenAddressResolution) => {
  if (resolution === 'derived') {
    return 'Accounts connected (suggested context)';
  }
  if (resolution === 'typedFallback' || resolution === 'walletFallback') {
    return 'Accounts connected (suggested fallback)';
  }
  return 'Accounts connected';
};

export const buildSuggestedAddTokenAddressSourceText = ({ resolution, defaultSourceText }: { resolution: SuggestedAddTokenAddressResolution; defaultSourceText?: string }) => {
  const fallback = normalize(defaultSourceText);
  if (fallback) {
    return fallback;
  }
  if (resolution === 'derived') {
    return 'Suggested chain address metadata is available';
  }
  if (resolution === 'typedFallback') {
    return 'Using typed fallback address for suggested chain metadata';
  }
  if (resolution === 'walletFallback') {
    return 'Using wallet fallback address for suggested chain display';
  }
  return 'No local address available for this suggested chain';
};

export const buildSuggestedAddTokenAddressPreviewTitle = (chainName: string | undefined, resolution: SuggestedAddTokenAddressResolution) => {
  const resolvedChainName = resolveSuggestedChainName(chainName);
  if (resolution === 'derived') {
    return `${resolvedChainName} Add Token suggested address context`;
  }
  if (resolution === 'typedFallback') {
    return `${resolvedChainName} Add Token suggested fallback`;
  }
  if (resolution === 'walletFallback') {
    return `${resolvedChainName} Add Token suggested wallet fallback`;
  }
  return `${resolvedChainName} Add Token suggested address unavailable`;
};

export const buildSuggestedAddTokenAddressPreviewExplanation = (resolution: SuggestedAddTokenAddressResolution) => {
  if (resolution === 'derived') {
    return joinSentence('This suggested chain includes address metadata for AddToken display, but', SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY);
  }
  if (resolution === 'typedFallback') {
    return joinSentence('This suggested chain exposes address metadata for AddToken display, but the current address is a typed fallback and', SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY);
  }
  if (resolution === 'walletFallback') {
    return joinSentence('This suggested chain cannot resolve a chain-specific AddToken address here, so the page is using a wallet fallback for display only.', SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY);
  }
  return joinSentence('No local address is available for this suggested chain in AddToken.', SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY);
};
