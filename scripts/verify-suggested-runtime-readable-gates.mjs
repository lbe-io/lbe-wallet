import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const readableGateScripts = [
  'verify-suggested-chain-query-context-upgrade.mjs',
  'verify-suggested-chain-provider-account-read-upgrade.mjs',
  'verify-runtime-chain-query-entry.mjs',
  'verify-provider-account-read-runtime-gate.mjs',
  'verify-keyring-query-service-split.mjs',
];

for (const scriptName of readableGateScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('suggested runtime readable gates verification passed');
