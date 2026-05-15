import type { RuntimeApprovalPayload } from '@/entrypoints/background/controller/provider/approvalRequest';
import type { RequestCorrelation } from '@/shared/messaging/requestCorrelationService';

export interface ConnectedSite {
  origin: string;
  icon: string;
  name: string;
  e?: number;
  isSigned: boolean;
  isTop: boolean;
  order?: number;
  isConnected: boolean;
  enabledChains?: string[];
  activeChainId?: string;
  accountId?: string;
  walletId?: string;
  accountIndex?: number | string;
  accountAddress?: string;
}

export type ApprovalPayload = RuntimeApprovalPayload;

export type ApprovalRequestSnapshot = {
  payload: ApprovalPayload;
  requestedAt: number;
  correlation?: RequestCorrelation | null;
};

export type ApprovalRuntimeStatus = 'idle' | 'pending' | 'resolved' | 'rejected' | 'stale';

export type ApprovalRuntimeState = {
  notificationWindowId: number;
  isLocked: boolean;
  status: ApprovalRuntimeStatus;
  requestedAt: number;
  recoverable: boolean;
  source: 'live' | 'restored' | 'empty';
};

export type ApprovalRecoveryInput = {
  payload: ApprovalPayload;
  requestedAt: number;
  correlation: RequestCorrelation | null;
  runtime: ApprovalRuntimeState;
};

export type ApprovalRequest = ApprovalRequestSnapshot & {
  resolve(params?: unknown): void;
  reject(err: unknown): void;
};
