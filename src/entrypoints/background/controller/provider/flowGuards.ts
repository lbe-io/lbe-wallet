import { rpcErrors } from '@/shared/rpc/errors';

import { resolveRequestedChainId } from './approvalPreview';
import { runProviderRequestGuards } from './guards';
import type { ProviderRequestContext } from './types';
import type { ProviderMethodMeta } from './providerMethodMeta';

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

export const executeProviderRequestGuards = (request: ProviderRequestContext, methodMeta?: ProviderMethodMeta) => {
  if (!methodMeta) {
    throw rpcErrors.rpc.methodNotFound();
  }

  const payload = toObjectRecord(request.data.params);
  runProviderRequestGuards({
    method: methodMeta.mapMethod,
    origin: request.session.origin,
    chainId: resolveRequestedChainId(payload),
    accountIndex: payload.accountIndex,
  });
};
