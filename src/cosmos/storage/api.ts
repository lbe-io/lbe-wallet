import Dexie from 'dexie';
import { getCosmosChainConfig, isSupportedCosmosChain, SUPPORTED_COSMOS_CHAIN_IDS, type CosmosCurrency } from '@/cosmos/chains/chain-registry';
import { toAssetMetadata } from '@/cosmos/assets/assetMetadataAdapter';
import { toAssetHolding, toAssetViewProjection } from '@/cosmos/assets/holdingProjection';
import { toPriceSource } from '@/cosmos/assets/priceSourceAdapter';
import { db } from './database';
import { isActiveRecord, isSelectedToken } from './helpers';
import type { Wallet, Account, Address, Chain, ChainType, ChainRpc, ChainToken, AccountAssets } from './types';

export type StorageAccountQueryContext = {
  wid?: string;
  accountIndex?: number | string;
  index?: number | string;
};

export const clearDatabase = async () => {
  try {
    await db.transaction('rw', [db.walletList, db.accountList, db.addressList, db.chainList, db.chainTypeList, db.chainRpcList, db.chainTokenList], async () => {
      await db.walletList.clear();
      await db.accountList.clear();
      await db.addressList.clear();
      await db.chainList.clear();
      await db.chainTypeList.clear();
      await db.chainRpcList.clear();
      await db.chainTokenList.clear();
    });
  } catch (error) {
    console.error('Failed to clear the database', error);
  }
};
export { db };
// add data
export const addWallets = async (wallets: Wallet[]) => {
  await db.walletList.bulkAdd(wallets);
};

export const addAccounts = async (accounts: Account[]) => {
  await db.accountList.bulkAdd(accounts);
};

export const addAddresses = async (addresses: Address[]) => {
  const preparedData = addresses.map((item) => ({
    ...item,
    addressLow: item.address.toLowerCase(),
  }));
  await db.addressList.bulkAdd(preparedData);
};

export const addChainLists = async (chainList: Chain[]) => {
  await db.chainList.bulkPut(chainList);
};

export const addChainTypeLists = async (chainTypeList: ChainType[]) => {
  await db.chainTypeList.bulkAdd(chainTypeList);
};

export const addChainRpcLists = async (chainRpcList: ChainRpc[]) => {
  await db.chainRpcList.bulkAdd(chainRpcList);
};

const denomMapCache = new Map<string, Map<string, string>>();

const getDenomMapForChain = async (chainId: string) => {
  if (denomMapCache.has(chainId)) {
    return denomMapCache.get(chainId)!;
  }
  const tokens = await db.chainTokenList.where('chainId').equals(chainId).toArray();
  const map = new Map<string, string>();
  tokens.forEach((token) => {
    const canonical = (token.addressLow || token.address || '').toLowerCase();
    if (!canonical) {
      return;
    }
    if (!map.has(canonical)) {
      map.set(canonical, canonical);
    }
    const addressAlias = (token.address || '').toLowerCase();
    if (addressAlias && !map.has(addressAlias)) {
      map.set(addressAlias, canonical);
    }
    const symbolAlias = (token.symbol || '').toLowerCase();
    if (symbolAlias && !map.has(symbolAlias)) {
      map.set(symbolAlias, canonical);
    }
  });
  denomMapCache.set(chainId, map);
  return map;
};

const normalizeContractKey = async (chainId: string, contract: string) => {
  const normalized = (contract || '').toLowerCase();
  if (!normalized) {
    return normalized;
  }
  const map = await getDenomMapForChain(chainId);
  return map.get(normalized) || normalized;
};

export const addAccountAssets = async (assets: AccountAssets[]) => {
  const normalizedAssets = await Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      contract: await normalizeContractKey(asset.chainId, asset.contract),
    })),
  );
  await db.accountAssets.bulkPut(normalizedAssets);
};

