/* eslint-disable no-redeclare */
import { browserStorageLocalGet, browserStorageLocalSet } from './browser';
import { browser } from 'wxt/browser';

let cacheMap: Map<string, unknown> | null = null;

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

async function get<T = unknown>(prop: string): Promise<T | undefined>;
async function get<T = Record<string, unknown>>(prop?: undefined): Promise<T>;
async function get<T = unknown>(prop?: string): Promise<T | Record<string, unknown> | undefined> {
  if (cacheMap) {
    if (typeof prop === 'string') {
      return cacheMap.get(prop) as T | undefined;
    }
    return Object.fromEntries(cacheMap) as Record<string, unknown>;
  }

  const result = toRecord(await browserStorageLocalGet(null));
  cacheMap = new Map(Object.entries(result));

  if (typeof prop === 'string') {
    return result[prop] as T | undefined;
  }
  return result;
}

const set = async <T = unknown>(prop: string, value: T): Promise<void> => {
  await browserStorageLocalSet({ [prop]: value });
  if (!cacheMap) {
    cacheMap = new Map();
  }
  cacheMap.set(prop, value);
};

const byteInUse = async (): Promise<number> => {
  const getBytesInUse = (browser.storage?.local as { getBytesInUse?: (keys?: null | string | string[]) => Promise<number> }).getBytesInUse;
  if (!getBytesInUse) {
    throw new Error('ByteInUse only works in Chrome');
  }
  return getBytesInUse(null);
};

export default {
  get,
  set,
  byteInUse,
};
