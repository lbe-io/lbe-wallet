import type { WalletController } from '@/app/contexts';
import { toAssetMetadata } from '@/cosmos/assets/assetMetadataAdapter';
import { toAccountAssetRowsFromSnapshot } from '@/cosmos/assets/holdingProjection';
import { toNativeAssetPriceSource } from '@/cosmos/assets/priceSourceAdapter';
import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';
import { addAccountAssets, getAddressByChainId, getChainByChainId, getSelectedTokensBalance, getTokensBalanceByChainId, type ChainToken, type StorageAccountQueryContext } from '@/cosmos/storage';
import type { WalletNetworkScope } from '@/popup/types/walletUi';

type LoadWalletAssetDisplayDataParams = WalletNetworkScope & {
  selectedAccount?: StorageAccountQueryContext;
  preserveTokenList?: boolean;
};

type WalletAssetDisplayData = {
  currencyList: ChainToken[];
  currencyGroupList: ChainToken[];
  tokenList?: ChainToken[];
};

type RefreshWalletAssetSnapshotsParams = {
  walletController: WalletController;
  currencyList: ChainToken[];
  wid?: string;
  accountIndex?: number | string;
};

export const loadWalletAssetDisplayData = async ({ isAllNetworks, activeChainId, selectedChain, selectedAccount, preserveTokenList = false }: LoadWalletAssetDisplayDataParams): Promise<WalletAssetDisplayData> => {
  if (isAllNetworks) {
    const listData = await getSelectedTokensBalance(false, selectedAccount);
    let list: ChainToken[] = [];
    listData.forEach((item: any) => {
      list = item.groupValue ? [...list, ...item.currencyGroups] : [...list, item];
    });
    return {
      currencyList: list,
      currencyGroupList: listData,
      ...(preserveTokenList ? {} : { tokenList: list }),
    };
  }

  const list = await getTokensBalanceByChainId(activeChainId, false, selectedAccount);
  if (list.length > 0) {
    return {
      currencyList: list,
      currencyGroupList: list,
      ...(preserveTokenList ? {} : { tokenList: list }),
    };
  }

  const chainInfo = selectedChain?.chainId ? selectedChain : (await getChainByChainId(activeChainId))[0];
  const chainConfig = getCosmosChainConfig(activeChainId);
  const fallbackToken: ChainToken[] = activeChainId
    ? (chainConfig
        ? [
            {
              coinDenom: chainConfig.coinDenom,
              coinMinimalDenom: chainConfig.coinMinimalDenom,
              coinDecimals: chainConfig.coinDecimals,
            },
            ...(chainConfig.extraCurrencies || []),
          ]
        : []
      ).map((currency) => ({
        ...(() => {
          const metadata = toAssetMetadata(
            {
              chainId: activeChainId,
              type: 'native',
              assetType: 'token',
              address: currency?.coinMinimalDenom || '',
              addressLow: (currency?.coinMinimalDenom || '').toLowerCase(),
              name: currency?.coinDenom || chainInfo?.token || chainInfo?.symbol || chainInfo?.name || 'TOKEN',
              symbol: currency?.coinDenom || chainInfo?.symbol || chainInfo?.token || 'TOKEN',
              decimals: String(currency?.coinDecimals ?? chainInfo?.decimals ?? 6),
              logoURI: chainInfo?.icon || '',
              tags: '',
              groupValue: '',
              selected: '1',
              custom: '0',
              sorts: '0',
            },
            chainInfo,
          );
          return metadata;
        })(),
        chainId: activeChainId,
        type: 'native',
        assetType: 'token',
        address: currency?.coinMinimalDenom || '',
        addressLow: (currency?.coinMinimalDenom || '').toLowerCase(),
        name: currency?.coinDenom || chainInfo?.token || chainInfo?.symbol || chainInfo?.name || 'TOKEN',
        symbol: currency?.coinDenom || chainInfo?.symbol || chainInfo?.token || 'TOKEN',
        decimals: String(currency?.coinDecimals ?? chainInfo?.decimals ?? 6),
        logoURI: chainInfo?.icon || '',
        tags: '',
        groupValue: '',
        selected: '1',
        custom: '0',
        sorts: '0',
        dr: '0',
        chainInfo,
        accountAddress: '',
        chainType: chainInfo?.type || '',
        chainName: chainInfo?.name || '',
        balance: '0.00',
        price: 0,
        amount: 0,
        currencyGroups: [],
      }))
    : [];

  return {
    currencyList: fallbackToken,
    currencyGroupList: fallbackToken,
    ...(preserveTokenList ? {} : { tokenList: fallbackToken }),
  };
};

export const refreshWalletAssetSnapshots = async ({ walletController, currencyList, wid, accountIndex }: RefreshWalletAssetSnapshotsParams) => {
  if (!wid || accountIndex === undefined || accountIndex === null || !currencyList.length) {
    return false;
  }

  const normalizedIndex = typeof accountIndex === 'number' ? accountIndex.toString() : String(accountIndex);
  const chainIds = Array.from(new Set(currencyList.map((item) => item.chainId).filter(Boolean)));
  if (!chainIds.length) {
    return false;
  }

  const snapshots = await Promise.all(
    chainIds.map(async (chainId) => {
      const address = await getAddressByChainId(wid, normalizedIndex, chainId);
      if (!address?.address) {
        return null;
      }

      try {
        const snapshot = await walletController.getCosmosAssetSnapshot(chainId, address.address);
        const usdPrice = await walletController.getCosmosNativePriceUsd(chainId).catch(() => '1');
        return { chainId, address: address.address, snapshot, usdPrice };
      } catch (error) {
        console.error(`[wallet] failed to refresh assets for ${chainId}`, error);
        return null;
      }
    }),
  );

  const assets = snapshots
    .filter((item): item is NonNullable<typeof item> => !!item)
    .flatMap((item) =>
      toAccountAssetRowsFromSnapshot({
        wid,
        aIndex: normalizedIndex,
        address: item.address,
        chainId: item.chainId,
        snapshot: item.snapshot,
        nativePriceSource: toNativeAssetPriceSource(item.usdPrice || '1'),
      }),
    )
    .filter((item) => !!item.contract);

  if (!assets.length) {
    return false;
  }

  await addAccountAssets(assets as any);
  return true;
};

export const calculateWalletBalanceTotal = (currencyList: any[]) => {
  return currencyList.reduce((sum, item) => sum + parseFloat(String(item?.balance ?? 0)), 0);
};
