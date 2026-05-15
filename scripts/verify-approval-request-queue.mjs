import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const notificationSource = await read('../src/entrypoints/background/service/notification.ts');
const requestCorrelationSource = await read('../src/shared/messaging/requestCorrelationService.ts');
const approvalOrchestratorSource = await read('../src/entrypoints/background/controller/provider/approvalOrchestrator.ts');
const providerTypesSource = await read('../src/entrypoints/background/controller/provider/types.ts');

assert.match(requestCorrelationSource, /export type RequestCorrelation =/, 'request correlation service should define request correlation type');
assert.match(requestCorrelationSource, /export const createRequestCorrelation =/, 'request correlation service should expose a request correlation builder');
assert.match(requestCorrelationSource, /export const isRequestCorrelation =/, 'request correlation service should expose a request correlation guard');

assert.match(providerTypesSource, /requestCorrelation\?: RequestCorrelation;/, 'provider request context should carry typed request correlation');

assert.match(approvalOrchestratorSource, /ctx\.request\.requestCorrelation \|\| null/, 'approval orchestrator should forward request correlation to approval requests');

assert.match(notificationSource, /approvalSnapshot = \{/, 'notification service should keep queued approval snapshot state');
assert.match(notificationSource, /correlation: correlation \|\| null,/, 'notification service should persist approval request correlation');
assert.match(notificationSource, /this\.approvalSnapshot = null;/, 'notification service should clear approval snapshot on settle');

console.log('approval request queue verification passed');
