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
  'verify-suggested-runtime-readable-gates.mjs',
  'verify-suggested-chain-provider-sign-direct-upgrade.mjs',
  'verify-suggested-provider-sign-direct-preconditions-stage3.mjs',
  'verify-suggested-provider-sign-direct-runtime-gate.mjs',
  'verify-suggested-chain-provider-sign-amino-upgrade.mjs',
  'verify-suggested-provider-sign-amino-preconditions-stage3.mjs',
  'verify-suggested-provider-sign-amino-runtime-gate.mjs',
  'verify-suggested-chain-provider-sign-arbitrary-upgrade.mjs',
  'verify-suggested-provider-sign-arbitrary-preconditions-stage3.mjs',
  'verify-suggested-provider-sign-arbitrary-runtime-gate.mjs',
  'verify-suggested-chain-provider-sendtx-upgrade.mjs',
  'verify-suggested-provider-sendtx-preconditions-stage3.mjs',
  'verify-suggested-provider-sendtx-runtime-gate-stage3.mjs',
  'verify-suggested-chain-send-flow-context-upgrade.mjs',
  'verify-suggested-chain-native-send-execution-upgrade.mjs',
  'verify-suggested-runtime-executable-send-flow-gate.mjs',
  'verify-suggested-native-send-execution-gate.mjs',
];

for (const scriptName of closureScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('suggested runtime closure stage3 verification passed');
