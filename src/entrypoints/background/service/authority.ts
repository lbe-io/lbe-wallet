import permissionService from './permission';
import preferenceService from './preference';

export type GlobalAuthorityState = {
  currentAccountAddress: string;
  currentChainId: string;
};

export type OriginAuthorityState = {
  origin: string;
  hasPermission: boolean;
  enabledChains: string[];
  activeChainId: string;
  accountId?: string;
  walletId?: string;
  accountIndex?: number | string;
  accountAddress?: string;
};

export type AuthorityStateReadModel = {
  global: GlobalAuthorityState;
  origin?: OriginAuthorityState;
};

const normalizeCurrentAccountAddress = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'address' in value) {
    const address = (value as { address?: unknown }).address;
    return typeof address === 'string' ? address : '';
  }
  return '';
};

export const getGlobalAuthorityState = (): GlobalAuthorityState => ({
  currentAccountAddress: normalizeCurrentAccountAddress(preferenceService.getCurrentAccount()),
  currentChainId: preferenceService.getChainId() || '',
});

export const getOriginAuthorityState = (origin: string): OriginAuthorityState | undefined => {
  const normalizedOrigin = typeof origin === 'string' ? origin.trim() : '';
  if (!normalizedOrigin) {
    return;
  }

  const site = permissionService.getConnectedSite(normalizedOrigin);
  if (!site) {
    return;
  }

  return {
    origin: normalizedOrigin,
    hasPermission: permissionService.hasPermission(normalizedOrigin),
    enabledChains: [...(site.enabledChains || [])],
    activeChainId: site.activeChainId || '',
    accountId: site.accountId,
    walletId: site.walletId,
    accountIndex: site.accountIndex,
    accountAddress: site.accountAddress,
  };
};

export const readAuthorityState = (origin?: string): AuthorityStateReadModel => {
  const global = getGlobalAuthorityState();
  const originState = origin ? getOriginAuthorityState(origin) : undefined;

  return originState
    ? {
        global,
        origin: originState,
      }
    : { global };
};

export const resolveAuthorityAccountAddress = (origin?: string, fallbackAddress?: string) => {
  const originState = origin ? getOriginAuthorityState(origin) : undefined;
  return originState?.accountAddress || fallbackAddress || getGlobalAuthorityState().currentAccountAddress;
};

export const resolveAuthorityChainId = (origin?: string, fallbackChainId?: string) => {
  const originState = origin ? getOriginAuthorityState(origin) : undefined;
  return originState?.activeChainId || fallbackChainId || getGlobalAuthorityState().currentChainId;
};
