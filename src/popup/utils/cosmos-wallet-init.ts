import type { WalletController } from '@/app/contexts';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import { buildCosmosHdPath, type BuiltinChainMetadata } from '@/cosmos/chains/chainMetadataAdapter';
import { listBuiltinChainSources } from '@/cosmos/chains/chainRepository';
import { addAccounts, addAddresses, addChainLists, addChainTokenLists, addWallets, getAllWallets, type Address, type Chain, type ChainToken } from '@/cosmos/storage';
import { syncSelectedAccount, syncSelectedChain } from '@/popup/utils/selectionSyncService';

type WalletRecord = {
  id: string;
  name: string;
  photo: string;
  isDefault: string;
  status: string;
  mnemonicBackupPending?: boolean;
  dr: string;
};

type AccountRecord = {
  id: string;
  uid: string;
  wid: string;
  name: string;
  index: string;
  dr: string;
};

type DerivedBuiltinChain = BuiltinChainMetadata & {
  address: string;
};

const buildBuiltinChainTokenRecords = (chain: BuiltinChainMetadata): ChainToken[] => {
  const seen = new Set<string>();

  return chain.currencies.reduce<ChainToken[]>((acc, currency) => {
    const address = currency.coinMinimalDenom || '';
    const addressLow = address.toLowerCase();
    if (!addressLow || seen.has(addressLow)) {
      return acc;
    }

    seen.add(addressLow);
    acc.push({
      chainId: chain.chainId,
      type: 'native',
      assetType: 'token',
      address,
      addressLow,
      name: currency.coinDenom,
      symbol: currency.coinDenom,
      decimals: String(currency.coinDecimals),
      logoURI: '',
      tags: '',
      groupValue: '',
      selected: '1',
      custom: '0',
      sorts: '0',
      dr: '0',
    });

    return acc;
  }, []);
};

export type CosmosWalletInitResult = {
  wallet: WalletRecord;
  account: AccountRecord;
  addresses: Address[];
  chains: Chain[];
  tokens: ChainToken[];
  defaultChain: Chain;
  defaultAddress: string;
};

const DEFAULT_WALLET_NAME_PREFIX = 'Cosmos HD Wallet';

const resolveNextWalletName = async () => {
  const wallets = await getAllWallets();
  if (!wallets.length) {
    return `${DEFAULT_WALLET_NAME_PREFIX} 1`;
  }
  let maxMatchedIndex = 0;
  wallets.forEach((wallet) => {
    const match = (wallet.name || '').trim().match(/^Cosmos HD Wallet(?:\s+(\d+))?$/i);
    if (!match) {
      return;
    }
    const parsed = match[1] ? Number(match[1]) : 1;
    if (Number.isFinite(parsed)) {
      maxMatchedIndex = Math.max(maxMatchedIndex, parsed);
    }
  });
  const fallbackIndex = wallets.length + 1;
  const nextIndex = maxMatchedIndex > 0 ? maxMatchedIndex + 1 : fallbackIndex;
  return `${DEFAULT_WALLET_NAME_PREFIX} ${nextIndex}`;
};

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

export const initializePrimaryCosmosWallet = async (walletController: WalletController, accountIndex: number = 0, options?: { mnemonicBackupPending?: boolean }): Promise<CosmosWalletInitResult> => {
  const walletId = createId('wallet');
  const accountId = createId('account');
  const userId = createId('user');

  const chainSources = listBuiltinChainSources();
  const chains = chainSources.map((entry) => entry.metadata);
  const derivedChains: DerivedBuiltinChain[] = await Promise.all(
    chains.map(async (chain) => {
      const accounts = await walletController.getOfflineSignerAccounts(chain.chainId, accountIndex);
      return {
        ...chain,
        address: accounts?.[0]?.address || '',
      };
    }),
  );

  const walletName = await resolveNextWalletName();

  const wallet: WalletRecord = {
    id: walletId,
    name: walletName,
    photo: '',
    isDefault: '1',
    status: '1',
    mnemonicBackupPending: !!options?.mnemonicBackupPending,
    dr: '0',
  };

  const account: AccountRecord = {
    id: accountId,
    uid: userId,
    wid: walletId,
    name: 'Main Account',
    index: String(accountIndex),
    dr: '0',
  };

  const addresses: Address[] = derivedChains.map((chain) => ({
    id: createId(`addr_${chain.chainId}`),
    uid: userId,
    wid: walletId,
    accountId,
    chainId: chain.chainId,
    chainType: chain.chainId,
    mpcType: '',
    path: buildCosmosHdPath(chain, accountIndex),
    address: chain.address,
    addressLow: chain.address.toLowerCase(),
    index: String(accountIndex),
    dr: '0',
  }));

  const chainList: Chain[] = chainSources.map((entry) => entry.chainRecord);
  const tokens: ChainToken[] = derivedChains.flatMap((chain) => buildBuiltinChainTokenRecords(chain));

  await addWallets([wallet]);
  await addAccounts([account]);
  await addAddresses(addresses);
  await addChainLists(chainList);
  await addChainTokenLists(tokens);

  const defaultChain = chainList.find((chain) => chain.chainId === DEFAULT_COSMOS_CHAIN_ID) || chainList[0];
  if (!defaultChain) {
    throw new Error('No supported Cosmos chain configured');
  }

  const defaultAddress = addresses.find((addr) => addr.chainId === defaultChain.chainId)?.address || addresses[0]?.address || '';
  if (!defaultAddress) {
    throw new Error('Failed to derive wallet address');
  }

  syncSelectedAccount(walletController, defaultAddress);
  syncSelectedChain(walletController, defaultChain.chainId);

  return {
    wallet,
    account,
    addresses,
    chains: chainList,
    tokens,
    defaultChain,
    defaultAddress,
  };
};
