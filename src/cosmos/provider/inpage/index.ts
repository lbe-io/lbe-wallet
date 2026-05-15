import type { AccountData } from '@cosmjs/proto-signing';
import { LbeProvider } from './injectableProvider';

type JsonRecord = Record<string, unknown>;

type LbeRequest = {
  method: string;
  params?: JsonRecord;
};

type LbeOfflineSigner = {
  getAccounts: () => Promise<AccountData[]>;
  signAmino: (signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) => Promise<unknown>;
  signDirect: (signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) => Promise<unknown>;
};

type LbeWalletApi = {
  isLbeWallet: true;

  request: <T = unknown>(data: LbeRequest) => Promise<T>;

  on: (event: string, listener: (...args: unknown[]) => void) => void;

  off: (event: string, listener: (...args: unknown[]) => void) => void;

  enable: (chainIds: string | string[]) => Promise<unknown>;

  disable: (chainIds?: string | string[]) => Promise<unknown>;

  getChainInfos: () => Promise<unknown>;

  getKey: (chainId: string) => Promise<unknown>;

  signAmino: (chainId: string, signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) => Promise<unknown>;

  signDirect: (chainId: string, signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) => Promise<unknown>;

  signArbitrary: (chainId: string, signer: string, data: string | number[] | Uint8Array) => Promise<unknown>;

  suggestChain: (chainInfo: JsonRecord) => Promise<unknown>;
};

declare global {
  interface Window {
    lbeWallet: LbeWalletApi;
    getOfflineSigner: (chainId: string) => LbeOfflineSigner;
    getOfflineSignerOnlyAmino: (chainId: string) => Pick<LbeOfflineSigner, 'getAccounts' | 'signAmino'>;
    getOfflineSignerAuto: (chainId: string) => LbeOfflineSigner;
  }
}

const shouldInject = () => {
  if (window.document.doctype?.name !== 'html') return false;
  return true;
};

export const lbeProvider = async () => {
  if (!shouldInject()) return;

  const provider = new LbeProvider();

  await new Promise((resolve) => {
    if (provider._state.initialized) {
      resolve(undefined);
    } else {
      provider.once('_initialized', () => resolve(undefined));
    }
  });

  const request = (method: string, params: JsonRecord = {}) => {
    return provider.request({
      method,
      params,
    } as LbeRequest);
  };

  const ensureChainIds = (chainIds: string | string[], method = 'enable') => {
    if (typeof chainIds === 'string') {
      const value = chainIds.trim();
      if (!value) {
        throw new Error(`${method}: chainIds is required`);
      }
      return value;
    }

    if (Array.isArray(chainIds)) {
      const values = chainIds.map((i) => (typeof i === 'string' ? i.trim() : '')).filter(Boolean);

      if (!values.length) {
        throw new Error(`${method}: chainIds is required`);
      }

      return Array.from(new Set(values));
    }

    throw new Error(`${method}: chainIds must be string or string[]`);
  };

  const normalizeOptionalChainIds = (chainIds?: string | string[]) => {
    if (chainIds === undefined) {
      return undefined;
    }
    return ensureChainIds(chainIds, 'disable');
  };

  const ensureChainId = (chainId: string, method: string) => {
    const value = (chainId || '').trim();

    if (!value) {
      throw new Error(`${method}: chainId is required`);
    }

    return value;
  };

  /**
   * Keplr-style signer
   */

  const getOfflineSigner = (chainId: string): LbeOfflineSigner => {
    const normalizedChainId = ensureChainId(chainId, 'getOfflineSigner');

    return {
      getAccounts: () =>
        request('getOfflineSignerAccounts', {
          chainId: normalizedChainId,
        }) as Promise<AccountData[]>,

      signAmino: (signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) =>
        request('signAmino', {
          chainId: normalizedChainId,
          signer,
          signDoc,
          signOptions,
        }),

      signDirect: (signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) =>
        request('signDirect', {
          chainId: normalizedChainId,
          signer,
          signDoc,
          signOptions,
        }),
    };
  };

  const getOfflineSignerOnlyAmino = (chainId: string) => {
    const signer = getOfflineSigner(chainId);
    return {
      getAccounts: signer.getAccounts,
      signAmino: signer.signAmino,
    };
  };

  const getOfflineSignerAuto = (chainId: string) => getOfflineSigner(chainId);

  const lbeWalletApi: LbeWalletApi = {
    isLbeWallet: true,

    request: <T = unknown>(data: LbeRequest): Promise<T> => {
      if (!data || typeof data !== 'object' || typeof data.method !== 'string') {
        throw new Error('request: { method, params } is required');
      }

      return provider.request({
        method: data.method,
        params: data.params || {},
      }) as Promise<T>;
    },

    on: (event, listener) => {
      provider.on(event, listener);
    },

    off: (event, listener) => {
      if (typeof provider.off === 'function') {
        provider.off(event, listener);
        return;
      }
      provider.removeListener(event, listener);
    },

    enable: (chainIds: string | string[]) => request('enable', { chainIds: ensureChainIds(chainIds, 'enable') }),

    disable: (chainIds?: string | string[]) => {
      const normalizedChainIds = normalizeOptionalChainIds(chainIds);
      return request('disable', normalizedChainIds ? { chainIds: normalizedChainIds } : {});
    },

    getChainInfos: () => request('getChainInfos'),

    getKey: (chainId: string) =>
      request('getKey', {
        chainId: ensureChainId(chainId, 'getKey'),
      }),

    signAmino: (chainId: string, signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) =>
      request('signAmino', {
        chainId: ensureChainId(chainId, 'signAmino'),
        signer,
        signDoc,
        signOptions,
      }),

    signDirect: (chainId: string, signer: string, signDoc: JsonRecord, signOptions?: JsonRecord) =>
      request('signDirect', {
        chainId: ensureChainId(chainId, 'signDirect'),
        signer,
        signDoc,
        signOptions,
      }),

    signArbitrary: (chainId: string, signer: string, data: string | number[] | Uint8Array) =>
      request('signArbitrary', {
        chainId: ensureChainId(chainId, 'signArbitrary'),
        signer,
        data,
      }),

    suggestChain: (chainInfo: JsonRecord) => request('suggestChain', { chainInfo }),
  };

  /**
   * Inject LBE Wallet API
   */

  Object.defineProperty(window, 'lbeWallet', {
    configurable: false,
    writable: false,
    value: Object.freeze(lbeWalletApi),
  });

  // Inject Keplr-style offline signer
  Object.defineProperty(window, 'getOfflineSigner', {
    configurable: false,
    writable: false,
    value: getOfflineSigner,
  });
  Object.defineProperty(window, 'getOfflineSignerOnlyAmino', {
    configurable: false,
    writable: false,
    value: getOfflineSignerOnlyAmino,
  });
  Object.defineProperty(window, 'getOfflineSignerAuto', {
    configurable: false,
    writable: false,
    value: getOfflineSignerAuto,
  });

  window.dispatchEvent(new Event('lbeWallet#initialized'));
};