export const addChainTokenLists = async (chainTokenList: ChainToken[]) => {
  const preparedData = chainTokenList.map((item) => ({
    ...item,
    custom: item.custom === '1' ? '1' : '0',
    selected: item.selected !== undefined ? item.selected : '0',
  }));
  await db.chainTokenList.bulkPut(preparedData);
  preparedData.forEach((token) => denomMapCache.delete(token.chainId));
};

const querySelectedTokens = async (chainId?: string): Promise<ChainToken[]> => {
  if (chainId) {
    return await db.chainTokenList
      .where('chainId')
      .equals(chainId)
      .and((token) => isSelectedToken(token.selected))
      .and((token) => isActiveRecord(token.dr))
      .toArray();
  }

  return await db.chainTokenList
    .filter((o) => isSelectedToken(o.selected))
    .and((token) => isActiveRecord(token.dr))
    .toArray();
};

const buildCurrencyList = (chainConfig: ReturnType<typeof getCosmosChainConfig>): CosmosCurrency[] => {
  if (!chainConfig) {
    return [];
  }
  return [
    {
      coinDenom: chainConfig.coinDenom,
      coinMinimalDenom: chainConfig.coinMinimalDenom,
      coinDecimals: chainConfig.coinDecimals,
    },
    ...(chainConfig.extraCurrencies || []),
  ];
};

const toDenomKey = (denom?: string) => (denom || '').toLowerCase();

const resolveAccountQueryContext = (context?: StorageAccountQueryContext) => {
  const accountIndex = context?.accountIndex ?? context?.index;

  if (!context?.wid || accountIndex === undefined || accountIndex === null) {
    return null;
  }

  return {
    wid: context.wid,
    index: String(accountIndex),
  };
};

const toChainTokenAssetView = ({ token, chain, accountAddress, asset }: { token: ChainToken; chain?: Chain; accountAddress: string; asset?: AccountAssets }) => {
  const metadata = toAssetMetadata(token, chain);
  const holding = toAssetHolding({
    metadata,
    accountAddress,
    asset,
    priceSource: toPriceSource(asset),
  });
  const projection = toAssetViewProjection(holding);

  return {
    ...token,
    chainInfo: chain,
    accountAddress,
    chainType: metadata.chainType,
    chainName: metadata.chainName,
    balance: projection.balance,
    price: projection.price,
    amount: projection.amount,
  };
};

export const ensureSelectedNativeTokens = async (chainIds?: string[]): Promise<ChainToken[]> => {
  const targetChainIds = (chainIds && chainIds.length ? chainIds : (SUPPORTED_COSMOS_CHAIN_IDS as unknown as string[])).filter((id) => isSupportedCosmosChain(id)).map((id) => String(id));
  if (!targetChainIds.length) {
    return [];
  }

  const selectedTokens = await querySelectedTokens();
  const existingByChain = selectedTokens.reduce<Map<string, Set<string>>>((acc, token) => {
    if (!targetChainIds.includes(token.chainId) || token.type !== 'native' || !isActiveRecord(token.dr)) {
      return acc;
    }
    const denomKey = toDenomKey(token.addressLow || token.address);
    if (!denomKey) {
      return acc;
    }
    if (!acc.has(token.chainId)) {
      acc.set(token.chainId, new Set());
    }
    acc.get(token.chainId)!.add(denomKey);
    return acc;
  }, new Map());

  const allChains = await db.chainList.filter((o) => isActiveRecord(o.dr)).toArray();
  const chainMap = new Map(allChains.map((chain) => [chain.chainId, chain]));

  const nativeTokens = targetChainIds.reduce<ChainToken[]>((acc, chainId) => {
    const chainConfig = getCosmosChainConfig(chainId);
    if (!chainConfig) {
      return acc;
    }

    const chainCurrencies = buildCurrencyList(chainConfig);
    if (!chainCurrencies.length) {
      return acc;
    }

    const existingForChain = existingByChain.get(chainId) || new Set<string>();
    const chain = chainMap.get(chainId);

    chainCurrencies.forEach((currency) => {
      const denomKey = toDenomKey(currency.coinMinimalDenom);
      if (existingForChain.has(denomKey)) {
        return;
      }
      existingForChain.add(denomKey);
      acc.push({
        chainId,
        type: 'native',
        assetType: 'token',
        address: currency.coinMinimalDenom,
        addressLow: denomKey,
        name: currency.coinDenom,
        symbol: currency.coinDenom,
        decimals: String(currency.coinDecimals),
        logoURI: chain?.icon || '',
        tags: '',
        groupValue: '',
        selected: '1',
        custom: '0',
        sorts: '0',
        dr: '0',
      });
      if (!existingByChain.has(chainId)) {
        existingByChain.set(chainId, existingForChain);
      }
    });

    return acc;
  }, []);

  if (!nativeTokens.length) {
    return [];
  }

  await addChainTokenLists(nativeTokens);
  return nativeTokens;
};

