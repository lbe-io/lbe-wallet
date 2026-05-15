import { createContext, ReactNode, useContext } from 'react';
import { fromBase64, fromHex, toBase64 } from '@cosmjs/encoding';
import type { AccountData, DirectSignResponse, OfflineDirectSigner } from '@cosmjs/proto-signing';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import Long from 'long';
import type { ApprovalPayload, ApprovalRecoveryInput, ConnectedSite } from '@/entrypoints/background/service/types';

export type CosmosKey = {
  name: string;
  algo: string;
  pubKey: Uint8Array;
  address: string;
  bech32Address: string;
  isNanoLedger: boolean;
};

export type CosmosSignerAccount = AccountData;

export type CosmosAssetAmount = {
  denom: string;
  amount: string;
  displayAmount: string;
};

export type CosmosStakingSummary = {
  delegations: { validatorAddress: string; denom: string; amount: string; displayAmount: string }[];
  rewards: CosmosAssetAmount[];
  totalDelegated: CosmosAssetAmount;
  totalReward: CosmosAssetAmount;
};

export type CosmosTxHistoryItem = {
  chainId: string;
  hash: string;
  time: number;
  type: string;
  famt: string;
  fdecimals: number;
  fname: string;
  from: string;
  to: string;
  link: string;
  ficon: string;
};

export type AccountPrivateKeyItem = {
  chainId: string;
  chainName: string;
  address: string;
  privateKey: string;
};

export interface WalletController {
  boot(password: string): Promise<void>;
  isBooted(): Promise<boolean>;

  getApproval(): Promise<ApprovalPayload | null>;
  getApprovalRecovery(): Promise<ApprovalRecoveryInput | null>;
  resolveApproval(data?: any, data2?: any): Promise<void>;
  rejectApproval(data?: any, data2?: any, data3?: any): Promise<void>;

  hasVault(): Promise<boolean>;
  verifyPassword(password: string): Promise<void>;
  changePassword(password: string, newPassword: string): Promise<void>;
  unlock(password: string): Promise<void>;
  isUnlocked(): Promise<boolean>;

  setLastActiveTime(): any;
  getRsaKey(): Promise<{ publicKey: string; privateKey: string }>;
  getDeviceId(): Promise<string>;

  updateVault(vault: string): Promise<void>;
  getToken(): Promise<string>;
  updateSignMessage(message: string): Promise<void>;
  getSignMessage(): string;

  setPendingMnemonic(mnemonic: string): Promise<void>;
  getPendingMnemonic(): Promise<string>;
  clearPendingMnemonic(): Promise<void>;
  setAccountMnemonic(accountIndex: number | string, mnemonic: string): Promise<void>;
  setAccountPrivateKey(accountIndex: number | string, privateKey: string): Promise<void>;

  setPreMnemonics(mnemonic: string): Promise<void>;
  getPreMnemonics(): Promise<string>;
  removePreMnemonics(): Promise<void>;

  getMnemonic(): Promise<string>;
  getAccountMnemonic(accountIndex?: number | string): Promise<string>;
  exportAccountPrivateKeys(password: string, accountIndex?: number | string): Promise<AccountPrivateKeyItem[]>;
  clearWalletData(): Promise<void>;
  lockWallet(): Promise<void>;
  setPopupOpen(isOpen: boolean): void;
  setMnemonicBackupPending(pending: boolean, walletId?: string): Promise<void>;
  getMnemonicBackupPending(walletId?: string): Promise<boolean>;

  setCurrentAccount(accounts: string): void;
  changeAccounts(accounts: string): void;
  setSelectedAccount(accounts: string): void;
  changeSelectedAccount(accounts: string): void;
  getCurrentAccount(): string;
  setAccountAliasName(accountKey: string, name: string): Promise<void>;
  getLocale(): Promise<string>;
  setLocale(locale: string): Promise<void>;
  setChainId(chainId: string, origin: string): void;
  setSelectedChain(chainId: string): void;
  changeSelectedChain(chainId: string): void;
  setOriginChainId(chainId: string, origin: string): void;
  getChainId(): string;
  getCurrentSite(tabId: number): void;

