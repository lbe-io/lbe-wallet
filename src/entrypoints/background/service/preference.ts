import { createPersistStore } from '@/entrypoints/background/utils';
import { EVENTS } from '@/shared/constants';
import eventBus from '@/shared/events';
import { Account, AddressType, AppSummary, BitcoinBalance, NetworkType, TxHistoryItem } from '@/shared/legacyTypes';
import { createEmptyUICachedDataEntry, type UICachedDataEntry } from './preferenceHelpers';
import { applyLegacyPreferenceMigrations } from './preferenceMigrations';
import browser from '../webapi/browser';
import { LanguagePreferenceService } from './index';
import { getChainByChainId } from '@/cosmos/storage';
import { isValidLocale, type Locale } from '@/locales/types';
import { normalizeLocale } from '@/i18n';

export interface PreferenceStore {
  currentKeyringIndex: number;
  currentAccount: Account | undefined | null | string;
  chainId: string;
  externalLinkAck: boolean;
  balanceMap: {
    [address: string]: BitcoinBalance;
  };
  historyMap: {
    [address: string]: TxHistoryItem[];
  };
  locale: string;
  autoLockTime: number;
  watchAddressPreference: Record<string, number>;
  walletSavedList: [];
  aliasNames?: Record<string, string>;
  initAliasNames: boolean;
  currentVersion: string;
  firstOpen: boolean;
  currency: string;
  addressType: AddressType;
  networkType: NetworkType;
  keyringAliasNames: {
    [key: string]: string;
  };
  accountAliasNames: {
    [key: string]: string;
  };
  editingKeyringIndex: number;
  editingAccount: Account | undefined | null;
  uiCachedData: {
    [address: string]: UICachedDataEntry;
  };
  skippedVersion: string;
  appTab: {
    summary: AppSummary;
    readTabTime: number;
    readAppTime: { [key: string]: number };
  };
  mnemonicBackupPending: boolean;
}

