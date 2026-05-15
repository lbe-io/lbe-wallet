import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const serviceTypesSource = await fs.readFile(
  new URL('../src/entrypoints/background/service/types.ts', import.meta.url),
  'utf8',
);
const notificationSource = await fs.readFile(
  new URL('../src/entrypoints/background/service/notification.ts', import.meta.url),
  'utf8',
);
const walletHooksSource = await fs.readFile(
  new URL('../src/app/hooks/walletHooks.ts', import.meta.url),
  'utf8',
);
const approvalIndexSource = await fs.readFile(
  new URL('../src/popup/app/approval/index.tsx', import.meta.url),
  'utf8',
);

assert.ok(serviceTypesSource.includes('export type ApprovalRequestSnapshot = {'), 'service types should define approval request snapshot');
assert.ok(serviceTypesSource.includes('payload: ApprovalPayload;'), 'approval request snapshot should carry explicit payload');
assert.ok(serviceTypesSource.includes('requestedAt: number;'), 'approval request snapshot should carry requestedAt');
assert.ok(serviceTypesSource.includes('export type ApprovalRecoveryInput = {'), 'service types should define approval recovery input');
assert.ok(serviceTypesSource.includes('export type ApprovalRuntimeState = {'), 'service types should define approval runtime state');

assert.ok(notificationSource.includes('approval: ApprovalRequest | null = null;'), 'notification service should keep typed approval request state');
assert.ok(notificationSource.includes('getApproval = (): ApprovalPayload | null => this.approval?.payload || this.approvalSnapshot?.payload || null;'), 'notification getApproval should read explicit payload field');
assert.ok(notificationSource.includes('getApprovalRecovery = (): ApprovalRecoveryInput | null =>'), 'notification service should expose typed approval recovery input');
assert.ok(notificationSource.includes('payload: data,'), 'notification requestApproval should store approval payload explicitly');
assert.ok(notificationSource.includes('const requestedAt = Date.now();'), 'notification requestApproval should timestamp approval state');

assert.ok(walletHooksSource.includes('const getApproval: () => Promise<ApprovalPayload | null> = wallet.getApproval;'), 'useApproval should preserve typed approval getter');

assert.ok(approvalIndexSource.includes('const approvalRecovery = await wallet.getApprovalRecovery();'), 'approval root should read recovery input first');
assert.ok(approvalIndexSource.includes('const approvalPayload = isApprovalRecoveryInput(approvalRecovery) ? approvalRecovery.payload : await getApproval();'), 'approval root should fallback to the typed approval payload getter');
assert.ok(approvalIndexSource.includes('if (!isApprovalRoutePayload(approvalPayload)) {'), 'approval root should guard non-route approvals explicitly');
assert.ok(approvalIndexSource.includes('const nextApproval: ApprovalTask = toApprovalTask(approvalPayload);'), 'approval root should convert guarded payload to typed approval task');

console.log('approval request contract verification passed');
