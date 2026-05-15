import type { WalletController } from '@/app/contexts';

type WalletSelectionWriter = Pick<WalletController, 'setSelectedAccount' | 'setSelectedChain'>;

const normalizeValue = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');

export const syncSelectedAccount = (wallet: WalletSelectionWriter, accountAddress?: string | null) => {
  const normalized = normalizeValue(accountAddress);
  if (!normalized) {
    return '';
  }
  wallet.setSelectedAccount(normalized);
  return normalized;
};

export const syncSelectedChain = (wallet: WalletSelectionWriter, chainId?: string | null) => {
  const normalized = normalizeValue(chainId);
  if (!normalized) {
    return '';
  }
  wallet.setSelectedChain(normalized);
  return normalized;
};
