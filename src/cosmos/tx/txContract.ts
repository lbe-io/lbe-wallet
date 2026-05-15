import type { ChainToken } from '@/cosmos/storage';
export type { TxFeePolicy, TxFeePolicyInput } from './feePreviewContract';
export type { PopupSendTxPreview, SendTxApprovalPreview, TxPreviewModel } from './txPreviewAdapter';

export type TxBroadcastMode = 'sync' | 'async' | 'block';

export type TxBytesLike = Uint8Array | string | number[];

export type PopupSendTxRequest = {
  kind: 'popup_send';
  chainId: string;
  token: ChainToken;
  amountAtomic: string;
  denom: string;
  fromAddress: string;
  toAddress: string;
  accountIndex?: number | string;
  gasPrice?: number;
  gasLimit?: number;
  memo: string;
};

export type ProviderBroadcastTxRequest = {
  kind: 'provider_sendTx';
  chainId: string;
  txBytes: TxBytesLike;
  mode: TxBroadcastMode;
  memo: string;
};

export type PopupSendTxResult = {
  kind: 'popup_send';
  hash: string;
  height: number;
  gasUsed: bigint;
  gasWanted: bigint;
  denom: string;
  amount: string;
};

export type ProviderBroadcastTxResult = {
  kind: 'provider_sendTx';
  hash: Uint8Array;
  mode: TxBroadcastMode;
};

export const normalizeTxBroadcastMode = (mode: unknown, fallback: TxBroadcastMode = 'sync'): TxBroadcastMode | null => {
  if (mode === undefined || mode === null || mode === '') {
    return fallback;
  }
  if (mode === 'sync' || mode === 'async' || mode === 'block') {
    return mode;
  }
  return null;
};

export const normalizeTxMemo = (memo: unknown) => {
  return typeof memo === 'string' ? memo.trim() : '';
};

export const buildPopupSendTxRequest = (input: Omit<PopupSendTxRequest, 'kind' | 'memo'> & { memo?: unknown }): PopupSendTxRequest => {
  return {
    ...input,
    kind: 'popup_send',
    memo: normalizeTxMemo(input.memo),
  };
};

export const buildProviderBroadcastTxRequest = (input: Omit<ProviderBroadcastTxRequest, 'kind' | 'memo' | 'mode'> & { memo?: unknown; mode?: unknown }): ProviderBroadcastTxRequest | null => {
  const mode = normalizeTxBroadcastMode(input.mode, 'sync');
  if (!mode) {
    return null;
  }
  return {
    ...input,
    kind: 'provider_sendTx',
    mode,
    memo: normalizeTxMemo(input.memo),
  };
};

export const toPopupSendTxResult = (input: Omit<PopupSendTxResult, 'kind'>): PopupSendTxResult => {
  return {
    kind: 'popup_send',
    ...input,
  };
};

export const toProviderBroadcastTxResult = (txHash: Uint8Array, mode: TxBroadcastMode): ProviderBroadcastTxResult => {
  return {
    kind: 'provider_sendTx',
    hash: txHash,
    mode,
  };
};

export const toLegacyProviderBroadcastResult = (result: ProviderBroadcastTxResult): Uint8Array => result.hash;
