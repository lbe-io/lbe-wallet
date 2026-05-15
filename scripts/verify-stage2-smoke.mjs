import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const smokeScripts = [
  'verify-builtin-native-token-bootstrap.mjs',
  'verify-authority-write-alignment.mjs',
  'verify-chain-source-separation.mjs',
  'verify-runtime-chain-interpretation.mjs',
  'verify-custom-suggested-runtime-closure.mjs',
  'verify-runtime-chain-capability-contract.mjs',
  'verify-custom-runtime-closure-stage3.mjs',
  'verify-stage2-runtime-capability-upgrades.mjs',
  'verify-tx-preview-fee-contract.mjs',
];

for (const scriptName of smokeScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('stage2 smoke verification passed');
