/**
 * this script is live in content-script / dapp's page
 */
import { rpcErrors } from '@/shared/rpc/errors';
import { EventEmitter } from 'events';

type MessageType = 'request' | 'response' | 'message';
type MessageListener = (data: unknown) => unknown | Promise<unknown>;

type PendingRequest = {
  data: unknown;
  resolve: (arg: unknown) => void;
  reject: (arg: unknown) => void;
};

type ResponsePayload = {
  ident: number;
  res?: unknown;
  err?: unknown;
};

type RequestPayload = {
  ident: number;
  data: unknown;
};

abstract class Message extends EventEmitter {
  // avaiable id list
  // max concurrent request limit
  private _requestIdPool = [...Array(500).keys()];
  protected _EVENT_PRE = 'LBE_WALLET_';
  protected listenCallback?: MessageListener;

  private _waitingMap = new Map<number, PendingRequest>();

  abstract send(type: MessageType | string, data: unknown): void;

  request = <TResponse = unknown>(data: unknown): Promise<TResponse> => {
    if (!this._requestIdPool.length) {
      throw rpcErrors.rpc.limitExceeded();
    }
    const ident = this._requestIdPool.shift()!;

    return new Promise<TResponse>((resolve, reject) => {
      this._waitingMap.set(ident, {
        data,
        resolve: resolve as (arg: unknown) => void,
        reject: reject as (arg: unknown) => void,
      });
      this.send('request', { ident, data });
    });
  };

  onResponse = async ({ ident, res, err }: Partial<ResponsePayload> = {}) => {
    if (typeof ident !== 'number') {
      return;
    }
    if (!this._waitingMap.has(ident)) {
      return;
    }

    const { resolve, reject } = this._waitingMap.get(ident)!;

    this._requestIdPool.push(ident);
    this._waitingMap.delete(ident);
    err ? reject(err) : resolve(res);
  };

  onRequest = async ({ ident, data }: RequestPayload) => {
    if (this.listenCallback) {
      let res: unknown;
      let err: { message: string; stack?: string; code?: unknown; data?: unknown } | undefined;

      try {
        res = await this.listenCallback(data);
      } catch (e: unknown) {
        const maybeError = e as { message?: string; stack?: string; code?: unknown; data?: unknown };
        err = {
          message: maybeError?.message || 'Unknown error',
          stack: maybeError?.stack,
        };
        if (maybeError?.code !== undefined) err.code = maybeError.code;
        if (maybeError?.data !== undefined) err.data = maybeError.data;
      }

      this.send('response', { ident, res, err });
    }
  };

  _dispose = () => {
    for (const request of this._waitingMap.values()) {
      request.reject(rpcErrors.provider.userRejectedRequest());
    }

    this._waitingMap.clear();
  };
}

export default Message;
