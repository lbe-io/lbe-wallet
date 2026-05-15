import type { AccountAssets } from '@/cosmos/storage/types';

export type PriceSource = {
  currency: 'USD';
  source: 'native_snapshot_usd' | 'account_asset_snapshot' | 'none';
  price: string;
};

export const toPriceSource = (asset?: Pick<AccountAssets, 'price'> | null): PriceSource => {
  const price = String(asset?.price || '0');
  return {
    currency: 'USD',
    source: Number(price) > 0 ? 'account_asset_snapshot' : 'none',
    price,
  };
};

export const toNativeAssetPriceSource = (price?: string): PriceSource => {
  const normalizedPrice = String(price || '0');
  return {
    currency: 'USD',
    source: Number(normalizedPrice) > 0 ? 'native_snapshot_usd' : 'none',
    price: normalizedPrice,
  };
};
