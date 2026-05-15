import { AddressType } from '@/shared/legacyTypes';

export interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: any[];
  keyrings: any[];
  pendingMnemonic: string;
  addressTypes: AddressType[];
  rsaPublicKey: string;
  rsaPrivateKey: string;
  deviceId: string;
}

export type CosmosSignMode = 'sync' | 'async' | 'block';

export type CosmosNativeBalance = {
  denom: string;
  amount: string;
  displayAmount: string;
};

export type CosmosDelegationSummary = {
  validatorAddress: string;
  denom: string;
  amount: string;
  displayAmount: string;
};

export type CosmosRewardSummary = {
  denom: string;
  amount: string;
  displayAmount: string;
};

export type CosmosTokenBalanceRequest = {
  denom: string;
  decimals: number;
};

export type CosmosTokenBalance = {
  denom: string;
  amount: string;
  displayAmount: string;
};

export type CosmosStakingSummary = {
  delegations: CosmosDelegationSummary[];
  rewards: CosmosRewardSummary[];
  totalDelegated: CosmosRewardSummary;
  totalReward: CosmosRewardSummary;
};

export type CosmosAssetSnapshot = {
  chainId: string;
  address: string;
  nativeBalance: CosmosNativeBalance;
  tokenBalances: CosmosTokenBalance[];
  staking: CosmosStakingSummary;
  updatedAt: number;
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

export type UnlockSessionState = {
  updatedAt: number;
  expiresAt: number;
  version: number;
  unlocked: boolean;
};

export interface DisplayedKeyring {
  type: string;
  accounts: {
    pubkey: string;
    brandName: string;
    type?: string;
    aliasName?: string;
    // Deprecated: keep backward compatibility with legacy payloads.
    alianName?: string;
  }[];
  addressType: AddressType;
  index: number;
}

export interface ToSignInput {
  index: number;
  publicKey: string;
}

export interface Keyring {
  serialize(): Promise<any>;
  deserialize(opts: any): Promise<void>;
  addAccounts(n: number): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  signMessage(address: string, message: string): Promise<string>;
  updateSignMessage(message: string): Promise<string>;
  getSignMessage(): string;
  verifyMessage(address: string, message: string, sig: string): Promise<boolean>;
  exportAccount(address: string): Promise<string>;
  removeAccount(address: string): void;

  accounts?: string[];
  unlock?(): Promise<void>;
  getFirstPage?(): Promise<{ address: string; index: number }[]>;
  getNextPage?(): Promise<{ address: string; index: number }[]>;
  getPreviousPage?(): Promise<{ address: string; index: number }[]>;
  getAddresses?(start: number, end: number): { address: string; index: number }[];
  getIndexByAddress?(address: string): number;

  getAccountsWithBrand?(): { address: string; index: number }[];
  activeAccounts?(indexes: number[]): string[];

  changeHdPath?(hdPath: string): void;
  getAccountByHdPath?(hdPath: string, index: number): string;
}
