import { rpcErrors } from '@/shared/rpc/errors';
import { keyringService, sessionService } from '@/entrypoints/background/service';
import internalMethod from './internalMethod';
import rpcFlow from './rpcFlow';
import { tab } from '@/entrypoints/background/webapi';
import { ProviderRequestContext } from './types';

tab.on('tabRemove', (id) => {
  sessionService.deleteSessionsByTabId(id);
});

export default async (req: ProviderRequestContext) => {
  const {
    data: { method, session: requestSession },
  } = req;
  if (requestSession?.origin) {
    req.session.setProp(requestSession);
  }

  if (internalMethod[method]) {
    return internalMethod[method](req);
  }

  const hasVault = keyringService.hasVault();
  if (!hasVault) {
    throw rpcErrors.provider.userRejectedRequest({
      message: 'the wallet has not been logged in',
    });
  }
  return rpcFlow(req);
};
