import type { ChainToken } from '@/cosmos/storage/types';
import { toDenomTraceInfo, type DenomTraceInfo } from './denomTraceAdapter';

export type AssetMetadata = {
  assetId: string;
  chainId: string;
  contract: string;
  contractLow: string;
  assetType: string;
  tokenType: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  groupValue: string;
  tags: string;
  selected: string;
  custom: string;
  sorts: string;
  chainType: string;
  chainName: string;
  denomTrace: DenomTraceInfo;
};

const normalizeContract = (contract?: string) => (contract || '').trim();

export const buildAssetId = (chainId: string, contract?: string) => {
  const normalizedContract = normalizeContract(contract).toLowerCase();
  return `${chainId}:${normalizedContract}`;
};

export const toAssetMetadata = (
  token: Pick<ChainToken, 'chainId' | 'address' | 'addressLow' | 'assetType' | 'type' | 'symbol' | 'name' | 'decimals' | 'logoURI' | 'groupValue' | 'tags' | 'selected' | 'custom' | 'sorts'>,
  chain?: {
    name?: string;
    type?: string;
  },
): AssetMetadata => {
  const contract = normalizeContract(token.address || token.addressLow);
  return {
    assetId: buildAssetId(token.chainId, contract),
    chainId: token.chainId,
    contract,
    contractLow: contract.toLowerCase(),
    assetType: token.assetType || 'token',
    tokenType: token.type || 'native',
    symbol: token.symbol || '',
    name: token.name || token.symbol || '',
    decimals: Number(token.decimals || '0') || 0,
    logoURI: token.logoURI || '',
    groupValue: token.groupValue || '',
    tags: token.tags || '',
    selected: token.selected || '0',
    custom: token.custom || '0',
    sorts: token.sorts || '0',
    chainType: chain?.type || '',
    chainName: chain?.name || '',
    denomTrace: toDenomTraceInfo(contract),
  };
};
