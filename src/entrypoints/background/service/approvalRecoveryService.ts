import type { ApprovalRecoveryInput, ApprovalRequestSnapshot, ApprovalRuntimeState } from './types';

export const createEmptyApprovalRuntimeState = (): ApprovalRuntimeState => ({
  notificationWindowId: 0,
  isLocked: false,
  status: 'idle',
  requestedAt: 0,
  recoverable: false,
  source: 'empty',
});

export const toRecoveredApprovalRuntimeState = (snapshot: ApprovalRequestSnapshot, runtime?: Partial<ApprovalRuntimeState> | null): ApprovalRuntimeState => ({
  ...createEmptyApprovalRuntimeState(),
  ...runtime,
  status: runtime?.status === 'pending' ? 'stale' : runtime?.status || 'stale',
  requestedAt: snapshot.requestedAt,
  recoverable: false,
  source: 'restored',
});

export const toApprovalRecoveryInput = (snapshot: ApprovalRequestSnapshot | null, runtime: ApprovalRuntimeState): ApprovalRecoveryInput | null => {
  if (!snapshot) {
    return null;
  }
  return {
    payload: snapshot.payload,
    requestedAt: snapshot.requestedAt,
    correlation: snapshot.correlation || null,
    runtime,
  };
};
