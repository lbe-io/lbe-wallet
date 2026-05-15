import { EventEmitter } from 'events';
import { AddressType } from '@/shared/legacyTypes';
import { ObservableStore } from '@/shared/store/observableStore';
import { v4 as uuidv4 } from 'uuid';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { Secp256k1, Secp256k1Signature, sha256, stringToPath } from '@cosmjs/crypto';
import { fromBase64, fromHex, toBase64, toBech32, toHex, toUtf8 } from '@cosmjs/encoding';
import { StargateClient } from '@cosmjs/stargate';
import { rawSecp256k1PubkeyToRawAddress, serializeSignDoc } from '@cosmjs/amino';
import { getCosmosChainConfig, SUPPORTED_COSMOS_CHAIN_IDS } from '@/cosmos/chains/chain-registry';
import { getChainSourceByChainId, getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { buildRuntimeUnsupportedEntryError, ensureRuntimeChainRpcContext, ensureRuntimeProviderSendTxContext, ensureRuntimeExecutableQueryContext, getRuntimeUnsupportedErrorData } from '@/cosmos/chains/runtimeChainAdapter';
import { normalizeAccountIndex, resolveAccountSourceFromOverrideState, toAddressProjection, toIndexedAccountIdentity } from '@/cosmos/storage/accountIdentity';
import {
  type CosmosAssetSnapshot,
  type CosmosNativeBalance,
  type CosmosSignMode,
  type CosmosStakingSummary,
  type CosmosTokenBalance,
  type CosmosTokenBalanceRequest,
  type CosmosTxHistoryItem,
  type Keyring,
  type MemStoreState,
} from './types';
import { decryptWithMasterKey, encryptWithMasterKey, generateMasterKey, sealSessionMasterKey, unsealSessionMasterKey, unwrapMasterKey, validatePasswordStrength, wrapMasterKey } from './secureVaultCrypto';
import {
  DEFAULT_UNLOCK_MAX_BACKOFF_MS,
  ensureUnlockAllowed as ensureUnlockAllowedByState,
  fromUnlockGuardRecord,
  markUnlockFailure as markUnlockFailureByState,
  markUnlockSuccess as markUnlockSuccessState,
  toUnlockGuardRecord,
} from './unlockGuard';
import { browser } from 'wxt/browser';
import {
  getAminoWalletForChain as resolveAminoWalletForChain,
  getAminoWalletForProviderSignAminoChain as resolveAminoWalletForProviderSignAminoChain,
  getAminoWalletForProviderSignArbitraryChain as resolveAminoWalletForProviderSignArbitraryChain,
  getDirectWalletForAccountReadChain as resolveDirectWalletForAccountReadChain,
  getDirectWalletForProviderSignDirectChain as resolveDirectWalletForProviderSignDirectChain,
  getDirectWalletForChain as resolveDirectWalletForChain,
} from './signerResolver';
import { getCosmosKeyWithSigningDeps, getOfflineSignerAccountsWithSigningDeps, signCosmosAminoWithSigningDeps, signCosmosArbitraryWithSigningDeps, signCosmosDirectWithSigningDeps } from './signingService';
import { sendCosmosTxWithDeps } from './txBroadcastService';
import { resolveSignerMaterial, resolveSignerMaterialWithKey, type ResolvedSignerMaterial, type SignerMaterial } from './signerMaterialResolver';
import { getCosmosAssetSnapshotWithDeps, getCosmosNativeBalanceWithDeps, getCosmosTokenBalancesWithDeps } from './assetQueryService';
import { getCosmosStakingSummaryWithDeps } from './stakingQueryService';
import { getCosmosTxHistoryWithDeps } from './txHistoryQueryService';
import { getCosmosNativePriceUsdWithDeps } from './priceQueryService';
import { decryptStoredSecretWithKey, readAccountMnemonicOverride, readAccountMnemonicOverrideWithKey, readAccountPrivateKeyOverride, readAccountPrivateKeyOverrideWithKey, readPrimaryMnemonicWithKey } from './keystoreAccess';
import { buildAccountMnemonicOverrideWrite, buildAccountPrivateKeyOverrideWrite, buildClearedWalletState, buildPrimaryMnemonicWrite } from './keystoreWriteAccess';
import preference from '../preference';
import {
  buildClearedPendingMnemonicPatch,
  buildClearedWalletMemStorePatch,
  buildLockedMemStorePatch,
  buildPendingMnemonicPatch,
  buildRestoredUnlockRuntimeState,
  buildUnlockedMemStorePatch,
  clearRuntimeSessionState,
  createInitialMemStoreState,
  getPendingMnemonicValue,
  resolveRuntimeMnemonic,
} from './keystoreSessionState';

export const KEYRING_CLASS = {
  MNEMONIC: 'CosmosHdKeyring',
};

export const KEYRING_SDK_TYPES = {
  [KEYRING_CLASS.MNEMONIC]: {
    type: KEYRING_CLASS.MNEMONIC,
  },
};

const LEGACY_UNLOCK_SESSION_STORAGE_KEY = 'unlockSessionState';
const UNLOCK_SESSION_STORAGE_KEY = 'unlockSessionStateV2';
const UNLOCK_GUARD_STORAGE_KEY = 'unlockGuardState';
const PRIVATE_KEY_PATTERN = /^[0-9a-f]+$/i;

type UnlockSessionRecord = {
  version: 1;
  updatedAt: number;
  expiresAt: number;
  sealedMasterKey: string;
};

const serializeBigInt = <T>(value: T): T => {
  if (typeof value === 'bigint') {
    return value.toString() as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item)) as T;
  }
  if (value && typeof value === 'object') {
    if (value instanceof Uint8Array) {
      return value;
    }
    const cloned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      cloned[key] = serializeBigInt(val);
    });
    return cloned as T;
  }
  return value;
};

