import type { ApprovalPayload, ApprovalRecoveryInput } from '@/entrypoints/background/service/types';
import { isRequestCorrelation } from './requestCorrelationService';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export const isApprovalPayloadLike = (value: unknown): value is ApprovalPayload => {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (value.lock === true) {
    return true;
  }
  return typeof value.approvalComponent === 'string' && isObjectRecord(value.params);
};

export const isApprovalRuntimeState = (value: unknown) => {
  if (!isObjectRecord(value)) {
    return false;
  }
  return (
    typeof value.notificationWindowId === 'number' &&
    typeof value.isLocked === 'boolean' &&
    typeof value.status === 'string' &&
    typeof value.requestedAt === 'number' &&
    typeof value.recoverable === 'boolean' &&
    typeof value.source === 'string'
  );
};

export const isApprovalRecoveryInput = (value: unknown): value is ApprovalRecoveryInput => {
  if (!isObjectRecord(value)) {
    return false;
  }
  return isApprovalPayloadLike(value.payload) && typeof value.requestedAt === 'number' && isApprovalRuntimeState(value.runtime) && (value.correlation === null || value.correlation === undefined || isRequestCorrelation(value.correlation));
};
