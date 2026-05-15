import { EventEmitter } from 'events';
import BroadcastChannelMessage from '@/shared/messaging/broadcastChannelMessage';
import PushEventHandlers from './utils/pushEventHandlers';
import ReadyPromise from './utils/readyPromise';
import { $, domReadyCall } from './utils/utils';

const log = (event: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`%c [Lbe] (${new Date().toTimeString().slice(0, 8)}) ${event}`, 'font-weight: 600; background-color: #7d6ef9; color: white;', ...args);
  }
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        return val;
      },
      2,
    );
  } catch {
    return '';
  }
};

const cloneWithoutBigInt = <T>(value: T): T => {
  if (typeof value === 'bigint') {
    return String(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneWithoutBigInt(item)) as T;
  }
  if (value && typeof value === 'object') {
    if (value instanceof Uint8Array) {
      return value;
    }
    const cloned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      cloned[key] = cloneWithoutBigInt(val);
    });
    return cloned as T;
  }
  return value;
};

const RPC_INVALID_REQUEST = -32600;

type ProviderErrorKind = 'rpc' | 'provider' | 'internal';

type RpcError = Error & {
  code: number;
  module: 'lbewallet';
  kind: ProviderErrorKind;
  data?: unknown;
  toJSON: () => {
    module: 'lbewallet';
    kind: ProviderErrorKind;
    code: number;
    message: string;
    data?: unknown;
  };
};

const createRpcError = (code: number, message: string, kind: ProviderErrorKind = 'rpc', data?: unknown): RpcError => {
  const error = new Error(message) as RpcError;
  error.name = 'LbeProviderError';
  error.code = code;
  error.module = 'lbewallet';
  error.kind = kind;
  if (data !== undefined) {
    error.data = data;
  }
  error.toJSON = () => ({
    module: error.module,
    kind: error.kind,
    code: error.code,
    message: error.message,
    data: error.data,
  });
  return error;
};

const normalizeRpcError = (err: unknown): RpcError => {
  if (err instanceof Error) {
    const rpcErr = err as RpcError;
    if (typeof rpcErr.code !== 'number') {
      rpcErr.code = -1;
    }
    return rpcErr;
  }

  if (err && typeof err === 'object') {
    const maybe = err as Record<string, unknown>;
    const message = typeof maybe.message === 'string' && maybe.message ? maybe.message : 'Unknown provider error';
    const code = typeof maybe.code === 'number' ? maybe.code : -1;
    const kind = typeof maybe.kind === 'string' && ['rpc', 'provider', 'internal'].includes(maybe.kind) ? (maybe.kind as ProviderErrorKind) : 'provider';
    return createRpcError(code, message, kind, maybe.data);
  }

  return createRpcError(-1, String(err || 'Unknown provider error'), 'internal');
};

const script = document.currentScript;
const channelName = script?.getAttribute('channel') || 'LBE';

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}

type SessionContext = {
  icon: string;
  name: string;
  origin: string;
};

type ProviderRequest = {
  method: string;
  params?: Record<string, unknown>;
  session?: SessionContext;
};

type ProviderStateResponse = {
  chainId: string | null;
  accounts: string[];
  isUnlocked: boolean;
  networkVersion: string | null;
};

type BackgroundMessage = {
  event: string;
  data: unknown;
};

export class LbeProvider extends EventEmitter {
  _isConnected = false;
  _initialized = false;
  _isUnlocked = false;
  chainId: string | null = '0x1';
  selectedAddress: string | null = null;
  networkVersion: string | null = '1';
  isLbe = true;
  // Keep legacy marker for backward compatibility with existing dApp checks.
  isLumexs = true;
  nonEip6963Request = false;

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  private _pushEventHandlers: PushEventHandlers;
  private _requestPromise = new ReadyPromise(0);
  private _initializePromise: Promise<void> | null = null;
  private _keepAliveStarted = false;
  private _isDisposed = false;
  private _keepAliveTimer: ReturnType<typeof setTimeout> | null = null;

  private _bcm = new BroadcastChannelMessage(channelName);

  private _getPageLocation = () => {
    try {
      return window.top?.location || window.location;
    } catch {
      return window.location;
    }
  };