// Query wallet of a id
export const getWalletById = async (id: string): Promise<Wallet[]> => {
  return await db.walletList
    .where('id')
    .equals(id)
    .and((wallet) => wallet.dr === '0')
    .toArray();
};

// Query wallet of a id
export const getAccountById = async (id: string): Promise<Account[]> => {
  return await db.accountList
    .where('id')
    .equals(id)
    .and((account) => account.dr === '0')
    .toArray();
};

// Query all accounts of a wallet
export const getAccountsByWalletId = async (walletId: string): Promise<Account[]> => {
  return await db.accountList
    .where('wid')
    .equals(walletId)
    .and((account) => account.dr === '0')
    .toArray();
};

export const getAddressesByWidIdType = async (wid: string, index: string, chainType: string): Promise<Address[]> => {
  // In v2, we don't have [wid+index+chainType] index anymore
  // Use filter instead to get all addresses of a specific type
  return await db.addressList.filter((o) => o.wid === wid && o.index === index && (o.chainType === chainType || o.chainId === chainType) && o.dr === '0').toArray();
};

// Query all addresses of an account
export const getAddressesByWidId = async (wid: string, index: string): Promise<Address[]> => {
  return await db.addressList
    .filter((o) => o.wid === wid)
    .and((o) => o.index === index)
    .and((address) => address.dr === '0')
    .toArray();
};

// Query address by chainId (for getting the specific address of a specific chain)
export const getAddressByChainId = async (wid: string, index: string, chainId: string): Promise<Address | undefined> => {
  try {
    const result = await db.addressList
      .where('[wid+index+chainId]')
      .equals([wid, index, chainId])
      .and((address) => address.dr === '0')
      .first();
    return result;
  } catch (error) {
    console.error('[getAddressByChainId] query failed:', error);
    throw error;
  }
};

// Get all wallets
export const getAllWallets = async (): Promise<Wallet[]> => {
  return await db.walletList.filter((o) => o.dr === '0').toArray();
};

// Get all accounts
export const getAllAccounts = async (): Promise<Account[]> => {
  return await db.accountList.filter((o) => o.dr === '0').toArray();
};

// Get all addresses
export const getAllAddresses = async (): Promise<Address[]> => {
  return await db.addressList.filter((o) => o.dr === '0').toArray();
};

// Get all chains
export const getAllChains = async (): Promise<Chain[]> => {
  return await db.chainList.filter((o) => o.dr === '0').toArray();
};

// Get hot chains
export const getHotChains = async (): Promise<Chain[]> => {
  return await db.chainList.filter((o) => o.dr === '0' && o.custom === '0').toArray();
};

// Get hot chains
export const getCustomChains = async (): Promise<Chain[]> => {
  return await db.chainList.filter((o) => o.dr === '0' && o.custom === '1').toArray();
};

export const getChainByChainId = async (chainId: string): Promise<Chain[]> => {
  return await db.chainList.where('chainId').equals(chainId).toArray();
};

