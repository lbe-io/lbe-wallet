import { fromBase64, fromHex } from '@cosmjs/encoding';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { AuthInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { buildDecodedTxPreview, toSendTxApprovalPreview, type SendTxApprovalPreview } from '@/cosmos/tx/txPreviewAdapter';
export type { SendTxApprovalPreview } from '@/cosmos/tx/txPreviewAdapter';

export type ApprovalArbitraryDataPreview = {
  length: number;
  text: string;
  hex: string;
};

export type SignApprovalPreview = {
  mode: 'amino' | 'direct' | 'unknown';
  chainId: string;
  accountNumber?: string;
  sequence?: string;
  memo?: string;
  signerCount?: number;
  messageTypes: string[];
  feeCoins: string[];
  gasLimit?: string;
  arbitraryData?: ApprovalArbitraryDataPreview;
  error?: string;
};

export const normalizeBytes = (value: Uint8Array | string | number[] | undefined): Uint8Array | null => {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return Uint8Array.from(value);
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    if (raw.startsWith('0x')) return fromHex(raw.slice(2));
    return fromBase64(raw);
  }
  return null;
};

export const parseFeeCoins = (coins: any[] | undefined) => {
  return (coins || []).map((coin: any) => `${coin?.amount || '0'} ${coin?.denom || '-'}`);
};

const decodeAminoPreview = (signDoc: Record<string, any>): SignApprovalPreview => {
  const chainId = String(signDoc.chain_id ?? signDoc.chainId ?? '');
  const accountNumber = signDoc.account_number ?? signDoc.accountNumber;
  const sequence = signDoc.sequence;
  const memo = signDoc.memo || '';
  const msgs = Array.isArray(signDoc.msgs) ? signDoc.msgs : [];
  const messageTypes = msgs.map((msg: any) => msg?.type || msg?.['@type'] || 'unknown');
  const feeCoins = parseFeeCoins(signDoc.fee?.amount);
  const gasLimit = signDoc.fee?.gas !== undefined ? String(signDoc.fee.gas) : '';

  return {
    mode: 'amino',
    chainId,
    accountNumber: accountNumber !== undefined ? String(accountNumber) : '',
    sequence: sequence !== undefined ? String(sequence) : '',
    memo,
    messageTypes,
    feeCoins,
    gasLimit,
  };
};

const decodeDirectPreview = (signDoc: Record<string, any>): SignApprovalPreview => {
  const chainId = String(signDoc.chainId ?? signDoc.chain_id ?? '');
  const accountNumber = signDoc.accountNumber ?? signDoc.account_number;

  const bodyBytes = normalizeBytes(signDoc.bodyBytes ?? signDoc.body_bytes);
  const authInfoBytes = normalizeBytes(signDoc.authInfoBytes ?? signDoc.auth_info_bytes);
  const txBody = bodyBytes ? TxBody.decode(bodyBytes) : TxBody.fromPartial({});
  const authInfo = authInfoBytes ? AuthInfo.decode(authInfoBytes) : AuthInfo.fromPartial({});

  return {
    mode: 'direct',
    chainId,
    accountNumber: accountNumber !== undefined ? String(accountNumber) : '',
    memo: txBody.memo || '',
    signerCount: authInfo.signerInfos?.length || 0,
    messageTypes: (txBody.messages || []).map((msg) => msg.typeUrl || 'unknown'),
    feeCoins: parseFeeCoins(authInfo.fee?.amount as any[] | undefined),
    gasLimit: authInfo.fee?.gasLimit !== undefined ? authInfo.fee.gasLimit.toString() : '',
  };
};

export const decodeSignPreview = (method: string | undefined, signDoc: Record<string, any>) => {
  try {
    const isDirectMethod = (method || '').toLowerCase().includes('direct');
    const hasDirectShape = signDoc?.bodyBytes || signDoc?.body_bytes || signDoc?.authInfoBytes || signDoc?.auth_info_bytes;
    if (isDirectMethod || hasDirectShape) {
      return { preview: decodeDirectPreview(signDoc), error: '' };
    }
    const hasAminoShape = signDoc?.msgs || signDoc?.fee || signDoc?.chain_id;
    if (hasAminoShape) {
      return { preview: decodeAminoPreview(signDoc), error: '' };
    }
    return {
      preview: {
        mode: 'unknown',
        chainId: '',
        messageTypes: [],
        feeCoins: [],
      } as SignApprovalPreview,
      error: 'Unknown sign doc format',
    };
  } catch (error: any) {
    return {
      preview: {
        mode: 'unknown',
        chainId: '',
        messageTypes: [],
        feeCoins: [],
      } as SignApprovalPreview,
      error: error?.message || 'Failed to decode sign doc',
    };
  }
};

export const decodeArbitraryData = (value: string | Uint8Array | number[] | undefined): ApprovalArbitraryDataPreview => {
  if (value === undefined || value === null) return { length: 0, text: '', hex: '' };
  if (typeof value === 'string') {
    return {
      length: value.length,
      text: value,
      hex: '',
    };
  }
  const bytes = value instanceof Uint8Array ? value : Uint8Array.from(value);
  let text = '';
  try {
    text = new TextDecoder().decode(bytes);
  } catch {
    text = '';
  }
  return {
    length: bytes.length,
    text,
    hex: `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`,
  };
};

export const getTxSize = (txBytes: Uint8Array | string | number[] | undefined) => {
  if (!txBytes) return 0;
  if (txBytes instanceof Uint8Array) return txBytes.length;
  if (Array.isArray(txBytes)) return txBytes.length;
  if (typeof txBytes === 'string') return txBytes.length;
  return 0;
};

export const normalizeTxBytes = (txBytes: Uint8Array | string | number[] | undefined): Uint8Array | null => {
  if (!txBytes) return null;
  if (txBytes instanceof Uint8Array) return txBytes;
  if (Array.isArray(txBytes)) return Uint8Array.from(txBytes);
  if (typeof txBytes === 'string') {
    const value = txBytes.trim();
    if (!value) return null;
    if (value.startsWith('0x')) {
      return fromHex(value.slice(2));
    }
    return fromBase64(value);
  }
  return null;
};

export const decodeTxPreview = (txBytes: Uint8Array | string | number[] | undefined, mode?: unknown): { preview: SendTxApprovalPreview | null; error?: string } => {
  try {
    const bytes = normalizeTxBytes(txBytes);
    if (!bytes) return { preview: null };

    const txRaw = decodeTxRaw(bytes);
    const txBody = txRaw.body || TxBody.fromPartial({});
    const authInfo = txRaw.authInfo || AuthInfo.fromPartial({});
    const preview = buildDecodedTxPreview({
      txSize: getTxSize(txBytes),
      messageTypes: (txBody.messages || []).map((msg) => msg.typeUrl || 'unknown'),
      memo: txBody.memo || '',
      signerCount: authInfo.signerInfos?.length || 0,
      signatureCount: txRaw.signatures?.length || 0,
      feeCoins: parseFeeCoins(authInfo.fee?.amount as any[] | undefined),
      gasLimit: authInfo.fee?.gasLimit?.toString?.() || String((authInfo.fee as any)?.gasLimit || ''),
      mode,
    });

    return {
      preview: toSendTxApprovalPreview(preview),
    };
  } catch (error: any) {
    return {
      preview: null,
      error: error?.message || 'Failed to decode tx bytes',
    };
  }
};
