import type { WalletController } from '@/app/contexts';
import { addAccountAssets, getAddressByChainId } from '@/cosmos/storage';
import type { AccountAssets } from '@/cosmos/storage/types';

type RefreshParams = {
  walletController: WalletController;
  chainId: string;
  wid?: string;
  accountIndex?: number | string;
};

export const refreshCosmosAccountAssets = async ({ walletController, chainId, wid, accountIndex }: RefreshParams) => {
  if (!wid || accountIndex === undefined || accountIndex === null) {
    return null;
  }

  const normalizedIndex = typeof accountIndex === 'number' ? accountIndex.toString() : String(accountIndex);

  const addressEntry = await getAddressByChainId(wid, normalizedIndex, chainId);
  if (!addressEntry?.address) {
    return null;
  }

  const snapshot = await walletController.getCosmosAssetSnapshot(chainId, addressEntry.address).catch(() => null);
  if (!snapshot) {
    return null;
  }

  const usdPrice = await walletController.getCosmosNativePriceUsd(chainId).catch(() => '1');
  const nativeDenom = (snapshot.nativeBalance?.denom || '').toLowerCase();
  const balances = snapshot.tokenBalances?.length ? snapshot.tokenBalances : [snapshot.nativeBalance];

  const assets = balances
    .filter((token): token is NonNullable<typeof token> => !!token)
    .map((token) => {
      const denom = (token?.denom || '').toLowerCase();
      if (!denom) {
        return null;
      }
      const balance = token?.displayAmount || '0';
      const price = denom === nativeDenom ? usdPrice || '1' : '0';
      return {
        wid,
        aIndex: normalizedIndex,
        address: addressEntry.address,
        chainId,
        contract: denom,
        balance,
        price,
        show: '1',
      } as AccountAssets;
    })
    .filter((item): item is AccountAssets => !!item);

  if (assets.length) {
    await addAccountAssets(assets as any);
  }

  return {
    address: addressEntry.address,
    balances: assets.reduce<Record<string, string>>((acc, item) => {
      acc[item.contract] = item.balance;
      return acc;
    }, {}),
  };
};

export default refreshCosmosAccountAssets;