// Get all chain types
export const getAllChainTypes = async (): Promise<ChainType[]> => {
  return await db.chainTypeList.filter((o) => o.dr === '0').toArray();
};

export const getAllChainRpcs = async (): Promise<ChainRpc[]> => {
  return await db.chainRpcList.filter((o) => o.dr === '0').toArray();
};

export const getTokensByGroupValue = async (groupValue: string): Promise<ChainToken[]> => {
  return await db.chainTokenList
    .filter((o) => isActiveRecord(o.dr))
    .and((token) => token.groupValue === groupValue)
    .toArray();
};

export const updateChainTokens = async (chainToken: ChainToken[]) => {
  return await db.chainTokenList.bulkPut(chainToken);
};

export const updateChainToken = async (chainId: string, address: string, selected: string, chainToken?: ChainToken[]) => {
  const token = await db.chainTokenList.where('[chainId+address]').equals([chainId, address]).toArray();
  if (token && token.length > 0) {
    await db.chainTokenList.update([chainId, address], { selected });
  } else if (chainToken) {
    addChainTokenLists(chainToken);
  }
  denomMapCache.delete(chainId);
};

export const updateAccountName = async (id: string, name: string) => {
  await db.accountList.update(id, { name });
};

export const getWalletMnemonicBackupPending = async (walletId: string): Promise<boolean> => {
  if (!walletId) {
    return false;
  }
  const wallet = await db.walletList.get(walletId);
  return !!wallet?.mnemonicBackupPending;
};

export const updateWalletMnemonicBackupPending = async (walletId: string, pending: boolean) => {
  if (!walletId) {
    return;
  }
  await db.walletList.update(walletId, { mnemonicBackupPending: pending });
};

export const getAllChainTokens = async (page: number): Promise<ChainToken[]> => {
  return await db.chainTokenList
    .filter((o) => !isSelectedToken(o.selected))
    .and((token) => isActiveRecord(token.dr))
    .offset(page * 20)
    .limit(20)
    .toArray();
};

export const getChainTokensByChainId = async (chainId: string, page: number): Promise<ChainToken[]> => {
  return await db.chainTokenList
    .where('chainId')
    .equals(chainId)
    .and((token) => isActiveRecord(token.dr))
    .and((token) => !isSelectedToken(token.selected))
    .offset(page * 20)
    .limit(20)
    .toArray();
};

export const getSelectedChainTokensByChainId = async (chainId: string): Promise<ChainToken[]> => {
  let tokens = await querySelectedTokens(chainId);
  if (!tokens.length && isSupportedCosmosChain(chainId)) {
    await ensureSelectedNativeTokens([chainId]);
    tokens = await querySelectedTokens(chainId);
  }
  return tokens;
};

export const getAllSelectedChainTokens = async (): Promise<ChainToken[]> => {
  let tokens = await querySelectedTokens();
  if (!tokens.length) {
    await ensureSelectedNativeTokens();
    tokens = await querySelectedTokens();
  }
  return tokens;
};

export const getWalletAccountByAddress = async (address: string): Promise<{ wallet?: Wallet; account?: Account } | null> => {
  const myAddress = await db.addressList
    .filter((o) => o.address === address)
    .and((token) => token.dr === '0')
    .toArray();
  if (myAddress.length) {
    const wallet = await db.walletList.get(myAddress[0].wid);
    const account = await db.accountList.where('[wid+index]').equals([myAddress[0].wid, myAddress[0].index]).first();
    return { wallet, account };
  } else {
    return null;
  }
};

