import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const integrationScripts = [
  'verify-provider-approval-preview.mjs',
  'verify-runtime-unsupported-reason-normalization.mjs',
  'verify-runtime-unsupported-entry-parity.mjs',
  'verify-custom-runtime-closure-stage3.mjs',
  'verify-suggested-runtime-closure-stage3.mjs',
  'verify-provider-authority-matrix-hardening.mjs',
  'verify-authority-runtime-eligibility-hardening.mjs',
  'verify-provider-controller-handlers.mjs',
  'verify-provider-sendtx-preview-contract.mjs',
  'verify-send-flow-facade.mjs',
  'verify-send-submit-usecase.mjs',
  'verify-popup-send-refresh-contract.mjs',
  'verify-stage2-runtime-display-upgrades.mjs',
  'verify-runtime-chain-display-context.mjs',
  'verify-runtime-chain-query-entry.mjs',
  'verify-keyring-query-service-split.mjs',
  'verify-approval-request-contract.mjs',
  'verify-worker-lifecycle-reconnect-recovery.mjs',
  'verify-background-ready-gate.mjs',
  'verify-approval-request-queue.mjs',
  'verify-approval-worker-recovery-contract.mjs',
];

for (const scriptName of integrationScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('stage2 integration verification passed');
