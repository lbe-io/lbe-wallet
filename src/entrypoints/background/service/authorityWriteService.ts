import permissionService from './permission';
import sessionService from './session';
import type { ConnectedSite } from './types';

type ConnectedSiteBinding = Pick<ConnectedSite, 'accountId' | 'walletId' | 'accountIndex' | 'accountAddress'>;

const normalizeOrigin = (origin: string) => (typeof origin === 'string' ? origin.trim() : '');
const normalizeChainId = (chainId: string) => (typeof chainId === 'string' ? chainId.trim() : '');

const broadcastOriginChainChange = (origin: string, chainId: string) => {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedChainId = normalizeChainId(chainId);
  if (!normalizedOrigin || !normalizedChainId) {
    return;
  }

  const payload = {
    chain: normalizedChainId,
    networkVersion: normalizedChainId,
  };

  sessionService.broadcastEvent('chainChanged', payload, normalizedOrigin);
  sessionService.broadcastEvent('networkChanged', payload, normalizedOrigin);
};

class AuthorityWriteService {
  connectOriginSite = (origin: string, name: string, icon: string, accountBinding: ConnectedSiteBinding = {}) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return;
    }

    permissionService.addConnectedSite(normalizedOrigin, name, icon, false, accountBinding);
  };

  setOriginEnabledChains = (origin: string, chainIds: string[], activeChainId?: string) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return;
    }

    permissionService.setEnabledChains(normalizedOrigin, chainIds, activeChainId);
    const nextChainId = permissionService.getConnectedSite(normalizedOrigin)?.activeChainId || normalizeChainId(activeChainId || '');
    if (nextChainId) {
      broadcastOriginChainChange(normalizedOrigin, nextChainId);
    }
  };

  setOriginActiveChain = (origin: string, chainId: string) => {
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedChainId = normalizeChainId(chainId);
    if (!normalizedOrigin || !normalizedChainId) {
      return;
    }

    permissionService.setActiveChainId(normalizedOrigin, normalizedChainId);
    const nextChainId = permissionService.getConnectedSite(normalizedOrigin)?.activeChainId || normalizedChainId;
    if (nextChainId) {
      broadcastOriginChainChange(normalizedOrigin, nextChainId);
    }
  };

  setOriginAccountBinding = (origin: string, accountBinding: ConnectedSiteBinding) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return;
    }

    permissionService.setConnectedSiteBinding(normalizedOrigin, accountBinding);
  };

  markOriginSigned = (origin: string) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return;
    }

    permissionService.updateConnectSite(normalizedOrigin, { isSigned: true }, true);
  };
}

export default new AuthorityWriteService();
