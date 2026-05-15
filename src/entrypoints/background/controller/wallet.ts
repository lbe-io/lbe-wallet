import { authorityWriteService, keyringService, notificationService, permissionService, preferenceService, sessionService } from '@/entrypoints/background/service';
import { getWalletMnemonicBackupPending, updateWalletMnemonicBackupPending } from '@/cosmos/storage';
import { autoLockService } from '../service/autoLock';
import { ConnectedSite } from '../service/types';

export class WalletController {
  private resolveAddress = (address?: string) => {
    const value = address || preferenceService.getCurrentAccount();
    if (typeof value === 'string') {
      return value;
    }
    return (value as any)?.address || '';
  };

  // Wallet lifecycle and vault state.
  boot = async (password: string) => {
    await keyringService.boot(password);
    autoLockService.setLastActiveTime();
  };
  isBooted = () => keyringService.isBooted();

  getApproval = notificationService.getApproval;
  getApprovalRecovery = notificationService.getApprovalRecovery;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  hasVault = () => keyringService.hasVault();
  verifyPassword = (password: string) => keyringService.verifyPassword(password);
  changePassword = (password: string, newPassword: string) => keyringService.changePassword(password, newPassword);

  unlock = async (password: string) => {
    await keyringService.submitPassword(password);
    autoLockService.setLastActiveTime();
    sessionService.broadcastEvent('unlock');
  };
  isUnlocked = () => {
    return keyringService.memStore.getState().isUnlocked;
  };

  getRsaKey = () => {
    return keyringService.getRsaKey();
  };

  getDeviceId = () => {
    return keyringService.getDeviceId();
  };

  updateVault = (token: string) => keyringService.updateVault(token);

  getToken = () => {
    return keyringService.getToken();
  };

  updateSignMessage = (message: string) => keyringService.updateSignMessage(message);

  getSignMessage = () => {
    return keyringService.getSignMessage();
  };

  setPendingMnemonic = (mnemonic: string) => keyringService.setPendingMnemonic(mnemonic);

  getPendingMnemonic = () => keyringService.getPendingMnemonic();

  clearPendingMnemonic = () => keyringService.clearPendingMnemonic();

  setAccountMnemonic = (accountIndex: number | string, mnemonic: string) => keyringService.setAccountMnemonic(accountIndex, mnemonic);

  setAccountPrivateKey = (accountIndex: number | string, privateKey: string) => keyringService.setAccountPrivateKey(accountIndex, privateKey);

  // Deprecated compatibility wrappers.
  setPreMnemonics = (mnemonic: string) => this.setPendingMnemonic(mnemonic);
  getPreMnemonics = () => this.getPendingMnemonic();
  removePreMnemonics = () => this.clearPendingMnemonic();

  getMnemonic = () => keyringService.getMnemonic();
  getAccountMnemonic = (accountIndex?: number | string) => keyringService.getAccountMnemonic(accountIndex);
  exportAccountPrivateKeys = (password: string, accountIndex?: number | string) => keyringService.exportAccountPrivateKeys(password, accountIndex);

  clearWalletData = () => keyringService.clearWalletData();

