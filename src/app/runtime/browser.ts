import { browser, Tabs } from 'wxt/browser';

export const getCurrentTab = async (): Promise<Tabs.Tab> => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};
