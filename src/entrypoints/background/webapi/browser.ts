import { browser } from 'wxt/browser';

type BrowserApi = typeof browser;

type WindowsGetCurrentParams = Parameters<BrowserApi['windows']['getCurrent']>[0];
type WindowsCreateParams = Parameters<BrowserApi['windows']['create']>[0];
type WindowsUpdateParams = Parameters<BrowserApi['windows']['update']>;
type StorageLocalGetArg = Parameters<BrowserApi['storage']['local']['get']>[0];
type StorageLocalSetArg = Parameters<BrowserApi['storage']['local']['set']>[0];
type TabsQueryParams = Parameters<BrowserApi['tabs']['query']>[0];
type TabsCreateParams = Parameters<BrowserApi['tabs']['create']>[0];
type TabsUpdateParams = Parameters<BrowserApi['tabs']['update']>[0];
type RuntimeOnConnectListener = Parameters<BrowserApi['runtime']['onConnect']['addListener']>[0];
type RuntimeOnInstalledListener = Parameters<BrowserApi['runtime']['onInstalled']['addListener']>[0];
type RuntimeConnectInfo = Parameters<BrowserApi['runtime']['connect']>[0];
type WindowsOnFocusChangedListener = Parameters<BrowserApi['windows']['onFocusChanged']['addListener']>[0];
type WindowsOnRemovedListener = Parameters<BrowserApi['windows']['onRemoved']['addListener']>[0];
type TabsOnUpdatedListener = Parameters<BrowserApi['tabs']['onUpdated']['addListener']>[0];
type TabsOnRemovedListener = Parameters<BrowserApi['tabs']['onRemoved']['addListener']>[0];

export async function browserWindowsGetCurrent(params?: WindowsGetCurrentParams) {
  return await browser.windows.getCurrent(params);
}

export async function browserWindowsCreate(params?: WindowsCreateParams) {
  return await browser.windows.create(params);
}

export async function browserWindowsUpdate(windowId: WindowsUpdateParams[0], updateInfo: WindowsUpdateParams[1]) {
  return await browser.windows.update(windowId, updateInfo);
}

export async function browserWindowsRemove(windowId: number) {
  return await browser.windows.remove(windowId);
}

export async function browserStorageLocalGet(val: StorageLocalGetArg) {
  return await browser.storage.local.get(val);
}

export async function browserStorageLocalSet(val: StorageLocalSetArg) {
  return await browser.storage.local.set(val);
}

export async function browserTabsGetCurrent() {
  return await browser.tabs.getCurrent();
}

export async function browserTabsQuery(params: TabsQueryParams) {
  return await browser.tabs.query(params);
}

export async function browserTabsCreate(params: TabsCreateParams) {
  return await browser.tabs.create(params);
}

export async function browserTabsUpdate(tabId: number, params: TabsUpdateParams) {
  return await (browser.tabs.update as unknown as (tabId: number, params: TabsUpdateParams) => Promise<unknown>)(tabId, params);
}

export function browserWindowsOnFocusChanged(listener: WindowsOnFocusChangedListener) {
  browser.windows.onFocusChanged.addListener(listener);
}

export function browserWindowsOnRemoved(listener: WindowsOnRemovedListener) {
  browser.windows.onRemoved.addListener(listener);
}

export function browserTabsOnUpdated(listener: TabsOnUpdatedListener) {
  browser.tabs.onUpdated.addListener(listener);
}

export function browserTabsOnRemoved(listener: TabsOnRemovedListener) {
  browser.tabs.onRemoved.addListener(listener);
}

export function browserRuntimeOnConnect(listener: RuntimeOnConnectListener) {
  browser.runtime.onConnect.addListener(listener);
}

export function browserRuntimeOnInstalled(listener: RuntimeOnInstalledListener) {
  browser.runtime.onInstalled.addListener(listener);
}

export function browserRuntimeConnect(extensionId?: string, connectInfo?: RuntimeConnectInfo) {
  if (extensionId) {
    return (browser.runtime.connect as unknown as (extensionId: string, connectInfo?: RuntimeConnectInfo) => ReturnType<BrowserApi['runtime']['connect']>)(extensionId, connectInfo);
  }
  return browser.runtime.connect(connectInfo);
}

export default browser;
