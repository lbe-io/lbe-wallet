import { getOriginAuthorityState } from '@/entrypoints/background/service';
import { rpcErrors } from '@/shared/rpc/errors';

export type ProviderAuthorityGuardSpec = {
  requiresAuthorizedOrigin: boolean;
  requiresEnabledChain: boolean;
  requiresBoundAccount: boolean;
};

const DEFAULT_PROVIDER_AUTHORITY_GUARD_SPEC: ProviderAuthorityGuardSpec = {
  requiresAuthorizedOrigin: false,
  requiresEnabledChain: false,
  requiresBoundAccount: false,
};

export const PROVIDER_AUTHORITY_GUARD_MATRIX: Record<string, ProviderAuthorityGuardSpec> = {
  enable: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: false,
    requiresBoundAccount: false,
  },
  getKey: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: true,
  },
  getOfflineSignerAccounts: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: true,
  },
  signAmino: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: true,
  },
  signDirect: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: true,
  },
  signArbitrary: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: true,
  },
  sendTx: {
    requiresAuthorizedOrigin: true,
    requiresEnabledChain: true,
    requiresBoundAccount: false,
  },
} as const;

export const getProviderAuthorityGuardSpec = (method: string): ProviderAuthorityGuardSpec => PROVIDER_AUTHORITY_GUARD_MATRIX[method] || DEFAULT_PROVIDER_AUTHORITY_GUARD_SPEC;

export const parseProviderAccountIndex = (accountIndex: unknown): number | string | undefined => {
  if (accountIndex === undefined || accountIndex === null || accountIndex === '') {
    return undefined;
  }
  if (typeof accountIndex === 'number' && Number.isFinite(accountIndex)) {
    return accountIndex;
  }
  if (typeof accountIndex === 'string') {
    const raw = accountIndex.trim();
    if (!raw) return undefined;
    const numeric = Number(raw);
    if (Number.isInteger(numeric) && numeric >= 0) {
      return numeric;
    }
    throw rpcErrors.rpc.invalidParams({
      message: `Invalid accountIndex: ${accountIndex}`,
    });
  }
  throw rpcErrors.rpc.invalidParams({
    message: `Invalid accountIndex: ${String(accountIndex)}`,
  });
};

export const resolveBoundAccountIndex = ({ origin, requestedAccountIndex, boundAccountIndex }: { origin: string; requestedAccountIndex: unknown; boundAccountIndex: unknown }): number | string | undefined => {
  const normalizedRequested = parseProviderAccountIndex(requestedAccountIndex);
  const normalizedBound = parseProviderAccountIndex(boundAccountIndex);

  if (normalizedBound !== undefined) {
    if (normalizedRequested !== undefined && normalizedRequested !== normalizedBound) {
      throw rpcErrors.provider.unauthorized({
        message: `Site "${origin}" is authorized only for accountIndex "${normalizedBound}". Reconnect to switch accounts.`,
      });
    }
    return normalizedBound;
  }

  return normalizedRequested;
};

export const ensureAuthorizedOrigin = (origin: string) => {
  if (!getOriginAuthorityState(origin)?.hasPermission) {
    throw rpcErrors.provider.unauthorized();
  }
};

export const ensureEnabledChainForOrigin = (origin: string, chainId: string) => {
  const originState = getOriginAuthorityState(origin);
  if (!originState?.enabledChains.includes(chainId)) {
    throw rpcErrors.provider.unauthorized({
      message: `Chain "${chainId}" is not enabled for this site. Call lbe.enable first.`,
    });
  }
};

export const resolveAuthorizedAccountIndex = (origin: string, requestedAccountIndex: unknown): number | string | undefined => {
  const binding = getOriginAuthorityState(origin);
  return resolveBoundAccountIndex({
    origin,
    requestedAccountIndex,
    boundAccountIndex: binding?.accountIndex,
  });
};

export const runProviderRequestGuards = ({ method, origin, chainId, accountIndex }: { method: string; origin: string; chainId?: string; accountIndex?: unknown }) => {
  const guardSpec = getProviderAuthorityGuardSpec(method);

  if (guardSpec.requiresAuthorizedOrigin) {
    ensureAuthorizedOrigin(origin);
  }

  if (chainId && guardSpec.requiresEnabledChain) {
    ensureEnabledChainForOrigin(origin, chainId);
  }

  if (guardSpec.requiresBoundAccount) {
    resolveAuthorizedAccountIndex(origin, accountIndex);
  }
};
