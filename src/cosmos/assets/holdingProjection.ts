import type { AccountAssets } from '@/cosmos/storage/types';
import type { CosmosAssetSnapshot } from '@/entrypoints/background/service/keyring/types';
import type { AssetMetadata } from './assetMetadataAdapter';
import type { PriceSource } from './priceSourceAdapter';

export type AssetHolding = {
  chainId: string;
  accountAddress: string;
  contract: string;
  amount: string;
  show: string;
  metadata: AssetMetadata;
  priceSource: PriceSource;
};

export type AssetViewProjection = {
  balance: string;
  price: number;
  amount: number;
};

type AccountAssetRowInput = {
  wid: string;
  aIndex: string;
  address: string;
  chainId: string;
  contract: string;
  amount: string;
  priceSource: PriceSource;
};

export const toAssetHolding = ({ metadata, accountAddress, asset, priceSource }: { metadata: AssetMetadata; accountAddress: string; asset?: Pick<AccountAssets, 'balance' | 'show'> | null; priceSource: PriceSource }): AssetHolding => ({
  chainId: metadata.chainId,
  accountAddress,
  contract: metadata.contractLow,
  amount: String(asset?.balance || '0'),
  show: asset?.show || '1',
  metadata,
  priceSource,
});

export const toAssetViewProjection = (holding: AssetHolding): AssetViewProjection => {
  const amount = parseFloat(holding.amount || '0');
  const price = parseFloat(holding.priceSource.price || '0');
  return {
    balance: (amount * price).toFixed(2),
    price,
    amount,
  };
};

export const toAccountAssetRow = ({ wid, aIndex, address, chainId, contract, amount, priceSource }: AccountAssetRowInput): AccountAssets => ({
  wid,
  aIndex,
  address,
  chainId,
  contract: (contract || '').toLowerCase(),
  balance: String(amount || '0'),
  price: priceSource.price,
  show: '1',
});

export const toAccountAssetRowsFromSnapshot = ({
  wid,
  aIndex,
  address,
  chainId,
  snapshot,
  nativePriceSource,
}: {
  wid: string;
  aIndex: string;
  address: string;
  chainId: string;
  snapshot: CosmosAssetSnapshot;
  nativePriceSource: PriceSource;
}): AccountAssets[] => {
  const nativeDenom = (snapshot.nativeBalance?.denom || '').toLowerCase();
  const balances = snapshot.tokenBalances?.length ? snapshot.tokenBalances : [snapshot.nativeBalance];

  return balances
    .map((token) => {
      const denom = (token?.denom || '').toLowerCase();
      if (!denom) {
        return null;
      }
      return toAccountAssetRow({
        wid,
        aIndex,
        address,
        chainId,
        contract: denom,
        amount: token?.displayAmount || '0',
        priceSource: denom === nativeDenom ? nativePriceSource : { currency: 'USD', source: 'none', price: '0' },
      });
    })
    .filter((row): row is AccountAssets => !!row);
};