const DEFAULT_LOCALE: Locale = 'en';
const SUPPORT_LOCALES: Locale[] = [DEFAULT_LOCALE];
const deepClone = <T>(value: T): T => {
  if (value == null) {
    return value;
  }
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

class PreferenceService {
  store!: PreferenceStore;
  popupOpen = false;
  hasOtherProvider = false;

  private emitUIAccountChange = (account?: string | null) => {
    if (!account) {
      return;
    }
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'accountsChanged',
      params: account,
    });
  };

  private emitUIChainChange = (chainId: string) => {
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'chainChanged',
      params: chainId,
    });
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'networkChanged',
      params: chainId,
    });
  };

  init = async () => {
    this.store = await createPersistStore<PreferenceStore>({
      name: 'preference',
      template: {
        currentKeyringIndex: 0,
        currentAccount: undefined,
        chainId: '',
        editingKeyringIndex: 0,
        editingAccount: undefined,
        externalLinkAck: false,
        balanceMap: {},
        historyMap: {},
        locale: DEFAULT_LOCALE,
        watchAddressPreference: {},
        walletSavedList: [],
        aliasNames: {},
        initAliasNames: false,
        currentVersion: '0',
        firstOpen: false,
        currency: 'USD',
        addressType: AddressType.P2WPKH,
        networkType: NetworkType.MAINNET,
        keyringAliasNames: {},
        accountAliasNames: {},
        uiCachedData: {},
        skippedVersion: '',
        appTab: {
          summary: { apps: [] },
          readAppTime: {},
          readTabTime: 1,
        },
        mnemonicBackupPending: false,
        autoLockTime: 15,
      },
    });
    const normalizedLocale = isValidLocale(this.store.locale) ? this.store.locale : DEFAULT_LOCALE;
    if (this.store.locale !== normalizedLocale) {
      this.store.locale = normalizedLocale;
    }
    applyLegacyPreferenceMigrations(this.store);

    // Sync UI language preference.
    LanguagePreferenceService.setPreferredLanguage(normalizedLocale).catch((error) => console.warn('Failed to set language preference:', error));

    if (!this.store.currency) {
      this.store.currency = 'USD';
    }

    if (!this.store.initAliasNames) {
      this.store.initAliasNames = false;
    }
    if (!this.store.externalLinkAck) {
      this.store.externalLinkAck = false;
    }

    if (!this.store.balanceMap) {
      this.store.balanceMap = {};
    }

    if (!this.store.historyMap) {
      this.store.historyMap = {};
    }

    if (!this.store.walletSavedList) {
      this.store.walletSavedList = [];
    }

    if (this.store.addressType === undefined || this.store.addressType === null) {
      this.store.addressType = AddressType.P2WPKH;
    }

    if (!this.store.networkType) {
      this.store.networkType = NetworkType.MAINNET;
    }

    if (!this.store.keyringAliasNames) {
      this.store.keyringAliasNames = {};
    }

    if (!this.store.accountAliasNames) {
      this.store.accountAliasNames = {};
    }

    if (!this.store.uiCachedData) {
      this.store.uiCachedData = {};
    }

    if (!this.store.skippedVersion) {
      this.store.skippedVersion = '';
    }

    if (!this.store.appTab) {
      this.store.appTab = { summary: { apps: [] }, readTabTime: 1, readAppTime: {} };
    }

    if (!this.store.appTab.readAppTime) {
      this.store.appTab.readAppTime = {};
    }
    if (!this.store.autoLockTime || this.store.autoLockTime < 0) {
      this.store.autoLockTime = 15;
    }

    if (typeof this.store.mnemonicBackupPending !== 'boolean') {
      this.store.mnemonicBackupPending = false;
    }
  };

  getPreference = (key?: string) => {
    if (key === 'isShowTestnet') {
      return true;
    }
    return key ? (this.store as any)[key] : { ...this.store, isShowTestnet: true };
  };

  setAutoLockTime = (time: number) => {
    this.store.autoLockTime = time;
  };

  getAcceptLanguages = async () => {
    let langs = await browser.i18n.getAcceptLanguages();
    if (!langs) langs = [];
    return langs.map((lang) => normalizeLocale(lang)).filter((lang): lang is Locale => isValidLocale(lang) && SUPPORT_LOCALES.includes(lang));
  };

  setCurrentAccount = (account?: string | null) => {
    this.store.currentAccount = account;
  };

  setSelectedAccount = (account?: string | null) => {
    this.setCurrentAccount(account);
  };

  changeAccounts = (account?: string | null) => {
    this.changeSelectedAccount(account);
  };

  changeSelectedAccount = (account?: string | null) => {
    this.store.currentAccount = account;
    this.emitUIAccountChange(account);
  };

  getCurrentAccount = () => {
    return this.store.currentAccount ? deepClone(this.store.currentAccount) : '';
  };

  setSelectedChain = (chain: string) => {
    const normalizedChainId = (chain || '').trim();
    if (!normalizedChainId) {
      return;
    }

    this.store.chainId = normalizedChainId;
  };

  changeSelectedChain = (chain: string) => {
    const normalizedChainId = (chain || '').trim();
    if (!normalizedChainId) {
      return;
    }

    this.store.chainId = normalizedChainId;
    this.emitUIChainChange(normalizedChainId);
  };

  setChainId = (chain: string, _origin: string) => {
    this.changeSelectedChain(chain);
  };

  getChainId = () => {
    return deepClone(this.store.chainId);
  };

  checkChainId = async (chainId: string) => {
    if (chainId === this.store.chainId) {
      return true;
    }

    const normalizedChainId = (chainId || '').trim();
    let chain = await getChainByChainId(normalizedChainId);

    if (!chain.length && normalizedChainId.startsWith('0x')) {
      const decimalChainId = BigInt(normalizedChainId).toString();
      chain = await getChainByChainId(decimalChainId);
    }

    if (!chain.length) {
      throw {
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Add or enable this chain first.`,
      };
    }

    return true;
  };

  // popupOpen
  setPopupOpen = (isOpen: boolean) => {
    this.popupOpen = isOpen;
  };

  getPopupOpen = () => {
    return this.popupOpen;
  };

  // addressBalance
  updateAddressBalance = (address: string, data: BitcoinBalance) => {
    const balanceMap = this.store.balanceMap || {};
    this.store.balanceMap = {
      ...balanceMap,
      [address]: data,
    };
  };

  removeAddressBalance = (address: string) => {
    const key = address;
    if (key in this.store.balanceMap) {
      const map = this.store.balanceMap;
      delete map[key];
      this.store.balanceMap = map;
    }
  };

  getAddressBalance = (address: string): BitcoinBalance | null => {
    const balanceMap = this.store.balanceMap || {};
    return balanceMap[address] || null;
  };

  // addressHistory
  updateAddressHistory = (address: string, data: TxHistoryItem[]) => {
    const historyMap = this.store.historyMap || {};
    this.store.historyMap = {
      ...historyMap,
      [address]: data,
    };
  };

  removeAddressHistory = (address: string) => {
    const key = address;
    if (key in this.store.historyMap) {
      const map = this.store.historyMap;
      delete map[key];
      this.store.historyMap = map;
    }
  };

  getAddressHistory = (address: string): TxHistoryItem[] => {
    const historyMap = this.store.historyMap || {};
    return historyMap[address] || [];
  };

  // externalLinkAck
  getExternalLinkAck = (): boolean => {
    return this.store.externalLinkAck;
  };

  setExternalLinkAck = (ack = false) => {
    this.store.externalLinkAck = ack;
  };

  // locale
  getLocale = () => {
    return this.store.locale;
  };

  setLocale = (locale: string) => {
    const normalizedLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
    this.store.locale = normalizedLocale;
    // Sync UI language preference.
    LanguagePreferenceService.setPreferredLanguage(normalizedLocale).catch((error) => console.warn('Failed to set language preference:', error));
  };

  // currency
  getCurrency = () => {
    return this.store.currency;
  };

  setCurrency = (currency: string) => {
    this.store.currency = currency;
  };

  // walletSavedList
  getWalletSavedList = () => {
    return this.store.walletSavedList || [];
  };

  updateWalletSavedList = (list: []) => {
    this.store.walletSavedList = list;
  };

  // aliasNames
  getInitAliasNameStatus = () => {
    return this.store.initAliasNames;
  };

  changeInitAliasNameStatus = () => {
    this.store.initAliasNames = true;
  };

  // Deprecated compatibility wrappers.
  getInitAlianNameStatus = () => this.getInitAliasNameStatus();
  changeInitAlianNameStatus = () => this.changeInitAliasNameStatus();

  // isFirstOpen
  getIsFirstOpen = () => {
    return this.store.firstOpen;
  };

  updateIsFirstOpen = () => {
    this.store.firstOpen = false;
  };

  // deprecate
  getAddressType = () => {
    return this.store.addressType;
  };

  // network type
  getNetworkType = () => {
    return this.store.networkType;
  };

  setNetworkType = (networkType: NetworkType) => {
    this.store.networkType = networkType;
  };

  // currentKeyringIndex
  getCurrentKeyringIndex = () => {
    return this.store.currentKeyringIndex;
  };

  setCurrentKeyringIndex = (keyringIndex: number) => {
    this.store.currentKeyringIndex = keyringIndex;
  };

  // keyringAliasNames
  setKeyringAliasName = (keyringKey: string, name: string) => {
    this.store.keyringAliasNames = Object.assign({}, this.store.keyringAliasNames, { [keyringKey]: name });
  };

  getKeyringAliasName = (keyringKey: string, defaultName?: string) => {
    const name = this.store.keyringAliasNames[keyringKey];
    if (!name && defaultName) {
      this.store.keyringAliasNames[keyringKey] = defaultName;
    }
    return this.store.keyringAliasNames[keyringKey];
  };

  // Deprecated compatibility wrappers.
  setKeyringAlianName = (keyringKey: string, name: string) => this.setKeyringAliasName(keyringKey, name);
  getKeyringAlianName = (keyringKey: string, defaultName?: string) => this.getKeyringAliasName(keyringKey, defaultName);

  // accountAliasNames
  setAccountAliasName = (accountKey: string, name: string) => {
    this.store.accountAliasNames = Object.assign({}, this.store.accountAliasNames, { [accountKey]: name });
  };

  getAccountAliasName = (accountKey: string, defaultName?: string) => {
    const name = this.store.accountAliasNames[accountKey];
    if (!name && defaultName) {
      this.store.accountAliasNames[accountKey] = defaultName;
    }
    return this.store.accountAliasNames[accountKey];
  };

  // Deprecated compatibility wrappers.
  setAccountAlianName = (accountKey: string, name: string) => this.setAccountAliasName(accountKey, name);
  getAccountAlianName = (accountKey: string, defaultName?: string) => this.getAccountAliasName(accountKey, defaultName);

  // editingKeyringIndex
  getEditingKeyringIndex = () => {
    return this.store.editingKeyringIndex;
  };

  setEditingKeyringIndex = (keyringIndex: number) => {
    this.store.editingKeyringIndex = keyringIndex;
  };

  // editingAccount
  getEditingAccount = () => {
    return deepClone(this.store.editingAccount);
  };

  setEditingAccount = (account?: Account | null) => {
    this.store.editingAccount = account;
  };

  getUICachedData = (address: string) => {
    if (!this.store.uiCachedData[address]) {
      this.store.uiCachedData[address] = createEmptyUICachedDataEntry();
    }
    return this.store.uiCachedData[address];
  };

  expireUICachedData = (address: string) => {
    this.store.uiCachedData[address] = createEmptyUICachedDataEntry();
  };

  getSkippedVersion = () => {
    return this.store.skippedVersion;
  };

  setSkippedVersion = (version: string) => {
    this.store.skippedVersion = version;
  };

  getAppTab = () => {
    return this.store.appTab;
  };

  setAppSummary = (appSummary: AppSummary) => {
    this.store.appTab.summary = appSummary;
  };

  setReadTabTime = (timestamp: number) => {
    this.store.appTab.readTabTime = timestamp;
  };

  setReadAppTime = (appid: number, timestamp: number) => {
    this.store.appTab.readAppTime[appid] = timestamp;
  };

  getMnemonicBackupPending = () => {
    return !!this.store.mnemonicBackupPending;
  };

  setMnemonicBackupPending = (pending: boolean) => {
    this.store.mnemonicBackupPending = pending;
  };
}

export default new PreferenceService();
