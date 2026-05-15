import { EventEmitter } from 'events';
import browser, { browserWindowsCreate, browserWindowsGetCurrent, browserWindowsOnFocusChanged, browserWindowsOnRemoved, browserWindowsRemove, browserWindowsUpdate } from './browser';
import { POPUP_SIZE } from '@/popup/constants';

const event = new EventEmitter();

browserWindowsOnFocusChanged((winId) => {
  event.emit('windowFocusChange', winId);
});

browserWindowsOnRemoved((winId) => {
  event.emit('windowRemoved', winId);
});

const BROWSER_HEADER = 80;
const WINDOW_SIZE = {
  width: POPUP_SIZE.width,
  height: POPUP_SIZE.height,
};

type BrowserWindow = Awaited<ReturnType<typeof browserWindowsGetCurrent>>;
type BrowserWindowCreateParams = Parameters<typeof browser.windows.create>[0];
type WindowCreateInput = Omit<BrowserWindowCreateParams, 'url'> & { url: string };
type NotificationOpenParams = Omit<BrowserWindowCreateParams, 'url'> & { route?: string };

const toNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const create = async ({ url, ...rest }: WindowCreateInput): Promise<number | undefined> => {
  const {
    top: cTop,
    left: cLeft,
    width,
  } = await browserWindowsGetCurrent({
    windowTypes: ['normal'],
  } as unknown as Parameters<typeof browserWindowsGetCurrent>[0]);

  const top = toNumber(cTop) + BROWSER_HEADER;
  const left = toNumber(cLeft) + toNumber(width) - WINDOW_SIZE.width;

  const currentWindow = await browserWindowsGetCurrent();
  let win: BrowserWindow;
  if (currentWindow.state === 'fullscreen') {
    // browser.windows.create not pass state to chrome
    win = await browserWindowsCreate({
      focused: true,
      url,
      type: 'popup',
      ...(rest as Omit<BrowserWindowCreateParams, 'url'>),
      width: undefined,
      height: undefined,
      left: undefined,
      top: undefined,
      state: 'fullscreen',
    });
  } else {
    win = await browserWindowsCreate({
      focused: true,
      url,
      type: 'popup',
      top,
      left,
      ...WINDOW_SIZE,
      ...(rest as Omit<BrowserWindowCreateParams, 'url'>),
    });
  }

  // shim firefox
  if (win.left !== left && typeof win.id === 'number') {
    await browserWindowsUpdate(win.id, { left, top });
  }

  return win.id;
};

const remove = async (winId: number) => {
  return browserWindowsRemove(winId);
};

const openNotification = ({ route = '', ...rest }: NotificationOpenParams = {} as NotificationOpenParams): Promise<number | undefined> => {
  const url = `/popup.html${route && `#${route}`}?create=true`;

  return create({ url, ...(rest as Omit<BrowserWindowCreateParams, 'url'>) });
};

export default {
  openNotification,
  event,
  remove,
};
