import LRU from 'lru-cache';

import { createPersistStore } from '@/entrypoints/background/utils';
import { ConnectedSite } from './types';

export type PermissionStore = {
  dumpCache: ReadonlyArray<LRU.Entry<string, ConnectedSite>>;
};

class PermissionService {
  store: PermissionStore = {
    dumpCache: [],
  };
  lruCache: LRU<string, ConnectedSite> | undefined;

  init = async () => {
    const storage = await createPersistStore<PermissionStore>({
      name: 'permission',
    });
    this.store = storage || this.store;

    this.lruCache = new LRU();
    const cache: ReadonlyArray<LRU.Entry<string, ConnectedSite>> = (this.store.dumpCache || []).map((item) => ({
      k: item.k,
      v: item.v,
      e: 0,
    }));
    this.lruCache.load(cache);
  };

  sync = () => {
    if (!this.lruCache) return;
    this.store.dumpCache = this.lruCache.dump();
  };

  getWithoutUpdate = (key: string) => {
    if (!this.lruCache) return;

    return this.lruCache.peek(key);
  };

  getSite = (origin: string) => {
    return this.lruCache?.get(origin);
  };

  setSite = (site: ConnectedSite) => {
    if (!this.lruCache) return;
    this.lruCache.set(site.origin, site);
    this.sync();
  };

  addConnectedSite = (origin: string, name: string, icon: string, isSigned = false, accountBinding: Partial<ConnectedSite> = {}) => {
    if (!this.lruCache) return;

    this.lruCache.set(origin, {
      origin,
      name,
      icon,
      isSigned,
      isTop: false,
      isConnected: true,
      enabledChains: [],
      activeChainId: '',
      accountId: accountBinding.accountId,
      walletId: accountBinding.walletId,
      accountIndex: accountBinding.accountIndex,
      accountAddress: accountBinding.accountAddress,
    });
    this.sync();
  };

  setEnabledChains = (origin: string, chainIds: string[], activeChainId?: string) => {
    if (!this.lruCache) return;
    const site = this.lruCache.get(origin);
    if (!site || !site.isConnected) return;

    const merged = Array.from(new Set([...(site.enabledChains || []), ...chainIds]));
    this.lruCache.set(origin, {
      ...site,
      enabledChains: merged,
      activeChainId: activeChainId || site.activeChainId || merged[0] || '',
    });
    this.sync();
  };

  setActiveChainId = (origin: string, activeChainId: string) => {
    if (!this.lruCache) return;
    const site = this.lruCache.get(origin);
    if (!site || !site.isConnected) return;

    this.lruCache.set(origin, {
      ...site,
      activeChainId,
    });
    this.sync();
  };

  setConnectedSiteBinding = (origin: string, value: Pick<ConnectedSite, 'accountId' | 'walletId' | 'accountIndex' | 'accountAddress'>) => {
    if (!this.lruCache) return;
    const site = this.lruCache.get(origin);
    if (!site || !site.isConnected) return;

    this.lruCache.set(origin, {
      ...site,
      accountId: value.accountId,
      walletId: value.walletId,
      accountIndex: value.accountIndex,
      accountAddress: value.accountAddress,
    });
    this.sync();
  };

  disableChains = (origin: string, chainIds?: string[]) => {
    if (!this.lruCache) return;
    const site = this.getConnectedSite(origin);
    if (!site) return;

    const currentChains = site.enabledChains || [];
    if (!chainIds || !chainIds.length) {
      this.setSite({
        ...site,
        isConnected: false,
        isSigned: false,
        enabledChains: [],
        activeChainId: '',
      });
      return;
    }

    const disabled = new Set(chainIds);
    const remainingChains = currentChains.filter((chainId) => !disabled.has(chainId));

    this.setSite({
      ...site,
      isConnected: remainingChains.length > 0,
      enabledChains: remainingChains,
      activeChainId: remainingChains.includes(site.activeChainId || '') ? site.activeChainId || '' : remainingChains[0] || '',
    });
  };

  hasEnabledChain = (origin: string, chainId: string) => {
    if (!this.lruCache) return false;
    const site = this.lruCache.get(origin);
    if (!site || !site.isConnected) return false;
    return !!site.enabledChains?.includes(chainId);
  };

  touchConnectedSite = (origin: string) => {
    if (!this.lruCache) return;
    this.lruCache.get(origin);
    this.sync();
  };

  updateConnectSite = (origin: string, value: Partial<ConnectedSite>, partialUpdate?: boolean) => {
    if (!this.lruCache || !this.lruCache.has(origin)) return;

    if (partialUpdate) {
      const _value = this.lruCache.get(origin);
      this.lruCache.set(origin, { ..._value, ...value } as ConnectedSite);
    } else {
      this.lruCache.set(origin, value as ConnectedSite);
    }

    this.sync();
  };

  hasPermission = (origin: string) => {
    if (!this.lruCache) return false;

    const site = this.lruCache.get(origin);
    return !!(site && site.isConnected);
  };

  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    this.lruCache?.load(
      sites
        .map((item) => ({
          e: 0,
          k: item.origin,
          v: item,
        }))
        .concat(
          (this.lruCache?.values() || [])
            .filter((item) => !item.isConnected)
            .map((item) => ({
              e: 0,
              k: item.origin,
              v: item,
            })),
        ),
    );
    this.sync();
  };

  getRecentConnectedSites = () => {
    const sites = (this.lruCache?.values() || []).filter((item) => item.isConnected);
    const pinnedSites = sites.filter((item) => item.isTop).sort((a, b) => (a.order || 0) - (b.order || 0));
    const recentSites = sites.filter((item) => !item.isTop);
    return [...pinnedSites, ...recentSites];
  };

  getConnectedSites = () => {
    return (this.lruCache?.values() || []).filter((item) => item.isConnected);
  };

  getConnectedSite = (key: string) => {
    const site = this.lruCache?.get(key);
    if (site && site.isConnected) {
      return site;
    }
  };

  getConnectedSiteBinding = (origin: string) => {
    const site = this.getConnectedSite(origin);
    if (!site) return;

    return {
      accountId: site.accountId,
      walletId: site.walletId,
      accountIndex: site.accountIndex,
      accountAddress: site.accountAddress,
    };
  };

  topConnectedSite = (origin: string, order?: number) => {
    const site = this.getConnectedSite(origin);
    if (!site || !this.lruCache) return;
    if (order === undefined) {
      const orders = this.getRecentConnectedSites()
        .map((item) => item.order || 0)
        .filter((v) => Number.isFinite(v));
      order = (orders.length ? Math.max(...orders) : 0) + 1;
    }
    this.updateConnectSite(origin, {
      ...site,
      order,
      isTop: true,
    });
  };

  unpinConnectedSite = (origin: string) => {
    const site = this.getConnectedSite(origin);
    if (!site || !this.lruCache) return;
    this.updateConnectSite(origin, {
      ...site,
      isTop: false,
    });
  };

  removeConnectedSite = (origin: string) => {
    if (!this.lruCache) return;
    const site = this.getConnectedSite(origin);
    if (!site) {
      return;
    }
    this.setSite({
      ...site,
      isConnected: false,
    });
    this.sync();
  };

  clearConnectedSites = () => {
    if (!this.lruCache) return;
    const sites = this.lruCache.values();
    sites.forEach((site) => {
      this.lruCache?.set(site.origin, {
        ...site,
        isConnected: false,
        isSigned: false,
        enabledChains: [],
        activeChainId: '',
      });
    });
    this.sync();
  };
}

export default new PermissionService();
