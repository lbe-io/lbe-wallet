import { fromBech32 } from '@cosmjs/encoding';
import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';

export function isValidAddress(address: string, chainId?: string) {
  if (!address || !address.trim()) return false;
  try {
    const decoded = fromBech32(address.trim());
    if (!chainId) return true;
    const chain = getCosmosChainConfig(chainId);
    if (!chain) return false;
    return decoded.prefix === chain.bech32Prefix;
  } catch {
    return false;
  }
}