  lockWallet = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('lock');
  };

  setAutoLockTime = async (time: number) => {
    autoLockService.setAutoLockTime(time);
    if (!keyringService.memStore.getState().isUnlocked) {
      autoLockService.clearTimer();
    }
    await keyringService.touchUnlockSession();
  };

  setLastActiveTime = async () => {
    if (!keyringService.memStore.getState().isUnlocked) {
      autoLockService.clearTimer();
      return;
    }
    autoLockService.setLastActiveTime();
    await keyringService.touchUnlockSession();
  };

  setPopupOpen = (isOpen: boolean) => {
    preferenceService.setPopupOpen(isOpen);
  };

  setCurrentAccount = (accounts: string) => {
    this.setSelectedAccount(accounts);
  };

  changeAccounts = (accounts: string) => {
    this.changeSelectedAccount(accounts);
  };

  setSelectedAccount = (accounts: string) => {
    preferenceService.setSelectedAccount(accounts);
  };

  changeSelectedAccount = (accounts: string) => {
    preferenceService.changeSelectedAccount(accounts);
  };

  getCurrentAccount = () => {
    return preferenceService.getCurrentAccount();
  };

  setAccountAliasName = async (accountKey: string, name: string) => {
    preferenceService.setAccountAliasName(accountKey, name);
  };

  getLocale = async () => {
    return preferenceService.getLocale();
  };

  setLocale = async (locale: string) => {
    preferenceService.setLocale(locale);
  };

  setChainId = (chainId: string, origin: string) => {
    if (origin && origin.trim()) {
      authorityWriteService.setOriginActiveChain(origin, chainId);
      return;
    }
    this.changeSelectedChain(chainId);
  };

  setSelectedChain = (chainId: string) => {
    preferenceService.setSelectedChain(chainId);
  };

  changeSelectedChain = (chainId: string) => {
    preferenceService.changeSelectedChain(chainId);
  };

  setOriginChainId = (chainId: string, origin: string) => {
    authorityWriteService.setOriginActiveChain(origin, chainId);
  };

  getChainId = () => {
    return preferenceService.getChainId();
  };

  connect = async () => {
    const account = preferenceService.getCurrentAccount();
    return [account];
  };

  getCosmosKey = (chainId: string, accountIndex?: number | string) => {
    return keyringService.getCosmosKey(chainId, accountIndex);
  };

  getOfflineSignerAccounts = (chainId: string, accountIndex?: number | string) => {
    return keyringService.getOfflineSignerAccounts(chainId, accountIndex);
  };

  signCosmosAmino = (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return keyringService.signCosmosAmino(chainId, signerAddress, signDoc, accountIndex);
  };

  signCosmosProviderAmino = (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return keyringService.signCosmosProviderAmino(chainId, signerAddress, signDoc, accountIndex);
  };

  signCosmosDirect = (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return keyringService.signCosmosDirect(chainId, signerAddress, signDoc, accountIndex);
  };

  signCosmosProviderDirect = (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return keyringService.signCosmosProviderDirect(chainId, signerAddress, signDoc, accountIndex);
  };

  signCosmosProviderArbitrary = (chainId: string, signerAddress: string, data: string | Uint8Array | number[], accountIndex?: number | string) => {
    return keyringService.signCosmosProviderArbitrary(chainId, signerAddress, data, accountIndex);
  };

  signCosmosArbitrary = (chainId: string, signerAddress: string, data: string | Uint8Array | number[], accountIndex?: number | string) => {
    return keyringService.signCosmosArbitrary(chainId, signerAddress, data, accountIndex);
  };

  verifyCosmosArbitrary = (chainId: string, signerAddress: string, data: string | Uint8Array | number[], signature: any) => {
    return keyringService.verifyCosmosArbitrary(chainId, signerAddress, data, signature);
  };

  sendCosmosTx = (chainId: string, txBytes: Uint8Array | string | number[], mode: 'sync' | 'async' | 'block' = 'sync') => {
    return keyringService.sendCosmosTx(chainId, txBytes, mode);
  };

  sendCosmosProviderTx = (chainId: string, txBytes: Uint8Array | string | number[], mode: 'sync' | 'async' | 'block' = 'sync') => {
    return keyringService.sendCosmosProviderTx(chainId, txBytes, mode);
  };

  getCosmosNativeBalance = (chainId: string, address?: string) => {
    const targetAddress = this.resolveAddress(address);
    if (!targetAddress) {
      throw new Error('No active account address');
    }
    return keyringService.getCosmosNativeBalance(chainId, targetAddress);
  };

  getCosmosStakingSummary = (chainId: string, address?: string) => {
    const targetAddress = this.resolveAddress(address);
    if (!targetAddress) {
      throw new Error('No active account address');
    }
    return keyringService.getCosmosStakingSummary(chainId, targetAddress);
  };

  getCosmosAssetSnapshot = (chainId: string, address?: string) => {
    const targetAddress = this.resolveAddress(address);
    if (!targetAddress) {
      throw new Error('No active account address');
    }
    return keyringService.getCosmosAssetSnapshot(chainId, targetAddress);
  };

  getCosmosTxHistory = (chainId: string, address?: string, limit = 30) => {
    const targetAddress = this.resolveAddress(address);
    if (!targetAddress) {
      throw new Error('No active account address');
    }
    return keyringService.getCosmosTxHistory(chainId, targetAddress, limit);
  };

  getCosmosNativePriceUsd = (chainId: string) => {
    return keyringService.getCosmosNativePriceUsd(chainId);
  };

  getConnectedSite = permissionService.getConnectedSite;
  getSite = permissionService.getSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getCurrentSite = (tabId: number): ConnectedSite | null => {
    const { origin, name, icon } = sessionService.getSession(tabId) || {};
    if (!origin) {
      return null;
    }
    const site = permissionService.getSite(origin);
    if (site) {
      return site;
    }
    return {
      origin,
      name: name || '',
      icon: icon || '',
      isConnected: false,
      isSigned: false,
      isTop: false,
    };
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('disabled', {}, origin);
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };

  disableConnectedSiteChains = (origin: string, chainIds: string[]) => {
    sessionService.broadcastEvent('disabled', { chainIds }, origin);
    permissionService.disableChains(origin, chainIds);
    if (!permissionService.hasPermission(origin)) {
      sessionService.broadcastEvent('accountsChanged', [], origin);
    }
  };

  clearConnectedSites = () => {
    permissionService.clearConnectedSites();
  };

  setMnemonicBackupPending = async (pending: boolean, walletId?: string) => {
    if (walletId) {
      await updateWalletMnemonicBackupPending(walletId, pending);
      return;
    }
    preferenceService.setMnemonicBackupPending(pending);
  };

  getMnemonicBackupPending = async (walletId?: string) => {
    if (walletId) {
      return getWalletMnemonicBackupPending(walletId);
    }
    return preferenceService.getMnemonicBackupPending();
  };
}
const wallet: { [key: string]: any } = new WalletController();

autoLockService.onAutoLock = async () => {
  await wallet.lockWallet();
};

export default wallet;
