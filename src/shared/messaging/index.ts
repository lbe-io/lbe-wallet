import BroadcastChannelMessage from './broadcastChannelMessage';
import PortMessage from './portMessage';

const Message = {
  BroadcastChannelMessage,
  PortMessage,
};

export { Message, BroadcastChannelMessage, PortMessage };
export { default as BaseMessage } from './base';
export * from './providerBridgeProtocol';
export * from './requestCorrelationService';
export default Message;
