import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const runtimeChainScripts = [
  'verify-runtime-chain-interpretation.mjs',
  'verify-custom-suggested-runtime-closure.mjs',
  'verify-runtime-chain-capability-contract.mjs',
  'verify-persisted-metadata-drift-hardening.mjs',
  'verify-persisted-metadata-fixture-hardening.mjs',
  'verify-custom-runtime-closure-stage3.mjs',
  'verify-suggested-runtime-closure-stage3.mjs',
  'verify-runtime-chain-query-entry.mjs',
  'verify-stage2-runtime-capability-upgrades.mjs',
  'verify-stage2-runtime-display-upgrades.mjs',
];

for (const scriptName of runtimeChainScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('stage2 runtime chain verification passed');
