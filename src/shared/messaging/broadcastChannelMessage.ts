import BaseMessage from './base';

type BroadcastMessageEnvelope = {
  type: string;
  data: unknown;
};

export default class BroadcastChannelMessage extends BaseMessage {
  private _channel: BroadcastChannel;

  constructor(name?: string) {
    super();
    if (!name) {
      throw new Error('the broadcastChannel name is missing');
    }

    this._channel = new BroadcastChannel(name);
  }

  connect = () => {
    this._channel.onmessage = (event: MessageEvent<BroadcastMessageEnvelope>) => {
      const type = event?.data?.type;
      const data = event?.data?.data;
      if (type === 'message') {
        this.emit('message', data);
      } else if (type === 'response') {
        if (data && typeof data === 'object' && typeof (data as { ident?: unknown }).ident === 'number') {
          this.onResponse(data as { ident: number; res?: unknown; err?: unknown });
        }
      }
    };

    return this;
  };

  listen = (listenCallback: (data: unknown) => unknown | Promise<unknown>) => {
    this.listenCallback = listenCallback;

    this._channel.onmessage = (event: MessageEvent<BroadcastMessageEnvelope>) => {
      const type = event?.data?.type;
      const data = event?.data?.data;
      if (type === 'request') {
        if (data && typeof data === 'object' && typeof (data as { ident?: unknown }).ident === 'number') {
          this.onRequest(data as { ident: number; data: unknown });
        }
      }
    };

    return this;
  };

  send = (type: string, data: unknown) => {
    this._channel.postMessage({
      type,
      data,
    });
  };

  dispose = () => {
    this._dispose();
    this._channel.close();
  };
}
