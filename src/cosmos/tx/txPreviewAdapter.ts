import { buildDecodedTxFeePolicy, buildPopupSendFeePolicy, type TxFeePolicy } from './feePreviewContract';

export type TxPreviewModel = {
  txSize: number;
  messageTypes: string[];
  memo: string;
  signerCount: number;
  signatureCount: number;
  feePolicy: TxFeePolicy;
};

export type PopupSendTxPreview = TxPreviewModel & {
  kind: 'popup_send';
  chainId: string;
  fromAddress: string;
  toAddress: string;
  denom: string;
  amountAtomic: string;
};

export type SendTxApprovalPreview = TxPreviewModel & {
  feeCoins: string[];
  gasLimit: string;
  error?: string;
};

type DecodedTxPreviewInput = {
  txSize: number;
  messageTypes: string[];
  memo?: unknown;
  signerCount?: unknown;
  signatureCount?: unknown;
  feeCoins?: unknown;
  gasLimit?: unknown;
  mode?: unknown;
};

type PopupSendTxPreviewInput = {
  chainId: string;
  fromAddress: string;
  toAddress: string;
  denom: string;
  amountAtomic: string;
  memo?: unknown;
  gasLimit?: unknown;
  gasPrice?: unknown;
  gasDenom?: unknown;
  mode?: unknown;
  messageTypes?: string[];
};

const toSafeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const buildDecodedTxPreview = ({ txSize, messageTypes, memo, signerCount, signatureCount, feeCoins, gasLimit, mode }: DecodedTxPreviewInput): TxPreviewModel => {
  const feePolicy = buildDecodedTxFeePolicy({
    memo,
    mode,
    gasLimit,
    feeCoins,
  });

  return {
    txSize: Math.max(0, toSafeNumber(txSize)),
    messageTypes: messageTypes.filter((item) => typeof item === 'string' && item.trim().length > 0),
    memo: feePolicy.memo,
    signerCount: Math.max(0, toSafeNumber(signerCount)),
    signatureCount: Math.max(0, toSafeNumber(signatureCount)),
    feePolicy,
  };
};

export const toSendTxApprovalPreview = (preview: TxPreviewModel, error?: string): SendTxApprovalPreview => ({
  ...preview,
  feeCoins: preview.feePolicy.feeCoins,
  gasLimit: preview.feePolicy.gasLimit,
  error,
});

export const buildFallbackSendTxApprovalPreview = ({ txSize, mode }: { txSize: number; mode?: unknown }): SendTxApprovalPreview =>
  toSendTxApprovalPreview(
    buildDecodedTxPreview({
      txSize,
      messageTypes: [],
      memo: '',
      signerCount: 0,
      signatureCount: 0,
      feeCoins: [],
      gasLimit: '',
      mode,
    }),
  );

export const buildPopupSendTxPreview = ({
  chainId,
  fromAddress,
  toAddress,
  denom,
  amountAtomic,
  memo,
  gasLimit,
  gasPrice,
  gasDenom,
  mode = 'block',
  messageTypes = ['/cosmos.bank.v1beta1.MsgSend'],
}: PopupSendTxPreviewInput): PopupSendTxPreview => {
  const feePolicy = buildPopupSendFeePolicy({
    memo,
    mode,
    gasLimit,
    gasPrice,
    gasDenom,
  });

  return {
    kind: 'popup_send',
    chainId,
    fromAddress,
    toAddress,
    denom,
    amountAtomic,
    txSize: 0,
    messageTypes,
    memo: feePolicy.memo,
    signerCount: 1,
    signatureCount: 0,
    feePolicy,
  };
};
