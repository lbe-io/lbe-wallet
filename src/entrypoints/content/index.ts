import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/sandbox';
import { nanoid } from 'nanoid';

import { Message } from '@/shared/messaging';
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,
  main: async () => {
    try {
      const channelName = nanoid();

      const container = document.head || document.documentElement;
      if (!container) {
        throw new Error('No DOM container available for inpage injection');
      }

      const scriptTag = document.createElement('script');
      scriptTag.setAttribute('async', 'false');
      scriptTag.setAttribute('channel', channelName);
      scriptTag.src = browser.runtime.getURL('/inpage.js');
      scriptTag.async = false;
      scriptTag.onload = () => {
        scriptTag.remove();
      };
      scriptTag.onerror = () => {
        scriptTag.remove();
      };

      container.insertBefore(scriptTag, container.firstChild);

      const { BroadcastChannelMessage, PortMessage } = Message;
      const pm = new PortMessage().connect(`provider:${channelName}`);

      const bcm = new BroadcastChannelMessage(channelName).listen((data: unknown) => {
        return pm.request(data);
      });

      pm.on('message', (data) => {
        bcm.send('message', data);
      });

      document.addEventListener('beforeunload', () => {
        bcm.dispose();
        pm.dispose();
      });
    } catch (error) {
      console.error('LBE: Provider injection failed.', error);
    }
  },
});
