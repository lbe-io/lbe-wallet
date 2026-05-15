import { normalizeTxBroadcastMode, normalizeTxMemo, type TxBroadcastMode } from './txContract';

export type TxFeePolicySource = 'popup_selected_fee' | 'tx_auth_info' | 'unknown';

export type TxFeePolicy = {
  mode: TxBroadcastMode;
  memo: string;
  gasLimit: string;
  feeCoins: string[];
  gasPrice: string;
  source: TxFeePolicySource;
};

export type TxFeePolicyInput = {
  memo?: unknown;
  mode?: unknown;
  gasLimit?: unknown;
  feeCoins?: unknown;
  gasPrice?: unknown;
  gasDenom?: unknown;
  source?: TxFeePolicySource;
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const normalizeTxGasLimit = (value: unknown) => {
  if (typeof value === 'bigint') {
    return value >= 0n ? value.toString() : '';
  }
  const numeric = toFiniteNumber(value);
  if (numeric === null || numeric < 0) {
    return '';
  }
  return String(Math.floor(numeric));
};

export const normalizeTxFeeCoins = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        const coin = item as { amount?: unknown; denom?: unknown };
        const amount = typeof coin.amount === 'string' ? coin.amount.trim() : String(coin.amount ?? '').trim();
        const denom = typeof coin.denom === 'string' ? coin.denom.trim() : '';
        return amount && denom ? `${amount} ${denom}` : '';
      }
      return '';
    })
    .filter(Boolean);
};

export const normalizeTxGasPriceDisplay = (gasPrice: unknown, gasDenom?: unknown) => {
  const denom = typeof gasDenom === 'string' ? gasDenom.trim() : '';
  const numeric = toFiniteNumber(gasPrice);
  if (numeric !== null && numeric > 0 && denom) {
    return `${numeric} ${denom}`;
  }
  if (typeof gasPrice === 'string') {
    return gasPrice.trim();
  }
  return '';
};

export const buildTxFeePolicy = ({ memo, mode, gasLimit, feeCoins, gasPrice, gasDenom, source = 'unknown' }: TxFeePolicyInput): TxFeePolicy => {
  return {
    mode: normalizeTxBroadcastMode(mode, 'sync') || 'sync',
    memo: normalizeTxMemo(memo),
    gasLimit: normalizeTxGasLimit(gasLimit),
    feeCoins: normalizeTxFeeCoins(feeCoins),
    gasPrice: normalizeTxGasPriceDisplay(gasPrice, gasDenom),
    source,
  };
};

export const buildPopupSendFeePolicy = (input: Omit<TxFeePolicyInput, 'feeCoins' | 'source'>) =>
  buildTxFeePolicy({
    ...input,
    source: 'popup_selected_fee',
  });

export const buildDecodedTxFeePolicy = (input: Omit<TxFeePolicyInput, 'gasPrice' | 'gasDenom' | 'source'>) =>
  buildTxFeePolicy({
    ...input,
    source: 'tx_auth_info',
  });