export class KeyringService extends EventEmitter {
  //
  // PUBLIC METHODS
  //
  keyringTypes: any[];
  store!: ObservableStore<any>;
  memStore: ObservableStore<MemStoreState>;
  keyrings: Keyring[];
  addressTypes: AddressType[];
  masterKey: Uint8Array | null = null;
  failedUnlockCount = 0;
  nextUnlockAllowedAt = 0;
  unlockSessionMnemonic: string | null = null;
  publicKey: string = '';
  privateKey: string = '';
  deviceId: string = '';
  private stargateClientCache: Map<string, Promise<StargateClient>> = new Map();
  private accountMnemonicCache: Map<number, string> = new Map();
  private accountPrivateKeyCache: Map<number, Uint8Array> = new Map();

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.memStore = new ObservableStore<MemStoreState>(createInitialMemStoreState(this.keyringTypes.map((krt) => krt.type)));

    this.keyrings = [];
    this.addressTypes = [];
  }

  loadStore = (initState: any) => {
    this.store = new ObservableStore<any>(initState || {});
  };

  private getMasterKeyOrThrow = () => {
    if (!this.masterKey || this.masterKey.length === 0) {
      throw new Error('Wallet is locked');
    }
    return this.masterKey;
  };

  private setMasterKey = (next: Uint8Array | null) => {
    if (this.masterKey) {
      this.masterKey.fill(0);
    }
    this.masterKey = next;
  };

  private ensureUnlockAllowed = () => {
    ensureUnlockAllowedByState({
      failedUnlockCount: this.failedUnlockCount,
      nextUnlockAllowedAt: this.nextUnlockAllowedAt,
    });
  };

  private markUnlockFailure = () => {
    const next = markUnlockFailureByState(
      {
        failedUnlockCount: this.failedUnlockCount,
        nextUnlockAllowedAt: this.nextUnlockAllowedAt,
      },
      Date.now(),
      DEFAULT_UNLOCK_MAX_BACKOFF_MS,
    );
    this.failedUnlockCount = next.failedUnlockCount;
    this.nextUnlockAllowedAt = next.nextUnlockAllowedAt;
    void this.persistUnlockGuard().catch(() => undefined);
  };

  private markUnlockSuccess = () => {
    const next = markUnlockSuccessState();
    this.failedUnlockCount = next.failedUnlockCount;
    this.nextUnlockAllowedAt = next.nextUnlockAllowedAt;
    void this.clearUnlockGuard().catch(() => undefined);
  };

  private encryptSecret = async (value: string) => {
    return encryptWithMasterKey(this.getMasterKeyOrThrow(), value);
  };

  private decryptSecret = async (encrypted: string) => {
    if (!encrypted) {
      throw new Error('Encrypted value is required');
    }
    return decryptWithMasterKey(this.getMasterKeyOrThrow(), encrypted);
  };

  private getUnlockStorage = () => {
    const sessionStorage = (browser?.storage as any)?.session;
    if (!sessionStorage || typeof sessionStorage.get !== 'function' || typeof sessionStorage.set !== 'function') {
      return null;
    }
    return sessionStorage;
  };

  private persistUnlockGuard = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return;
    }
    await storage.set({
      [UNLOCK_GUARD_STORAGE_KEY]: toUnlockGuardRecord({
        failedUnlockCount: this.failedUnlockCount,
        nextUnlockAllowedAt: this.nextUnlockAllowedAt,
      }),
    });
  };

  private clearUnlockGuard = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return;
    }
    if (typeof storage.remove === 'function') {
      await storage.remove(UNLOCK_GUARD_STORAGE_KEY);
      return;
    }
    await storage.set({
      [UNLOCK_GUARD_STORAGE_KEY]: null,
    });
  };

  private readUnlockGuard = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return null;
    }
    const data = await storage.get(UNLOCK_GUARD_STORAGE_KEY);
    const state = data?.[UNLOCK_GUARD_STORAGE_KEY];
    if (!state || typeof state !== 'object') {
      return null;
    }
    return fromUnlockGuardRecord(state);
  };

  private clearLegacyUnlockSession = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return;
    }
    if (typeof storage.remove === 'function') {
      await storage.remove(LEGACY_UNLOCK_SESSION_STORAGE_KEY);
      return;
    }
    await storage.set({
      [LEGACY_UNLOCK_SESSION_STORAGE_KEY]: null,
    });
  };

  private clearUnlockSession = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return;
    }
    if (typeof storage.remove === 'function') {
      await storage.remove([LEGACY_UNLOCK_SESSION_STORAGE_KEY, UNLOCK_SESSION_STORAGE_KEY]);
      return;
    }
    await storage.set({
      [LEGACY_UNLOCK_SESSION_STORAGE_KEY]: null,
      [UNLOCK_SESSION_STORAGE_KEY]: null,
    });
  };

  private getUnlockSessionTtlMs = () => {
    const autoLockTime = Number(preference.getPreference('autoLockTime'));
    if (!Number.isFinite(autoLockTime) || autoLockTime <= 0) {
      return 0;
    }
    return Math.floor(autoLockTime * 60 * 1000);
  };

  private toUnlockSessionRecord = async (now = Date.now()): Promise<UnlockSessionRecord | null> => {
    const ttlMs = this.getUnlockSessionTtlMs();
    if (!this.masterKey || ttlMs <= 0) {
      return null;
    }
    return {
      version: 1,
      updatedAt: now,
      expiresAt: now + ttlMs,
      sealedMasterKey: await sealSessionMasterKey(this.masterKey),
    };
  };

  private readUnlockSession = async (): Promise<UnlockSessionRecord | null> => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return null;
    }
    const data = await storage.get(UNLOCK_SESSION_STORAGE_KEY);
    const record = data?.[UNLOCK_SESSION_STORAGE_KEY];
    if (!record || typeof record !== 'object') {
      return null;
    }
    const value = record as Partial<UnlockSessionRecord>;
    if (value.version !== 1 || typeof value.updatedAt !== 'number' || typeof value.expiresAt !== 'number' || typeof value.sealedMasterKey !== 'string') {
      return null;
    }
    return value as UnlockSessionRecord;
  };

  private persistUnlockSession = async () => {
    const storage = this.getUnlockStorage();
    if (!storage) {
      return;
    }
    const record = await this.toUnlockSessionRecord();
    if (!record) {
      await this.clearUnlockSession();
      return;
    }
    await storage.set({
      [UNLOCK_SESSION_STORAGE_KEY]: record,
    });
  };

  restoreUnlockSession = async () => {
    const unlockGuard = await this.readUnlockGuard();
    const restored = buildRestoredUnlockRuntimeState(unlockGuard);
    this.failedUnlockCount = restored.failedUnlockCount;
    this.nextUnlockAllowedAt = restored.nextUnlockAllowedAt;
    if (!unlockGuard) {
      await this.clearUnlockGuard();
    }

    await this.clearLegacyUnlockSession();
    const record = await this.readUnlockSession();
    if (!record) {
      this.unlockSessionMnemonic = restored.unlockSessionMnemonic;
      return false;
    }

    if (record.expiresAt <= Date.now()) {
      await this.clearUnlockSession();
      this.unlockSessionMnemonic = restored.unlockSessionMnemonic;
      return false;
    }

    try {
      this.setMasterKey(await unsealSessionMasterKey(record.sealedMasterKey));
      this.memStore.updateState(buildUnlockedMemStorePatch());
      this.unlockSessionMnemonic = restored.unlockSessionMnemonic;
      return true;
    } catch {
      await this.clearUnlockSession();
      this.unlockSessionMnemonic = restored.unlockSessionMnemonic;
      return false;
    }
  };

  touchUnlockSession = async () => {
    if (!this.memStore.getState().isUnlocked || !this.masterKey) {
      await this.clearUnlockSession();
      return;
    }
    await this.persistUnlockSession();
  };

  boot = async (password: string) => {
    const normalizedPassword = validatePasswordStrength(password);
    const masterKey = generateMasterKey();
    const wrappedMasterKey = await wrapMasterKey(normalizedPassword, masterKey);
    this.setMasterKey(masterKey);
    this.store.updateState({
      booted: 'true',
      masterKey: wrappedMasterKey,
    });
    this.memStore.updateState(buildUnlockedMemStorePatch());
    await this.encryptRsa();
    await this.encryptDeviceId();

    const pendingMnemonic = this.memStore.getState().pendingMnemonic;
    if (pendingMnemonic) {
      const { mnemonic } = await buildPrimaryMnemonicWrite(pendingMnemonic, this.encryptSecret);
      this.store.updateState({ mnemonic });
      this.unlockSessionMnemonic = pendingMnemonic;
      this.memStore.updateState(buildClearedPendingMnemonicPatch());
    }

    if (!this.store.getState().vault) {
      this.store.updateState({ vault: 'cosmos-vault' });
    }

    await this.touchUnlockSession();
  };

  isBooted = () => {
    return !!this.store.getState().booted;
  };

  hasVault = () => {
    const state = this.store.getState();
    return !!(state.vault || state.mnemonic);
  };

  setPendingMnemonic = async (mnemonic: string) => {
    this.memStore.updateState(buildPendingMnemonicPatch(mnemonic));
  };

  getPendingMnemonic = async () => {
    return getPendingMnemonicValue(this.memStore.getState());
  };

  clearPendingMnemonic = async () => {
    this.memStore.updateState(buildClearedPendingMnemonicPatch());
  };

  // Deprecated compatibility wrappers.
  setPreMnemonics = async (mnemonic: string) => this.setPendingMnemonic(mnemonic);
  getPreMnemonics = async () => this.getPendingMnemonic();
  removePreMnemonics = async () => this.clearPendingMnemonic();

  private clearRuntimeSecrets = () => {
    clearRuntimeSessionState({
      clearMasterKey: () => this.setMasterKey(null),
      markUnlockSuccess: () => this.markUnlockSuccess(),
      clearTransientFields: () => {
        this.unlockSessionMnemonic = null;
        this.publicKey = '';
        this.privateKey = '';
        this.deviceId = '';
        this.keyrings = [];
      },
      clearCaches: () => {
        this.accountMnemonicCache.clear();
        this.accountPrivateKeyCache.clear();
      },
    });
  };

  clearWalletData = async () => {
    this.clearRuntimeSecrets();
    this.memStore.updateState(buildClearedWalletMemStorePatch());
    this.store.updateState(buildClearedWalletState());
    await this.clearUnlockSession();
    this.emit('lock');
  };

  initDeviceId = async () => {
    const uniqueId = uuidv4();
    this.deviceId = uniqueId;
  };

  encryptDeviceId = async () => {
    const deviceId = await this.encryptSecret(this.deviceId);
    this.store.updateState({ deviceId });
  };

  initRsa = async (publicKey: string, privateKey: string) => {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.initDeviceId();
  };

  encryptRsa = async () => {
    const rsaPublicKey = await this.encryptSecret(this.publicKey);
    const rsaPrivateKey = await this.encryptSecret(this.privateKey);
    this.store.updateState({ rsaPublicKey });
    this.store.updateState({ rsaPrivateKey });
  };

  getRsaKey = async () => {
    if (!this.masterKey) {
      return { publicKey: this.publicKey, privateKey: this.privateKey };
    }
    const encryptedPublicKey = this.store.getState().rsaPublicKey;
    const encryptedPrivateKey = this.store.getState().rsaPrivateKey;
    if (!encryptedPublicKey || !encryptedPrivateKey) {
      return { publicKey: this.publicKey, privateKey: this.privateKey };
    }
    const publicKey = await this.decryptSecret(encryptedPublicKey);
    const privateKey = await this.decryptSecret(encryptedPrivateKey);
    return { publicKey, privateKey };
  };

  getDeviceId = async () => {
    if (!this.masterKey) {
      return this.deviceId;
    }
    const encryptedDeviceId = this.store.getState().deviceId;
    if (!encryptedDeviceId) {
      return this.deviceId;
    }
    return this.decryptSecret(encryptedDeviceId);
  };

  updateVault = async (vault: string) => {
    this.store.updateState({ vault });
  };

  getToken = async () => {
    return this.store.getState().vault;
  };

  private getMnemonicOrThrow = async (): Promise<string> => {
    const runtimeMnemonic = resolveRuntimeMnemonic({
      unlockSessionMnemonic: this.unlockSessionMnemonic,
      pendingMnemonic: getPendingMnemonicValue(this.memStore.getState()),
    });
    if (runtimeMnemonic) {
      return runtimeMnemonic;
    }

    const encryptedMnemonic = this.store.getState().mnemonic;
    if (!encryptedMnemonic) {
      throw new Error('Mnemonic not found');
    }

    if (!this.masterKey) {
      throw new Error('Wallet is locked');
    }

    return this.decryptSecret(encryptedMnemonic);
  };

  getMnemonic = async () => {
    return this.getMnemonicOrThrow();
  };

  getAccountMnemonic = async (accountIndex?: number | string) => {
    const index = this.getAccountIndex(accountIndex);
    const importedPrivateKey = await this.getAccountPrivateKeyOverride(index);
    const override = importedPrivateKey || index === 0 ? null : await this.getAccountMnemonicOverride(index);
    const accountSource = resolveAccountSourceFromOverrideState({
      accountIndex: index,
      hasMnemonicOverride: !!override,
      hasPrivateKeyOverride: !!importedPrivateKey,
    });

    if (accountSource.type === 'imported_private_key') {
      throw new Error('This account was imported with a private key and has no Secret Recovery Phrase');
    }

    if (accountSource.type === 'imported_mnemonic' && override) {
      return override;
    }

    return this.getMnemonicOrThrow();
  };

  updateSignMessage = async (signMessage: string) => {
    this.store.updateState({ signMessage });
  };

  getSignMessage = () => {
    return this.store.getState().signMessage;
  };

  /**
   * Full Update
   *
   * Emits the `update` event and @returns a Promise that resolves to
   * the current state.
   *
   * Frequently used to end asynchronous chains in this class,
   * indicating consumers can often either listen for updates,
   * or accept a state-resolving promise to consume their results.
   *
   * @returns {Object} The controller state.
   */
  fullUpdate = (): MemStoreState => {
    this.emit('update', this.memStore.getState());
    return this.memStore.getState();
  };

  /**
   * Set Locked
   * This method deallocates all secrets and locks the wallet runtime.
   *
   * @emits KeyringController#lock
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  setLocked = async (): Promise<MemStoreState> => {
    this.clearRuntimeSecrets();
    this.memStore.updateState(buildLockedMemStorePatch());
    await this.clearUnlockSession();
    this.emit('lock');
    return this.fullUpdate();
  };

  /**
   * Submit Password
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory.
   *
   * @emits KeyringController#unlock
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  submitPassword = async (password: string): Promise<MemStoreState> => {
    this.ensureUnlockAllowed();
    const normalizedPassword = validatePasswordStrength(password);
    try {
      this.setMasterKey(await this.unwrapMasterKeyOrThrow(normalizedPassword));
    } catch (error) {
      this.markUnlockFailure();
      throw error;
    }
    this.markUnlockSuccess();
    this.setUnlocked();
    await this.touchUnlockSession();
    return this.fullUpdate();
  };

  changePassword = async (oldPassword: string, newPassword: string) => {
    this.ensureUnlockAllowed();
    const normalizedOldPassword = validatePasswordStrength(oldPassword);
    const normalizedNewPassword = validatePasswordStrength(newPassword);
    let currentMasterKey: Uint8Array;
    try {
      currentMasterKey = await this.unwrapMasterKeyOrThrow(normalizedOldPassword);
    } catch (error) {
      this.markUnlockFailure();
      throw error;
    }
    this.markUnlockSuccess();
    const wrappedMasterKey = await wrapMasterKey(normalizedNewPassword, currentMasterKey);
    this.store.updateState({
      booted: 'true',
      masterKey: wrappedMasterKey,
    });
    this.setMasterKey(currentMasterKey);

    await this.touchUnlockSession();
  };

  /**
   * Verify Password
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity.
   *
   * @param {string} password
   */
  private unwrapMasterKeyOrThrow = async (password: string): Promise<Uint8Array> => {
    const wrappedMasterKey = this.store.getState().masterKey;
    if (!wrappedMasterKey || typeof wrappedMasterKey !== 'string') {
      throw new Error('Cannot unlock without a previous vault');
    }
    return unwrapMasterKey(password, wrappedMasterKey);
  };

  verifyPassword = async (password: string): Promise<void> => {
    this.ensureUnlockAllowed();
    let masterKey: Uint8Array;
    try {
      masterKey = await this.unwrapMasterKeyOrThrow(password);
    } catch (error) {
      this.markUnlockFailure();
      throw error;
    }
    this.markUnlockSuccess();
    masterKey.fill(0);
  };

  exportAccountPrivateKeys = async (password: string, accountIndex?: number | string) => {
    this.ensureUnlockAllowed();
    let masterKey: Uint8Array;
    try {
      masterKey = await this.unwrapMasterKeyOrThrow(password);
    } catch (error) {
      this.markUnlockFailure();
      throw error;
    }

    try {
      this.markUnlockSuccess();
      const material = await this.getSignerMaterialWithKey(masterKey, accountIndex);
      return Promise.all(SUPPORTED_COSMOS_CHAIN_IDS.map((chainId) => this.exportBuiltinPrivateKeyForChain(chainId, material)));
    } finally {
      masterKey.fill(0);
    }
  };

  /**
   * Sign Message
   *
   * Attempts to sign the provided message parameters.
   */
  signMessage = async (address: string, data: string) => {
    throw new Error('Message signing is not supported in Cosmos mode');
  };

  private getAccountIndex = (accountIndex?: number | string) => {
    return normalizeAccountIndex(accountIndex);
  };

  private getAccountSlotKey = (accountIndex: number) => toIndexedAccountIdentity(accountIndex).slotKey;

  private normalizePrivateKeyInput = (value: string) => {
    const normalized = (value || '').trim().replace(/^0x/i, '').toLowerCase();
    if (!normalized || normalized.length !== 64 || !PRIVATE_KEY_PATTERN.test(normalized)) {
      throw new Error('Invalid private key (expected 32-byte hex string)');
    }
    return normalized;
  };

  private async getAccountMnemonicOverride(accountIndex: number): Promise<string | null> {
    return readAccountMnemonicOverride(this.store?.getState?.(), accountIndex, this.getAccountSlotKey(accountIndex), this.accountMnemonicCache, this.decryptSecret);
  }

  private async getAccountPrivateKeyOverride(accountIndex: number): Promise<Uint8Array | null> {
    return readAccountPrivateKeyOverride(this.store?.getState?.(), accountIndex, this.getAccountSlotKey(accountIndex), this.accountPrivateKeyCache, this.decryptSecret);
  }

  private async getSignerMaterial(accountIndex?: number | string): Promise<ResolvedSignerMaterial> {
    return resolveSignerMaterial(
      {
        getAccountIndex: (resolvedAccountIndex) => this.getAccountIndex(resolvedAccountIndex),
        getPrimaryMnemonic: () => this.getMnemonicOrThrow(),
        getAccountMnemonicOverride: (resolvedAccountIndex) => this.getAccountMnemonicOverride(resolvedAccountIndex),
        getAccountPrivateKeyOverride: (resolvedAccountIndex) => this.getAccountPrivateKeyOverride(resolvedAccountIndex),
      },
      accountIndex,
    );
  }

  private decryptSecretWithKey = async (masterKey: Uint8Array, encrypted: string) => {
    return decryptStoredSecretWithKey(masterKey, encrypted, decryptWithMasterKey);
  };

  private getPrimaryMnemonicWithKey = async (masterKey: Uint8Array) => {
    return readPrimaryMnemonicWithKey(this.store.getState(), masterKey, this.decryptSecretWithKey);
  };

  private getAccountMnemonicOverrideWithKey = async (masterKey: Uint8Array, accountIndex: number) => {
    return readAccountMnemonicOverrideWithKey(this.store?.getState?.(), masterKey, this.getAccountSlotKey(accountIndex), this.decryptSecretWithKey);
  };

  private getAccountPrivateKeyOverrideWithKey = async (masterKey: Uint8Array, accountIndex: number) => {
    return readAccountPrivateKeyOverrideWithKey(this.store?.getState?.(), masterKey, this.getAccountSlotKey(accountIndex), this.decryptSecretWithKey);
  };

  private getSignerMaterialWithKey = async (masterKey: Uint8Array, accountIndex?: number | string): Promise<ResolvedSignerMaterial> => {
    return resolveSignerMaterialWithKey(
      {
        getAccountIndex: (resolvedAccountIndex) => this.getAccountIndex(resolvedAccountIndex),
        getPrimaryMnemonicWithKey: (resolvedMasterKey) => this.getPrimaryMnemonicWithKey(resolvedMasterKey),
        getAccountMnemonicOverrideWithKey: (resolvedMasterKey, resolvedAccountIndex) => this.getAccountMnemonicOverrideWithKey(resolvedMasterKey, resolvedAccountIndex),
        getAccountPrivateKeyOverrideWithKey: (resolvedMasterKey, resolvedAccountIndex) => this.getAccountPrivateKeyOverrideWithKey(resolvedMasterKey, resolvedAccountIndex),
      },
      masterKey,
      accountIndex,
    );
  };

  setAccountMnemonic = async (accountIndex: number | string, mnemonic: string) => {
    const normalizedMnemonic = (mnemonic || '').trim().replace(/\s+/g, ' ');
    if (!normalizedMnemonic) {
      throw new Error('Mnemonic is required');
    }
    const index = this.getAccountIndex(accountIndex);
    if (index === 0) {
      throw new Error('Primary account mnemonic cannot be overridden');
    }
    const { nextState, cachedMnemonic } = await buildAccountMnemonicOverrideWrite(this.store.getState(), this.getAccountSlotKey(index), normalizedMnemonic, this.encryptSecret);
    this.store.updateState(nextState);
    this.accountMnemonicCache.set(index, cachedMnemonic);
  };

  setAccountPrivateKey = async (accountIndex: number | string, privateKey: string) => {
    const normalizedKey = this.normalizePrivateKeyInput(privateKey);
    const index = this.getAccountIndex(accountIndex);
    const { nextState, cachedPrivateKey } = await buildAccountPrivateKeyOverrideWrite(this.store.getState(), this.getAccountSlotKey(index), normalizedKey, this.encryptSecret);
    this.store.updateState(nextState);
    this.accountPrivateKeyCache.set(index, cachedPrivateKey);
  };

  private normalizeTxBytes = (txBytes: Uint8Array | string | number[]) => {
    if (txBytes instanceof Uint8Array) return txBytes;
    if (Array.isArray(txBytes)) return Uint8Array.from(txBytes);
    if (typeof txBytes === 'string') {
      const value = txBytes.trim();
      if (value.startsWith('0x')) return fromHex(value.slice(2));
      try {
        return fromBase64(value);
      } catch (error) {
        throw new Error('Invalid tx bytes format');
      }
    }
    throw new Error('Unsupported tx bytes type');
  };

  private normalizeArbitraryData = (data: string | Uint8Array | number[]) => {
    if (data instanceof Uint8Array) return data;
    if (Array.isArray(data)) return Uint8Array.from(data);
    if (typeof data === 'string') return toUtf8(data);
    throw new Error('Unsupported arbitrary data type');
  };

  private normalizeRestEndpoint = (rest: string) => {
    return (rest || '').replace(/\/+$/, '');
  };

  private normalizeRpcEndpoint = (rpc?: string) => {
    return (rpc || '').replace(/\/+$/, '');
  };

  private getBuiltinChainConfig = (chainId: string) => {
    return getCosmosChainConfig(chainId);
  };

  private getBuiltinChainConfigOrThrow = (chainId: string) => {
    const chain = this.getBuiltinChainConfig(chainId);
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    return chain;
  };

  private getBuiltinRpcEndpointOrThrow = (chainId: string) => {
    const chain = this.getBuiltinChainConfigOrThrow(chainId);
    const rpc = this.normalizeRpcEndpoint(chain.rpc);
    if (!rpc) {
      throw new Error(`RPC endpoint is not configured for ${chainId}`);
    }
    return rpc;
  };

  private buildRuntimeUnsupportedChainError = async (chainId: string, message: string) => {
    const chainSource = await getChainSourceByChainId(chainId);
    return buildRuntimeUnsupportedEntryError({
      message,
      source: chainSource?.source,
      persisted: chainSource?.persisted,
    });
  };

  private normalizeRuntimeUnsupportedChainError = async (chainId: string, error: unknown) => {
    if (getRuntimeUnsupportedErrorData(error)) {
      return error;
    }
    if (error instanceof Error && error.message === `Unsupported chain: ${chainId}`) {
      return this.buildRuntimeUnsupportedChainError(chainId, error.message);
    }
    return error;
  };

  private getRpcEndpointOrThrow = async (chainId: string): Promise<string> => {
    const builtinChain = this.getBuiltinChainConfig(chainId);
    if (builtinChain) {
      return this.getBuiltinRpcEndpointOrThrow(chainId);
    }

    const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
    if (!runtimeChain) {
      throw await this.buildRuntimeUnsupportedChainError(chainId, `Unsupported chain: ${chainId}`);
    }
    const queryChain = ensureRuntimeExecutableQueryContext(runtimeChain, 'stargate query client');
    const rpc = this.normalizeRpcEndpoint(ensureRuntimeChainRpcContext(queryChain, 'stargate query client'));
    if (!rpc) {
      throw new Error(`RPC endpoint is not configured for ${chainId}`);
    }
    return rpc;
  };

  private getProviderBroadcastRpcEndpointOrThrow = async (chainId: string): Promise<string> => {
    const builtinChain = this.getBuiltinChainConfig(chainId);
    if (builtinChain) {
      return this.getBuiltinRpcEndpointOrThrow(chainId);
    }

    const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
    if (!runtimeChain) {
      throw await this.buildRuntimeUnsupportedChainError(chainId, `Unsupported chain: ${chainId}`);
    }
    const broadcastChain = ensureRuntimeProviderSendTxContext(runtimeChain, 'provider sendTx broadcast');
    const rpc = this.normalizeRpcEndpoint(ensureRuntimeChainRpcContext(broadcastChain, 'provider sendTx broadcast'));
    if (!rpc) {
      throw new Error(`RPC endpoint is not configured for ${chainId}`);
    }
    return rpc;
  };

  private getStargateClientForChain = async (chainId: string) => {
    const rpcEndpoint = await this.getRpcEndpointOrThrow(chainId);
    if (!this.stargateClientCache.has(rpcEndpoint)) {
      const clientPromise = StargateClient.connect(rpcEndpoint).catch((error) => {
        this.stargateClientCache.delete(rpcEndpoint);
        throw error;
      });
      this.stargateClientCache.set(rpcEndpoint, clientPromise);
    }
    return this.stargateClientCache.get(rpcEndpoint)!;
  };

  private buildBuiltinCurrencyList = (chainId: string): { denom: string; decimals: number }[] => {
    const chain = this.getBuiltinChainConfig(chainId);
    if (!chain) {
      return [];
    }
    const currencies = [
      {
        coinDenom: chain.coinDenom,
        coinMinimalDenom: chain.coinMinimalDenom,
        coinDecimals: chain.coinDecimals,
      },
      ...(chain.extraCurrencies || []),
    ];
    return currencies.map((currency) => ({
      denom: currency.coinMinimalDenom,
      decimals: currency.coinDecimals,
    }));
  };

  private buildTokenBalanceRequests = (chainId: string, options?: { extra?: CosmosTokenBalanceRequest[] }) => {
    const baseCurrencies = this.buildBuiltinCurrencyList(chainId);
    const requests: CosmosTokenBalanceRequest[] = [];
    const seen = new Set<string>();
    [...baseCurrencies, ...(options?.extra || [])].forEach((currency) => {
      const denom = (currency?.denom || '').trim();
      if (!denom) {
        return;
      }
      const key = denom.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      requests.push({ denom, decimals: currency.decimals });
    });
    return requests;
  };

  private fetchJson = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  };

  private buildAdr36SignDoc = (signerAddress: string, dataBytes: Uint8Array) => {
    return {
      chain_id: '',
      account_number: '0',
      sequence: '0',
      fee: {
        gas: '0',
        amount: [],
      },
      msgs: [
        {
          type: 'sign/MsgSignData',
          value: {
            signer: signerAddress,
            data: toBase64(dataBytes),
          },
        },
      ],
      memo: '',
    };
  };

  private normalizeAminoSignDoc = (signDoc: Record<string, any>, expectedChainId: string) => {
    if (!signDoc || typeof signDoc !== 'object') {
      throw new Error('Invalid amino sign doc');
    }

    const normalized = { ...signDoc } as Record<string, any>;
    const signDocChainId = normalized.chain_id ?? normalized.chainId;
    if (!signDocChainId || String(signDocChainId) !== expectedChainId) {
      throw new Error(`Amino sign doc chainId mismatch: expected ${expectedChainId}`);
    }

    if (normalized.account_number !== undefined) {
      normalized.account_number = String(normalized.account_number);
    }
    if (normalized.sequence !== undefined) {
      normalized.sequence = String(normalized.sequence);
    }
    if (normalized.fee?.gas !== undefined) {
      normalized.fee = {
        ...normalized.fee,
        gas: String(normalized.fee.gas),
      };
    }
    return normalized;
  };

  private normalizeDirectSignDoc = (signDoc: Record<string, any>, expectedChainId: string) => {
    if (!signDoc || typeof signDoc !== 'object') {
      throw new Error('Invalid direct sign doc');
    }

    const rawBodyBytes = signDoc.bodyBytes ?? signDoc.body_bytes;
    const rawAuthInfoBytes = signDoc.authInfoBytes ?? signDoc.auth_info_bytes;
    const rawChainId = signDoc.chainId ?? signDoc.chain_id;
    const rawAccountNumber = signDoc.accountNumber ?? signDoc.account_number;

    if (rawBodyBytes === undefined || rawAuthInfoBytes === undefined) {
      throw new Error('Direct sign doc is missing body/auth info bytes');
    }

    if (rawChainId === undefined || rawChainId === null || rawChainId === '') {
      throw new Error('Direct sign doc is missing chainId');
    }
    if (String(rawChainId) !== expectedChainId) {
      throw new Error(`Direct sign doc chainId mismatch: expected ${expectedChainId}`);
    }

    if (rawAccountNumber === undefined || rawAccountNumber === null || rawAccountNumber === '') {
      throw new Error('Direct sign doc is missing accountNumber');
    }

    const normalizedAccountNumber = typeof rawAccountNumber === 'bigint' ? rawAccountNumber : BigInt(rawAccountNumber.toString());

    return {
      bodyBytes: this.normalizeTxBytes(rawBodyBytes),
      authInfoBytes: this.normalizeTxBytes(rawAuthInfoBytes),
      chainId: String(rawChainId),
      accountNumber: normalizedAccountNumber,
    };
  };

  private buildDerivationPath = (coinType: number, derivationIndex: number) => {
    return stringToPath(`m/44'/${coinType}'/0'/0/${derivationIndex}`);
  };

  private buildDerivationPathString = (coinType: number, derivationIndex: number) => {
    return `m/44'/${coinType}'/0'/0/${derivationIndex}`;
  };

  private exportBuiltinPrivateKeyForChain = async (chainId: string, material: ResolvedSignerMaterial) => {
    const chain = this.getBuiltinChainConfigOrThrow(chainId);

    let privateKeyBytes: Uint8Array;
    if (material.type === 'privateKey') {
      privateKeyBytes = material.key;
    } else {
      const seed = mnemonicToSeedSync(material.mnemonic);
      const hdKey = HDKey.fromMasterSeed(seed);
      const child = hdKey.derive(this.buildDerivationPathString(chain.coinType, material.derivationIndex));
      if (!child.privateKey) {
        throw new Error(`Failed to derive private key for ${chainId}`);
      }
      privateKeyBytes = Uint8Array.from(child.privateKey);
    }

    const wallet = await DirectSecp256k1Wallet.fromKey(privateKeyBytes, chain.bech32Prefix);
    const [account] = await wallet.getAccounts();
    const projection = toAddressProjection({
      accountSource: material.accountSource,
      chainId: chain.chainId,
      address: account?.address || '',
      derivationPath: material.type === 'mnemonic' ? this.buildDerivationPathString(chain.coinType, material.derivationIndex) : undefined,
    });

    return {
      chainId: chain.chainId,
      chainName: chain.chainName,
      address: projection.address,
      privateKey: toHex(privateKeyBytes),
    };
  };

  private getWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveDirectWalletForChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  private getAccountReadWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveDirectWalletForAccountReadChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  private getProviderSignDirectWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveDirectWalletForProviderSignDirectChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  private getAminoWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveAminoWalletForChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  private getProviderSignAminoWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveAminoWalletForProviderSignAminoChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  private getProviderSignArbitraryWalletForChain = async (chainId: string, accountIndex?: number | string) => {
    return resolveAminoWalletForProviderSignArbitraryChain(
      {
        getSignerMaterial: (resolvedAccountIndex) => this.getSignerMaterial(resolvedAccountIndex),
        buildDerivationPath: (coinType, derivationIndex) => this.buildDerivationPath(coinType, derivationIndex),
      },
      chainId,
      accountIndex,
    );
  };

  getCosmosKey = async (chainId: string, accountIndex?: number | string) => {
    return getCosmosKeyWithSigningDeps(
      {
        getAccountIndex: (resolvedAccountIndex) => this.getAccountIndex(resolvedAccountIndex),
        getDirectWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getAccountReadWalletForChain(resolvedChainId, resolvedAccountIndex),
      },
      chainId,
      accountIndex,
    );
  };

  getOfflineSignerAccounts = async (chainId: string, accountIndex?: number | string) => {
    return getOfflineSignerAccountsWithSigningDeps(
      {
        getDirectWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getAccountReadWalletForChain(resolvedChainId, resolvedAccountIndex),
      },
      chainId,
      accountIndex,
    );
  };

  signCosmosAmino = async (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return signCosmosAminoWithSigningDeps(
      {
        getAminoWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getAminoWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeAminoSignDoc: (resolvedSignDoc, expectedChainId) => this.normalizeAminoSignDoc(resolvedSignDoc, expectedChainId),
      },
      chainId,
      signerAddress,
      signDoc,
      accountIndex,
    );
  };

  signCosmosProviderAmino = async (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    return signCosmosAminoWithSigningDeps(
      {
        getAminoWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getProviderSignAminoWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeAminoSignDoc: (resolvedSignDoc, expectedChainId) => this.normalizeAminoSignDoc(resolvedSignDoc, expectedChainId),
      },
      chainId,
      signerAddress,
      signDoc,
      accountIndex,
    );
  };

  signCosmosProviderArbitrary = async (chainId: string, signerAddress: string, data: string | Uint8Array | number[], accountIndex?: number | string) => {
    return signCosmosArbitraryWithSigningDeps(
      {
        getAminoWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getProviderSignArbitraryWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeArbitraryData: (resolvedData) => this.normalizeArbitraryData(resolvedData),
        buildAdr36SignDoc: (resolvedSignerAddress, dataBytes) => this.buildAdr36SignDoc(resolvedSignerAddress, dataBytes),
      },
      chainId,
      signerAddress,
      data,
      accountIndex,
    );
  };

  signCosmosDirect = async (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    const result = await signCosmosDirectWithSigningDeps(
      {
        getDirectWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeDirectSignDoc: (resolvedSignDoc, expectedChainId) => this.normalizeDirectSignDoc(resolvedSignDoc, expectedChainId),
        serializeBigInt: (value) => serializeBigInt(value),
      },
      chainId,
      signerAddress,
      signDoc,
      accountIndex,
    );
    const serialized = serializeBigInt(result);
    return serialized;
  };

  signCosmosProviderDirect = async (chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string) => {
    const result = await signCosmosDirectWithSigningDeps(
      {
        getDirectWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getProviderSignDirectWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeDirectSignDoc: (resolvedSignDoc, expectedChainId) => this.normalizeDirectSignDoc(resolvedSignDoc, expectedChainId),
        serializeBigInt: (value) => serializeBigInt(value),
      },
      chainId,
      signerAddress,
      signDoc,
      accountIndex,
    );
    return serializeBigInt(result);
  };

  signCosmosArbitrary = async (chainId: string, signerAddress: string, data: string | Uint8Array | number[], accountIndex?: number | string) => {
    return signCosmosArbitraryWithSigningDeps(
      {
        getAminoWalletForChain: (resolvedChainId, resolvedAccountIndex) => this.getAminoWalletForChain(resolvedChainId, resolvedAccountIndex),
        normalizeArbitraryData: (resolvedData) => this.normalizeArbitraryData(resolvedData),
        buildAdr36SignDoc: (resolvedSignerAddress, dataBytes) => this.buildAdr36SignDoc(resolvedSignerAddress, dataBytes),
      },
      chainId,
      signerAddress,
      data,
      accountIndex,
    );
  };

  verifyCosmosArbitrary = async (chainId: string, signerAddress: string, data: string | Uint8Array | number[], signature: any) => {
    const chain = this.getBuiltinChainConfigOrThrow(chainId);

    const pubKeyValue = signature?.pub_key?.value || signature?.pubKey?.value;
    const signatureValue = signature?.signature || '';
    if (!pubKeyValue || !signatureValue) {
      return false;
    }

    const pubKey = fromBase64(pubKeyValue);
    const rawAddress = rawSecp256k1PubkeyToRawAddress(pubKey);
    const expectedSigner = toBech32(chain.bech32Prefix, rawAddress);
    if (expectedSigner !== signerAddress) {
      return false;
    }

    const dataBytes = this.normalizeArbitraryData(data);
    const adr36SignDoc = this.buildAdr36SignDoc(signerAddress, dataBytes);
    const signBytes = serializeSignDoc(adr36SignDoc as any);
    const messageHash = sha256(signBytes);

    let sigBytes = fromBase64(signatureValue);
    if (sigBytes.length === 65) {
      sigBytes = sigBytes.slice(0, 64);
    }
    if (sigBytes.length !== 64) {
      return false;
    }

    const parsedSignature = Secp256k1Signature.fromFixedLength(sigBytes);
    return Secp256k1.verifySignature(parsedSignature, messageHash, pubKey);
  };

  sendCosmosTx = async (chainId: string, txBytes: Uint8Array | string | number[], mode: CosmosSignMode = 'sync') => {
    return sendCosmosTxWithDeps(
      {
        normalizeTxBytes: (resolvedTxBytes) => this.normalizeTxBytes(resolvedTxBytes),
        getRpcEndpointForChain: async (resolvedChainId) => this.getBuiltinRpcEndpointOrThrow(resolvedChainId),
      },
      chainId,
      txBytes,
      mode,
    );
  };

  sendCosmosProviderTx = async (chainId: string, txBytes: Uint8Array | string | number[], mode: CosmosSignMode = 'sync') => {
    return sendCosmosTxWithDeps(
      {
        normalizeTxBytes: (resolvedTxBytes) => this.normalizeTxBytes(resolvedTxBytes),
        getRpcEndpointForChain: (resolvedChainId) => this.getProviderBroadcastRpcEndpointOrThrow(resolvedChainId),
      },
      chainId,
      txBytes,
      mode,
    );
  };

  getCosmosNativeBalance = async (chainId: string, address: string): Promise<CosmosNativeBalance> => {
    try {
      return getCosmosNativeBalanceWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
          getStargateClientForChain: (resolvedChainId) => this.getStargateClientForChain(resolvedChainId),
          buildTokenBalanceRequests: (resolvedChainId, options) => this.buildTokenBalanceRequests(resolvedChainId, options),
          getCosmosStakingSummary: (resolvedChainId, resolvedAddress) => this.getCosmosStakingSummary(resolvedChainId, resolvedAddress),
        },
        chainId,
        address,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  getCosmosTokenBalances = async (chainId: string, address: string): Promise<CosmosTokenBalance[]> => {
    try {
      return getCosmosTokenBalancesWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
          getStargateClientForChain: (resolvedChainId) => this.getStargateClientForChain(resolvedChainId),
          buildTokenBalanceRequests: (resolvedChainId, options) => this.buildTokenBalanceRequests(resolvedChainId, options),
          getCosmosStakingSummary: (resolvedChainId, resolvedAddress) => this.getCosmosStakingSummary(resolvedChainId, resolvedAddress),
        },
        chainId,
        address,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  getCosmosStakingSummary = async (chainId: string, _address: string): Promise<CosmosStakingSummary> => {
    try {
      return getCosmosStakingSummaryWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
        },
        chainId,
        _address,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  getCosmosAssetSnapshot = async (chainId: string, address: string): Promise<CosmosAssetSnapshot> => {
    try {
      return getCosmosAssetSnapshotWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
          getStargateClientForChain: (resolvedChainId) => this.getStargateClientForChain(resolvedChainId),
          buildTokenBalanceRequests: (resolvedChainId, options) => this.buildTokenBalanceRequests(resolvedChainId, options),
          getCosmosStakingSummary: (resolvedChainId, resolvedAddress) => this.getCosmosStakingSummary(resolvedChainId, resolvedAddress),
        },
        chainId,
        address,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  getCosmosTxHistory = async (chainId: string, address: string, limit = 30): Promise<CosmosTxHistoryItem[]> => {
    try {
      return getCosmosTxHistoryWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
          normalizeRestEndpoint: (rest) => this.normalizeRestEndpoint(rest),
          fetchJson: (url) => this.fetchJson(url),
        },
        chainId,
        address,
        limit,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  getCosmosNativePriceUsd = async (chainId: string): Promise<string> => {
    try {
      return getCosmosNativePriceUsdWithDeps(
        {
          getRuntimeChainInterpretationByChainId: (resolvedChainId) => getRuntimeChainInterpretationByChainId(resolvedChainId),
          fetchJson: (url) => this.fetchJson(url),
        },
        chainId,
      );
    } catch (error) {
      throw await this.normalizeRuntimeUnsupportedChainError(chainId, error);
    }
  };

  connect = async (address: string, data: string) => {
    return address ? [address] : [];
  };

  switchChain = async (chain: string) => {
    return chain;
  };

  /**
   * Unlock Keyrings
   *
   * Unlocks the keyrings.
   *
   * @emits KeyringController#unlock
   */
  setUnlocked = () => {
    this.memStore.updateState(buildUnlockedMemStorePatch());
    this.emit('unlock');
  };
}

export default new KeyringService();
