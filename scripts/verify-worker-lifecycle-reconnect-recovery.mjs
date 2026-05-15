import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const notificationSource = await read('../src/entrypoints/background/service/notification.ts');
const recoveryServiceSource = await read('../src/entrypoints/background/service/approvalRecoveryService.ts');
const approvalIndexSource = await read('../src/popup/app/approval/index.tsx');
const boostSource = await read('../src/popup/app/boost/index.tsx');

assert.match(notificationSource, /restoreRuntime = async \(\)/, 'notification service should expose runtime restoration');
assert.match(notificationSource, /approvalSnapshot: ApprovalRequestSnapshot \| null = null;/, 'notification service should keep an approval snapshot');
assert.match(notificationSource, /runtimeState: ApprovalRuntimeState = createEmptyApprovalRuntimeState\(\);/, 'notification service should keep typed runtime state');
assert.match(notificationSource, /toRecoveredApprovalRuntimeState/, 'notification service should recover persisted approval runtime explicitly');
assert.match(notificationSource, /getApprovalRecovery = \(\): ApprovalRecoveryInput \| null =>/, 'notification service should expose recovery input');

assert.match(recoveryServiceSource, /createEmptyApprovalRuntimeState/, 'approval recovery service should define empty runtime state');
assert.match(recoveryServiceSource, /toRecoveredApprovalRuntimeState/, 'approval recovery service should define restored runtime mapping');
assert.match(recoveryServiceSource, /toApprovalRecoveryInput/, 'approval recovery service should define popup recovery input projection');

assert.match(approvalIndexSource, /wallet\.getApprovalRecovery\(\)/, 'approval root should read approval recovery input');
assert.match(approvalIndexSource, /isApprovalRecoveryInput\(approvalRecovery\)/, 'approval root should guard recovery input before dispatch');

assert.match(boostSource, /let approval = await getApproval\(\);/, 'boost entry should preserve approval existence check compatibility');

console.log('worker lifecycle reconnect recovery verification passed');
