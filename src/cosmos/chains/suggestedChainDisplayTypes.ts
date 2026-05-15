export type SuggestedRuntimeChainDisplayTextFields = {
  chainLabel: string;
  title: string;
  subtitle: string;
  explanation: string;
  nativeAssetLabel: string;
  nativeAssetFallbackText: string;
  nativeAssetExplanation: string;
  addressLabel: string;
  addressSourceText: string;
  addressTitle: string;
  addressSubtitle: string;
  addressExplanation: string;
};

export type SuggestedRuntimeChainDisplayPropShape = SuggestedRuntimeChainDisplayTextFields & {
  chainTitle: string;
};

export type SuggestedRuntimeChainApprovalPreviewDisplayContext = {
  requestedChainName: string;
  requestedChainTitle: string;
  requestedChainSubtitle: string;
  requestedNativeAssetLabel: string;
  requestedNativeAssetExplanation: string;
  requestedAddressLabel: string;
  requestedAddressSourceText: string;
  requestedAddressTitle: string;
  requestedAddressSubtitle: string;
  requestedAddressExplanation: string;
};

export type SuggestedRuntimeChainPreviewInput = Partial<SuggestedRuntimeChainApprovalPreviewDisplayContext> | null | undefined;

export type SuggestedRuntimeChainAddTokenDisplayContext = SuggestedRuntimeChainDisplayPropShape & {
  chainSubtitle: string;
  chainExplanation: string;
  previewTitle: string;
  previewSubtitle: string;
  previewExplanation: string;
  fallbackText: string;
};
