import { rpcErrors } from '@/shared/rpc/errors';
import type { CosmosChainInfo } from '@/cosmos/chains/chain-registry';

export const validateSuggestedChainInfo = (chainInfo: unknown, canonical: CosmosChainInfo) => {
  const input = (chainInfo && typeof chainInfo === 'object' ? chainInfo : {}) as Record<string, unknown>;
  const bip44 = (input.bip44 && typeof input.bip44 === 'object' ? input.bip44 : {}) as Record<string, unknown>;
  const stakeCurrency = (input.stakeCurrency && typeof input.stakeCurrency === 'object' ? input.stakeCurrency : {}) as Record<string, unknown>;
  const bech32Config = (input.bech32Config && typeof input.bech32Config === 'object' ? input.bech32Config : {}) as Record<string, unknown>;
  const check = (value: unknown, expected: unknown, field: string) => {
    if (value === undefined || value === null || value === '') return;
    if (String(value) !== String(expected)) {
      throw rpcErrors.rpc.invalidParams({
        message: `chainInfo.${field} mismatch for "${canonical.chainId}"`,
      });
    }
  };

  check(input.chainName, canonical.chainName, 'chainName');
  check(input.rpc, canonical.rpc, 'rpc');
  check(input.rest, canonical.rest, 'rest');
  check(bip44.coinType, canonical.bip44.coinType, 'bip44.coinType');
  check(stakeCurrency.coinDenom, canonical.stakeCurrency.coinDenom, 'stakeCurrency.coinDenom');
  check(stakeCurrency.coinMinimalDenom, canonical.stakeCurrency.coinMinimalDenom, 'stakeCurrency.coinMinimalDenom');
  check(stakeCurrency.coinDecimals, canonical.stakeCurrency.coinDecimals, 'stakeCurrency.coinDecimals');
  check(bech32Config.bech32PrefixAccAddr, canonical.bech32Config.bech32PrefixAccAddr, 'bech32Config.bech32PrefixAccAddr');
  check(bech32Config.bech32PrefixValAddr, canonical.bech32Config.bech32PrefixValAddr, 'bech32Config.bech32PrefixValAddr');
  check(bech32Config.bech32PrefixConsAddr, canonical.bech32Config.bech32PrefixConsAddr, 'bech32Config.bech32PrefixConsAddr');
};
