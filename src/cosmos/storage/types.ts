export type AccountId = string;

export type PrimaryMnemonicDerivedAccountSource = {
  type: 'primary_mnemonic_derived';
  accountId: AccountId;
  accountIndex: number;
  derivationIndex: number;
  slotKey: string;
};

export type ImportedMnemonicAccountSource = {
  type: 'imported_mnemonic';
  accountId: AccountId;
  accountIndex: number;
  derivationIndex: 0;
  slotKey: string;
};

export type ImportedPrivateKeyAccountSource = {
  type: 'imported_private_key';
  accountId: AccountId;
  accountIndex: number;
  slotKey: string;
};

export type AccountSource = PrimaryMnemonicDerivedAccountSource | ImportedMnemonicAccountSource | ImportedPrivateKeyAccountSource;

export type AddressProjection = {
  accountId: AccountId;
  accountIndex: number;
  chainId: string;
  address: string;
  addressLow: string;
  derivationPath?: string;
  source: AccountSource;
};

export interface Wallet {
  id: string;
  name: string;
  photo: string;
  isDefault: string;
  status: string;
  mnemonicBackupPending?: boolean;
  dr: string;
}

export interface Account {
  id: string;
  uid: string;
  wid: string;
  name: string;
  index: string;
  dr: string;
}

export interface Address {
  id: string;
  uid: string;
  wid: string;
  accountId: string;
  chainId: string;
  chainType: string;
  mpcType: string;
  path: string;
  address: string;
  addressLow: string;
  index: string;
  dr: string;
}

export interface Chain {
  chainId: string;
  custom: string;
  decimals: string;
  dr: string;
  explore: string;
  icon: string;
  muticall: string;
  name: string;
  nft: string;
  rpc: string;
  sorts: string;
  symbol: string;
  token: string;
  type: string;
}

export interface ChainType {
  crypto: string;
  dr: string;
  name: string;
  path: string;
}

export interface ChainRpc {
  chainId: string;
  name: string;
  url: string;
  dr: string;
}

export interface ChainToken {
  [x: string]: any;
  chainId: string;
  type: string;
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logoURI: string;
  tags: string;
  groupValue: string;
  selected: string;
  custom: string;
  addressLow: string;
  assetType: string;
  sorts: string;
  dr: string;
}

export interface AccountAssets {
  wid: string;
  aIndex: string;
  address: string;
  chainId: string;
  contract: string;
  balance: string;
  price: string;
  show: string;
}