  getCosmosKey(chainId: string, accountIndex?: number | string): Promise<CosmosKey>;
  getOfflineSignerAccounts(chainId: string, accountIndex?: number | string): Promise<CosmosSignerAccount[]>;
  signCosmosAmino(chainId: string, signerAddress: string, signDoc: Record<string, any>, accountIndex?: number | string): Promise<any>;
  signCosmosDirect(chainId: string, signerAddress: string, signDoc: SignDocSerializable, accountIndex?: number | string): Promise<DirectSignResponse>;
  signCosmosArbitrary(chainId: string, signerAddress: string, data: string | Uint8Array | number[], accountIndex?: number | string): Promise<any>;
  verifyCosmosArbitrary(chainId: string, signerAddress: string, data: string | Uint8Array | number[], signature: any): Promise<boolean>;
  sendCosmosTx(chainId: string, txBytes: Uint8Array | string | number[], mode?: 'sync' | 'async' | 'block'): Promise<Uint8Array>;
  getCosmosNativeBalance(chainId: string, address?: string): Promise<CosmosAssetAmount>;
  getCosmosStakingSummary(chainId: string, address?: string): Promise<CosmosStakingSummary>;
  getCosmosAssetSnapshot(
    chainId: string,
    address?: string,
  ): Promise<{
    chainId: string;
    address: string;
    nativeBalance: CosmosAssetAmount;
    tokenBalances: CosmosAssetAmount[];
    staking: CosmosStakingSummary;
    updatedAt: number;
  }>;
  getCosmosTxHistory(chainId: string, address?: string, limit?: number): Promise<CosmosTxHistoryItem[]>;
  getCosmosNativePriceUsd(chainId: string): Promise<string>;

  getConnectedSites(): Promise<ConnectedSite[]>;
  removeConnectedSite(origin: string): Promise<void>;
  clearConnectedSites(): void;
}

// -----------------------------------------------------------------------------
// React context
// -----------------------------------------------------------------------------

type WalletContextValue = { wallet: WalletController } | null;

const WalletContext = createContext<WalletContextValue>(null);

export const WalletProvider = ({ children, wallet }: { children?: ReactNode; wallet: WalletController }) => <WalletContext.Provider value={{ wallet }}>{children}</WalletContext.Provider>;

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('WalletContext is not available');
  }
  return context.wallet;
};

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------

type ByteSource = Uint8Array | ArrayBuffer | ArrayBufferView | number[] | string | undefined | null | { type?: string; data?: number[] | ArrayLike<number> | Record<string, unknown> };

const HEX_PATTERN = /^(0x)?[0-9a-f]+$/i;
const NUMERIC_KEY_PATTERN = /^\d+$/;

const isNumericKeyObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => NUMERIC_KEY_PATTERN.test(key));
};

const fromNumericKeyObject = (record: Record<string, unknown>) => {
  const keys = Object.keys(record).filter((key) => NUMERIC_KEY_PATTERN.test(key));
  if (!keys.length) {
    return new Uint8Array();
  }
  const maxIndex = Math.max(...keys.map((key) => Number(key)));
  const buffer = new Uint8Array(maxIndex + 1);
  keys.forEach((key) => {
    const idx = Number(key);
    const value = Number((record as Record<string, unknown>)[key]);
    if (!Number.isNaN(value)) {
      buffer[idx] = value & 0xff;
    }
  });
  return buffer;
};

const isBufferLikeObject = (value: unknown): value is { type?: string; data?: number[] | ArrayLike<number> | Record<string, unknown> } => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const maybe = value as { type?: string; data?: unknown };
  if (maybe.type === 'Buffer') {
    return true;
  }
  if (Array.isArray(maybe.data) || ArrayBuffer.isView(maybe.data)) {
    return true;
  }
  if (isNumericKeyObject(maybe.data)) {
    return true;
  }
  return false;
};

const cloneFromView = (view: ArrayBufferView) => {
  if (view instanceof Uint8Array) {
    return view;
  }
  return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
};

const toUint8Array = (value: ByteSource): Uint8Array => {
  if (!value) {
    return new Uint8Array();
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return cloneFromView(value);
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }
  if (isBufferLikeObject(value)) {
    const data = value.data;
    if (Array.isArray(data)) {
      return Uint8Array.from(data);
    }
    if (ArrayBuffer.isView(data)) {
      return cloneFromView(data);
    }
    if (data && typeof data === 'object' && typeof (data as { length?: number }).length === 'number') {
      const length = Number((data as { length?: number }).length) || 0;
      return Uint8Array.from(Array.from({ length }, (_unused, idx) => Number((data as Record<number, number>)[idx]) || 0));
    }
    if (isNumericKeyObject(data)) {
      return fromNumericKeyObject(data);
    }
    return new Uint8Array();
  }
  if (value && typeof value === 'object' && typeof (value as { length?: number }).length === 'number') {
    const length = Number((value as { length?: number }).length) || 0;
    return Uint8Array.from(Array.from({ length }, (_unused, idx) => Number((value as Record<number, number>)[idx]) || 0));
  }
  if (isNumericKeyObject(value)) {
    return fromNumericKeyObject(value);
  }
  if (typeof value === 'string') {
    const normalized = value.startsWith('0x') ? value.slice(2) : value;
    if (HEX_PATTERN.test(value)) {
      return fromHex(normalized);
    }
    return fromBase64(normalized);
  }
  throw new Error('Unsupported byte sequence');
};