export const getSelectedTokensBalance = async (filterAssets: boolean = false, context?: StorageAccountQueryContext): Promise<ChainToken[]> => {
  const selectedAccount = resolveAccountQueryContext(context);
  if (!selectedAccount) {
    return [];
  }
  let tokens = await querySelectedTokens();
  if (!tokens.length) {
    await ensureSelectedNativeTokens();
    tokens = await querySelectedTokens();
  }
  const groups: Record<string, any> = {};
  const tokensBalances = await Dexie.Promise.all(
    tokens.map(async (token) => {
      const chain = await db.chainList.get(token.chainId);
      const address = await db.addressList.where('[wid+index+chainId]').equals([selectedAccount.wid, selectedAccount.index, token.chainId]).first();
      const accountAddress = address?.address || '';
      const contract = (token.address || token.addressLow || '').toLowerCase();
      const assets = accountAddress && contract ? await db.accountAssets.get([token.chainId, accountAddress, contract]) : undefined;
      const newToken = toChainTokenAssetView({
        token,
        chain,
        accountAddress,
        asset: assets,
      });
      if (token.groupValue) {
        if (filterAssets) {
          if (newToken.amount > 0) {
            groups[token.groupValue] = groups[token.groupValue] ? [...groups[token.groupValue], newToken] : [newToken];
          }
        } else {
          groups[token.groupValue] = groups[token.groupValue] ? [...groups[token.groupValue], newToken] : [newToken];
        }
      }
      return newToken;
    }),
  );
  const selectedGroupValue = new Set<string>();
  const newTokens = tokensBalances
    .map((item) => {
      return { ...item, currencyGroups: item.groupValue ? groups[item.groupValue] : [] };
    })
    .filter((o) => {
      const isNew = !selectedGroupValue.has(o.groupValue);
      if (isNew && o.groupValue) {
        selectedGroupValue.add(o.groupValue);
      }
      return filterAssets ? isNew && o.amount > 0 : isNew;
    });

  return newTokens;
};

export const getTokensBalanceByChainId = async (chainId: string, filterAssets: boolean = false, context?: StorageAccountQueryContext): Promise<ChainToken[]> => {
  const selectedAccount = resolveAccountQueryContext(context);
  if (!selectedAccount) {
    return [];
  }
  const chain = await db.chainList.get(chainId);
  const address = await db.addressList.where('[wid+index+chainId]').equals([selectedAccount.wid, selectedAccount.index, chainId]).first();
  let tokens = await querySelectedTokens(chainId);
  if (!tokens.length && isSupportedCosmosChain(chainId)) {
    await ensureSelectedNativeTokens([chainId]);
    tokens = await querySelectedTokens(chainId);
  }

  const tokensBalances = await Dexie.Promise.all(
    tokens.map(async (token) => {
      const accountAddress = address?.address || '';
      const contract = (token.address || token.addressLow || '').toLowerCase();
      const assets = accountAddress && contract ? await db.accountAssets.get([token.chainId, accountAddress, contract]) : undefined;
      return {
        ...toChainTokenAssetView({
          token,
          chain,
          accountAddress,
          asset: assets,
        }),
        currencyGroups: [],
      };
    }),
  );

  return filterAssets ? tokensBalances.filter((o) => o.amount > 0) : tokensBalances;
};

export const getTokensBalanceByGroupValue = async (groupValue: string, filterAssets: boolean = false, context?: StorageAccountQueryContext): Promise<ChainToken[]> => {
  const selectedAccount = resolveAccountQueryContext(context);
  if (!selectedAccount) {
    return [];
  }
  const tokens = await db.chainTokenList
    .filter((token) => token.groupValue === groupValue)
    .and((token) => isActiveRecord(token.dr))
    .toArray();
  const tokensBalances = await Dexie.Promise.all(
    tokens.map(async (token) => {
      const chain = await db.chainList.get(token.chainId);
      const address = await db.addressList.where('[wid+index+chainId]').equals([selectedAccount.wid, selectedAccount.index, token.chainId]).first();
      const accountAddress = address?.address || '';
      const contract = (token.address || token.addressLow || '').toLowerCase();
      const assets = accountAddress && contract ? await db.accountAssets.get([token.chainId, accountAddress, contract]) : undefined;
      return toChainTokenAssetView({
        token,
        chain,
        accountAddress,
        asset: assets,
      });
    }),
  );

  return tokensBalances;
};
