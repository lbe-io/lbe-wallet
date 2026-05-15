import Dexie, { Table } from 'dexie';
import type { Account, AccountAssets, Address, Chain, ChainRpc, ChainToken, ChainType, Wallet } from './types';

class LbeDatabase extends Dexie {
  walletList!: Table<Wallet, string>;
  accountList!: Table<Account, string>;
  addressList!: Table<Address, [string, string, string]>;
  chainList!: Table<Chain, string>;
  chainTypeList!: Table<ChainType, [string, string, string]>;
  chainRpcList!: Table<ChainRpc, [string, string, string]>;
  chainTokenList!: Table<ChainToken, [string, string]>;
  accountAssets!: Table<AccountAssets, [string, string, string]>;

  constructor() {
    super('LumexsDatabase');
    this.version(1).stores({
      walletList: 'id',
      accountList: 'id, [wid+index]',
      addressList: 'id, [wid+index+chainId]',
      chainList: 'chainId',
      chainTypeList: '[crypto+name+path]',
      chainRpcList: '[chainId+name+url]',
      chainTokenList: '[chainId+address]',
      accountAssets: '[chainId+address+contract]',
    });
  }
}

export const db = new LbeDatabase();
