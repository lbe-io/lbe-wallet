import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const closureScripts = [
  'verify-runtime-support-contract-stage3.mjs',
  'verify-runtime-support-preconditions.mjs',
  'verify-runtime-support-reason-taxonomy.mjs',
  'verify-runtime-no-builtin-fallback-hardening.mjs',
  'verify-runtime-explicit-unsupported-hardening.mjs',
  'verify-runtime-unsupported-reason-normalization.mjs',
  'verify-runtime-unsupported-entry-parity.mjs',
  'verify-persisted-metadata-drift-hardening.mjs',
  'verify-persisted-metadata-fixture-hardening.mjs',
  'verify-authority-runtime-eligibility-hardening.mjs',
  'verify-custom-suggested-capability-matrix.mjs',
  'verify-runtime-chain-support-gates.mjs',
  'verify-custom-chain-query-context-upgrade.mjs',
  'verify-query-context-preconditions-stage3.mjs',
  'verify-runtime-executable-query-gate.mjs',
  'verify-custom-chain-send-flow-context-upgrade.mjs',
  'verify-send-flow-preconditions-stage3.mjs',
  'verify-runtime-executable-send-flow-gate.mjs',
  'verify-custom-chain-native-send-execution-upgrade.mjs',
  'verify-native-send-execution-preconditions-stage3.mjs',
  'verify-runtime-executable-native-send-gate.mjs',
  'verify-custom-chain-provider-account-read-upgrade.mjs',
  'verify-provider-account-read-preconditions-stage3.mjs',
  'verify-provider-account-read-runtime-gate.mjs',
  'verify-custom-chain-provider-sign-direct-upgrade.mjs',
  'verify-provider-sign-direct-preconditions-stage3.mjs',
  'verify-provider-sign-direct-runtime-gate.mjs',
  'verify-custom-chain-provider-sign-amino-upgrade.mjs',
  'verify-provider-sign-amino-preconditions-stage3.mjs',
  'verify-provider-sign-amino-runtime-gate.mjs',
  'verify-custom-chain-provider-sign-arbitrary-upgrade.mjs',
  'verify-provider-sign-arbitrary-preconditions-stage3.mjs',
  'verify-provider-sign-arbitrary-runtime-gate.mjs',
  'verify-custom-chain-provider-sendtx-upgrade.mjs',
  'verify-provider-sendtx-preconditions-stage3.mjs',
  'verify-provider-sendtx-runtime-gate-stage3.mjs',
];

for (const scriptName of closureScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('custom runtime closure stage3 verification passed');
