import type { AddressTokenSummary, Inscription, TokenBalance, TokenTransfer } from '@/shared/legacyTypes';

export type UICachedDataEntry = {
  allInscriptionList: {
    currentPage: number;
    pageSize: number;
    total: number;
    list: Inscription[];
  }[];
  brc20List: {
    currentPage: number;
    pageSize: number;
    total: number;
    list: TokenBalance[];
  }[];
  brc20Summary: {
    [ticker: string]: AddressTokenSummary;
  };
  brc20TransferableList: {
    [ticker: string]: {
      currentPage: number;
      pageSize: number;
      total: number;
      list: TokenTransfer[];
    }[];
  };
};

export const createEmptyUICachedDataEntry = (): UICachedDataEntry => ({
  allInscriptionList: [],
  brc20List: [],
  brc20Summary: {},
  brc20TransferableList: {},
});
