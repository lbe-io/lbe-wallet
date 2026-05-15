import { authorityWriteService } from '@/entrypoints/background/service';
import { rpcErrors } from '@/shared/rpc/errors';
import wallet from '../wallet';

import { ensureAuthorizedOrigin } from './guards';
import { ensureSupportedChain, getProviderParams, normalizeChainIds } from './controllerShared';
import type { ProviderRequestContext } from './types';

export const disable = async (req: ProviderRequestContext) => {
  const { origin } = req.session;
  const { chainIds } = getProviderParams(req);
  const normalizedChainIds = normalizeChainIds(chainIds);

  if (normalizedChainIds.length) {
    normalizedChainIds.forEach(ensureSupportedChain);
    wallet.disableConnectedSiteChains(origin, normalizedChainIds);
    return true;
  }

  wallet.removeConnectedSite(origin);
  return true;
};

export const enable = async (req: ProviderRequestContext) => {
  const { origin } = req.session;
  const { chainIds } = getProviderParams(req);
  ensureAuthorizedOrigin(origin);

  const supportedChainIds = normalizeChainIds(chainIds);

  if (!supportedChainIds.length) {
    throw rpcErrors.rpc.invalidParams({
      message: 'chainIds is required',
    });
  }
  supportedChainIds.forEach(ensureSupportedChain);
  authorityWriteService.setOriginEnabledChains(origin, supportedChainIds, supportedChainIds[0]);

  return true;
};
