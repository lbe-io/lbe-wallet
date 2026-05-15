import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const providerBridgeProtocolSource = await read('../src/shared/messaging/providerBridgeProtocol.ts');
const requestCorrelationSource = await read('../src/shared/messaging/requestCorrelationService.ts');
const notificationSource = await read('../src/entrypoints/background/service/notification.ts');
const approvalIndexSource = await read('../src/popup/app/approval/index.tsx');
const walletContextSource = await read('../src/app/contexts/walletContext.tsx');
const walletControllerSource = await read('../src/entrypoints/background/controller/wallet.ts');

assert.match(providerBridgeProtocolSource, /isApprovalRecoveryInput/, 'provider bridge protocol should define approval recovery input guard');
assert.match(providerBridgeProtocolSource, /isApprovalPayloadLike/, 'provider bridge protocol should define payload guard');
assert.match(providerBridgeProtocolSource, /isApprovalRuntimeState/, 'provider bridge protocol should define runtime state guard');
assert.match(requestCorrelationSource, /buildRequestCorrelationId/, 'request correlation service should expose correlation id builder');

assert.match(notificationSource, /APPROVAL_RUNTIME_STORAGE_KEY/, 'notification service should persist approval runtime state explicitly');
assert.match(notificationSource, /persistRuntime = async \(\) =>/, 'notification service should persist runtime snapshots explicitly');
assert.match(notificationSource, /getApprovalRecovery = \(\): ApprovalRecoveryInput \| null =>/, 'notification service should expose approval recovery input');

assert.match(walletContextSource, /getApprovalRecovery\(\): Promise<ApprovalRecoveryInput \| null>;/, 'wallet context should expose approval recovery getter');
assert.match(walletControllerSource, /getApprovalRecovery = notificationService\.getApprovalRecovery;/, 'wallet controller should proxy approval recovery getter');

assert.match(approvalIndexSource, /const approvalRecovery = await wallet\.getApprovalRecovery\(\);/, 'approval root should read approval recovery from wallet controller');
assert.match(approvalIndexSource, /const approvalPayload = isApprovalRecoveryInput\(approvalRecovery\) \? approvalRecovery\.payload : await getApproval\(\);/, 'approval root should prefer recovery payload and keep old fallback');

console.log('approval worker recovery contract verification passed');
