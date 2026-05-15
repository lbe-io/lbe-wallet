import wallet from '../wallet';

import { ensureChainId, ensureEnabledChain, ensureProviderAccountReadableChain, getProviderParams, resolveAccountIndex } from './controllerShared';
import type { ProviderRequestContext } from './types';

export const getKey = async (req: ProviderRequestContext) => {
  const { origin } = req.session;
  const { chainId, accountIndex } = getProviderParams(req);
  const normalizedChainId = ensureChainId(chainId);
  const resolvedAccountIndex = resolveAccountIndex(origin, accountIndex);
  await ensureProviderAccountReadableChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  return wallet.getCosmosKey(normalizedChainId, resolvedAccountIndex);
};

export const getOfflineSignerAccounts = async (req: ProviderRequestContext) => {
  const { origin } = req.session;
  const { chainId, accountIndex } = getProviderParams(req);
  const normalizedChainId = ensureChainId(chainId);
  const resolvedAccountIndex = resolveAccountIndex(origin, accountIndex);
  await ensureProviderAccountReadableChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  return wallet.getOfflineSignerAccounts(normalizedChainId, resolvedAccountIndex);
};
