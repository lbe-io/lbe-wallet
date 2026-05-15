import { browserRuntimeConnect } from '@/entrypoints/background/webapi/browser';

import BaseMessage from './base';

type PortEnvelope = {
  _type_: string;
  data: unknown;
};

type RuntimePortLike = {
  onMessage: {
    addListener: (callback: (message: PortEnvelope) => void) => void;
  };
  postMessage: (message: PortEnvelope) => void;
  disconnect: () => void;
};

class PortMessage extends BaseMessage {
  port: RuntimePortLike | null = null;

  constructor(port?: RuntimePortLike) {
    super();

    if (port) {
      this.port = port;
    }
  }

  connect = (name?: string) => {
    this.port = browserRuntimeConnect(undefined, name ? { name } : undefined) as RuntimePortLike;
    this.port.onMessage.addListener(({ _type_, data }: PortEnvelope) => {
      if (_type_ === `${this._EVENT_PRE}message`) {
        this.emit('message', data);
        return;
      }

      if (_type_ === `${this._EVENT_PRE}response`) {
        if (data && typeof data === 'object' && typeof (data as { ident?: unknown }).ident === 'number') {
          this.onResponse(data as { ident: number; res?: unknown; err?: unknown });
        }
      }
    });

    return this;
  };

  listen = (listenCallback: (data: unknown) => unknown | Promise<unknown>) => {
    if (!this.port) return;
    this.listenCallback = listenCallback;
    this.port.onMessage.addListener(({ _type_, data }: PortEnvelope) => {
      if (_type_ === `${this._EVENT_PRE}request`) {
        if (data && typeof data === 'object' && typeof (data as { ident?: unknown }).ident === 'number') {
          this.onRequest(data as { ident: number; data: unknown });
        }
      }
    });

    return this;
  };

  send = (type: string, data: unknown) => {
    if (!this.port) return;
    try {
      this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data });
    } catch {
      // DO NOTHING BUT CATCH THIS ERROR
    }
  };

  dispose = () => {
    this._dispose();
    this.port?.disconnect();
  };
}

export default PortMessage;
