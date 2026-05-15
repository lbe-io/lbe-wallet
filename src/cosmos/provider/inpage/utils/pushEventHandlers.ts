import { rpcErrors } from '@/shared/rpc/errors';

import { LbeProvider } from '../injectableProvider';

class PushEventHandlers {
  provider: LbeProvider;

  constructor(provider: LbeProvider) {
    this.provider = provider;
  }

  _emit(event: string, data: unknown) {
    if (this.provider._initialized) {
      this.provider.emit(event, data);
    }
  }

  connect = (data: unknown) => {
    if (!this.provider._isConnected) {
      this.provider._isConnected = true;
      this.provider._state.isConnected = true;
      this._emit('connect', data);
    }
  };

  unlock = () => {
    this.provider._isUnlocked = true;
    this.provider._state.isUnlocked = true;
    window.dispatchEvent(new Event('lbe_keystorechange'));
  };

  lock = () => {
    this.provider._isUnlocked = false;
    this.provider._state.isUnlocked = false;
    window.dispatchEvent(new Event('lbe_keystorechange'));
  };

  disabled = (data?: unknown) => {
    this.provider._isConnected = false;
    this.provider._state.isConnected = false;
    this.provider._state.accounts = null;
    this.provider.selectedAddress = null;
    const disabledError = rpcErrors.provider.disabled({
      data,
      message: 'Provider disabled',
    });

    this._emit('accountsChanged', []);
    this._emit('disabled', disabledError);
  };

  accountsChanged = (accounts: string[]) => {
    if (accounts?.[0] === this.provider.selectedAddress) {
      return;
    }

    this.provider.selectedAddress = accounts?.[0];
    this.provider._state.accounts = accounts;
    window.dispatchEvent(new Event('lbe_keystorechange'));
    this._emit('accountsChanged', accounts);
  };

  chainChanged = ({ chain }: { chain: string; networkVersion?: string }) => {
    this.connect({});

    if (chain !== this.provider.chainId) {
      this.provider.chainId = chain;
      this._emit('chainChanged', chain);
    }
  };

  networkChanged = ({ networkVersion }: { networkVersion: string }) => {
    this.connect({});
    if (networkVersion !== this.provider.networkVersion) {
      this.provider.networkVersion = networkVersion;
      this._emit('networkChanged', networkVersion);
    }
  };

  handle = (event: string, data: unknown) => {
    const handlers: Record<string, (payload: unknown) => void> = {
      connect: (payload) => this.connect(payload),
      unlock: () => this.unlock(),
      lock: () => this.lock(),
      disabled: (payload) => this.disabled(payload),
      accountsChanged: (payload) => this.accountsChanged(Array.isArray(payload) ? (payload as string[]) : []),
      chainChanged: (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const { chain, networkVersion } = payload as { chain?: string; networkVersion?: string };
        if (typeof chain !== 'string') return;
        this.chainChanged({ chain, networkVersion });
      },
      networkChanged: (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const { networkVersion } = payload as { networkVersion?: string };
        if (typeof networkVersion !== 'string') return;
        this.networkChanged({ networkVersion });
      },
    };

    const handler = handlers[event];
    if (!handler) {
      return false;
    }
    handler(data);
    return true;
  };
}

export default PushEventHandlers;
