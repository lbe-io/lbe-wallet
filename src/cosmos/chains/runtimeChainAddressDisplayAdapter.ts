import type { AddressBech32Context } from './runtimeChainAdapter';
import { buildSuggestedAddressSourceText, buildSuggestedApprovalAddressPreviewExplanation, buildSuggestedApprovalAddressPreviewTitle, resolveSuggestedChainName } from './suggestedChainDisplayCopy';

export type RuntimeChainApprovalAddressDisplayContext = {
  addressLabel: string;
  addressSourceText: string;
  previewTitle: string;
  previewSubtitle: string;
  previewExplanation: string;
};

const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeCoinType = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(Math.trunc(value)) : '');

export const buildRuntimeChainApprovalAddressDisplayContext = ({
  source,
  chainName,
  addressContext,
  addressDerivationSupported,
}: {
  source: 'builtin' | 'custom' | 'suggested' | 'unknown';
  chainName?: string;
  addressContext?: AddressBech32Context | null;
  addressDerivationSupported?: boolean;
}): RuntimeChainApprovalAddressDisplayContext | null => {
  if ((source !== 'custom' && source !== 'suggested') || !addressContext) {
    return null;
  }

  const resolvedChainName = normalize(chainName) || (source === 'suggested' ? resolveSuggestedChainName(chainName) : 'Custom chain');
  const bech32Prefix = normalize(addressContext.bech32Prefix);
  const coinType = normalizeCoinType(addressContext.coinType);
  if (!bech32Prefix || !coinType) {
    return null;
  }

  if (source === 'suggested') {
    return {
      addressLabel: 'Accounts connected (suggested context)',
      addressSourceText: buildSuggestedAddressSourceText(bech32Prefix),
      previewTitle: buildSuggestedApprovalAddressPreviewTitle(resolvedChainName),
      previewSubtitle: `bech32 prefix ${bech32Prefix} - coin type ${coinType}`,
      previewExplanation: buildSuggestedApprovalAddressPreviewExplanation(),
    };
  }

  if (addressDerivationSupported) {
    return {
      addressLabel: 'Accounts connected (chain-specific)',
      addressSourceText: `Derived using ${bech32Prefix} prefix`,
      previewTitle: `${resolvedChainName} address context: ${bech32Prefix}`,
      previewSubtitle: `bech32 prefix ${bech32Prefix} 路 coin type ${coinType}`,
      previewExplanation: 'This custom chain can resolve a chain-specific derived address. Other runtime capabilities may still be partial.',
    };
  }

  return {
    addressLabel: 'Accounts connected (context fallback)',
    addressSourceText: `Address metadata available (${bech32Prefix})`,
    previewTitle: `${resolvedChainName} address context available`,
    previewSubtitle: `bech32 prefix ${bech32Prefix} 路 coin type ${coinType}`,
    previewExplanation: 'This custom chain exposes address metadata, but approval display may still fall back to a typed or wallet address. Other runtime capabilities may still be partial.',
  };
};
