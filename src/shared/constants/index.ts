export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);

export const IS_FIREFOX = /Firefox\//i.test(navigator.userAgent);

export const IS_LINUX = /linux/i.test(navigator.userAgent);

export const LANGS = [
  {
    value: 'en',
    label: 'English',
  },
  {
    value: 'zh-CN',
    label: 'Chinese (Simplified)',
  },
  {
    value: 'zh-TW',
    label: 'Chinese (Traditional)',
  },
];

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  COSMOS_ASSET_REFRESH: 'COSMOS_ASSET_REFRESH',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED',
  },
  LOCK_WALLET: 'LOCK_WALLET',
};