  private _buildSessionContext = (): SessionContext => {
    const loc = this._getPageLocation();
    const href = String(loc?.href || '')
      .split('#')[0]
      .split('?')[0];
    const protocol = String(loc?.protocol || '');
    const rawOrigin = String(loc?.origin || '');
    const origin = protocol === 'file:' || rawOrigin === 'null' ? href || 'file://' : rawOrigin;
    const icon = ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href || ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content || '';
    const name = document.title || ($('head > meta[name="title"]') as HTMLMetaElement)?.content || origin;
    return { icon, name, origin };
  };

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    this._pushEventHandlers = new PushEventHandlers(this);
    this.ensureInitialized();
  }

  private ensureInitialized = async () => {
    if (this._initialized) {
      return;
    }
    if (!this._initializePromise) {
      this._initializePromise = this.initialize().finally(() => {
        this._initializePromise = null;
      });
    }
    await this._initializePromise;
  };

  initialize = async () => {
    if (this._initialized) {
      return;
    }
    document.addEventListener('visibilitychange', this._requestPromiseCheckVisibility);

    this._bcm.connect().on('message', this._handleBackgroundMessage);
    domReadyCall(() => {
      const { origin, icon, name } = this._buildSessionContext();

      this._bcm.request({
        method: 'tabCheckin',
        params: { icon, name, origin },
      });
    });

    try {
      const { origin, icon, name } = this._buildSessionContext();
      const { chainId, accounts, isUnlocked, networkVersion } = await this._request<ProviderStateResponse>({
        method: 'getProviderState',
        session: { icon, name, origin },
      });
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      const normalizedChainId = chainId || '';
      const normalizedNetworkVersion = networkVersion || '';
      this.chainId = normalizedChainId;
      this.networkVersion = normalizedNetworkVersion;
      this.emit('connect', { chainId: normalizedChainId });
      this._pushEventHandlers.chainChanged({
        chain: normalizedChainId,
        networkVersion: normalizedNetworkVersion,
      });

      this._pushEventHandlers.accountsChanged(Array.isArray(accounts) ? accounts : []);
    } catch {
      //
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      this.emit('_initialized');
    }

    if (!this._keepAliveStarted) {
      this._keepAliveStarted = true;
      this.keepAlive();
    }
  };

  /**
   * Sending a message to the extension to receive will keep the service worker alive.
   */
  private keepAlive = () => {
    if (this._isDisposed) {
      return;
    }
    this._request({
      method: 'keepAlive',
      params: {},
    })
      .catch(() => {
        // Keep service-worker ping loop resilient.
      })
      .finally(() => {
        this._keepAliveTimer = setTimeout(() => {
          this.keepAlive();
        }, 1000);
      });
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }: BackgroundMessage) => {
    log('[push event]', event, data, this);
    if (this._pushEventHandlers.handle(event, data)) {
      return;
    }

    this.emit(event, data);
  };

  _request = async <T = unknown>(data: ProviderRequest): Promise<T> => {
    if (!data) {
      throw createRpcError(RPC_INVALID_REQUEST, 'Invalid request', 'rpc');
    }
    if (typeof data.method !== 'string' || !data.method.trim()) {
      throw createRpcError(RPC_INVALID_REQUEST, 'method is required', 'rpc');
    }

    this._requestPromiseCheckVisibility();

    const payload: ProviderRequest = {
      ...data,
      session: data?.session || this._buildSessionContext(),
    };

    return this._requestPromise.call(() => {
      log('[request]', safeStringify(payload));
      const sanitizedPayload = cloneWithoutBigInt(payload);
      return this._bcm
        .request(sanitizedPayload)
        .then((res) => {
          log('[request: success]', payload.method, res);
          return res as T;
        })
        .catch((err) => {
          const normalizedError = normalizeRpcError(err);
          log('[request: error]', payload.method, normalizedError);
          throw normalizedError;
        });
    });
  };
  // Public request API remains single-request by design for compatibility.
  request = async <T = unknown>(data: ProviderRequest): Promise<T> => {
    await this.ensureInitialized();

    const method = (data?.method || '').trim();
    if (!method) {
      throw createRpcError(RPC_INVALID_REQUEST, 'method is required', 'rpc');
    }
    return this._request<T>(data);
  };

  dispose = () => {
    this._isDisposed = true;
    if (this._keepAliveTimer) {
      clearTimeout(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
    document.removeEventListener('visibilitychange', this._requestPromiseCheckVisibility);
    this._bcm.dispose();
    this.removeAllListeners();
  };
}