type SignDocLike = {
  bodyBytes?: ByteSource;
  authInfoBytes?: ByteSource;
  chainId?: string;
  accountNumber?: bigint | number | string;
};

type SignDocSerializable = {
  bodyBytes: string;
  authInfoBytes: string;
  chainId: string;
  accountNumber: string;
};

const toBigIntValue = (value: bigint | number | string | Long | undefined | null): bigint => {
  if (typeof value === 'bigint') {
    return value;
  }
  if (Long.isLong(value)) {
    return BigInt(value.toString());
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.max(0, Math.trunc(value)));
  }
  if (typeof value === 'string' && value.trim().length) {
    return BigInt(value.trim());
  }
  return 0n;
};

const normalizeSignDoc = (doc: SignDoc | SignDocLike): SignDoc => {
  const signDocLike = doc as SignDocLike;
  return {
    ...(doc as SignDoc),
    bodyBytes: toUint8Array(signDocLike.bodyBytes ?? (doc as SignDoc).bodyBytes),
    authInfoBytes: toUint8Array(signDocLike.authInfoBytes ?? (doc as SignDoc).authInfoBytes),
    chainId: (doc as SignDoc).chainId || signDocLike.chainId || '',
    accountNumber: toBigIntValue(signDocLike.accountNumber ?? (doc as SignDoc).accountNumber),
  };
};

const toSerializableSignDoc = (doc: SignDoc): SignDocSerializable => {
  const bytesToBase64 = (value?: Uint8Array) => (value instanceof Uint8Array ? toBase64(value) : '');
  return {
    bodyBytes: bytesToBase64(doc.bodyBytes),
    authInfoBytes: bytesToBase64(doc.authInfoBytes),
    chainId: doc.chainId,
    accountNumber: doc.accountNumber?.toString?.() ?? '0',
  };
};

const normalizeDirectSignResponse = (response: DirectSignResponse | undefined, fallback: SignDoc): DirectSignResponse => {
  if (!response) {
    throw new Error('Empty direct sign response');
  }
  if (!response.signature) {
    throw new Error('Missing signature in direct sign response');
  }
  const signedDoc = response.signed ? normalizeSignDoc(response.signed) : fallback;
  return {
    signed: signedDoc,
    signature: response.signature,
  };
};

// -----------------------------------------------------------------------------
// Wallet-backed signer
// -----------------------------------------------------------------------------

const ensureChainId = (chainId: string) => {
  const normalized = (chainId || '').trim();
  if (!normalized) {
    throw new Error('chainId is required to create a signer');
  }
  return normalized;
};

const mapAccountData = (account: AccountData): AccountData => ({
  address: account.address,
  algo: account.algo,
  pubkey: toUint8Array(account.pubkey),
});

export const createWalletDirectSigner = (wallet: WalletController, chainId: string, accountIndex?: number | string): OfflineDirectSigner => {
  const normalizedChainId = ensureChainId(chainId);

  const getAccounts = async (): Promise<readonly AccountData[]> => {
    const accounts = await wallet.getOfflineSignerAccounts(normalizedChainId, accountIndex);
    if (!accounts || accounts.length === 0) {
      throw new Error(`No Cosmos accounts available for chain ${normalizedChainId}`);
    }
    return accounts.map(mapAccountData);
  };

  const signDirect = async (signerAddress: string, signDoc: SignDoc) => {
    const normalizedDoc = normalizeSignDoc(signDoc);
    const serializableDoc = toSerializableSignDoc(normalizedDoc);
    const response = await wallet.signCosmosDirect(normalizedChainId, signerAddress.trim(), serializableDoc, accountIndex);
    return normalizeDirectSignResponse(response, normalizedDoc);
  };

  return {
    getAccounts,
    signDirect,
  };
};
