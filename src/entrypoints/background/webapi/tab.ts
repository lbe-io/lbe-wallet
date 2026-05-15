import { EventEmitter } from 'events';
import { browser } from 'wxt/browser';

import { browserTabsCreate, browserTabsOnRemoved, browserTabsOnUpdated } from './browser';

const tabEvent = new EventEmitter();

browserTabsOnUpdated((tabId, changeInfo) => {
  if (changeInfo.url) {
    tabEvent.emit('tabUrlChanged', tabId, changeInfo.url);
  }
});

// window close will trigger this event also
browserTabsOnRemoved((tabId) => {
  tabEvent.emit('tabRemove', tabId);
});

const createTab = async (url: any): Promise<number | undefined> => {
  const tab = await browserTabsCreate({
    active: true,
    url,
  });

  return tab?.id;
};

const openIndexPage = (route = ''): Promise<number | undefined> => {
  const url = `index.html${route && `#${route}`}`;

  return createTab(url);
};

export default tabEvent;

export { createTab, openIndexPage };
