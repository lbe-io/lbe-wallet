import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const runtimeDisplayUpgradeScripts = [
  'verify-provider-approval-preview.mjs',
  'verify-runtime-chain-display-context.mjs',
  'verify-runtime-chain-native-asset-display-context.mjs',
  'verify-runtime-chain-address-display-context.mjs',
  'verify-custom-chain-approval-preview-native-asset-upgrade.mjs',
  'verify-custom-chain-approval-preview-address-context-upgrade.mjs',
  'verify-suggested-chain-approval-display-hardening.mjs',
  'verify-suggested-chain-display-consolidation.mjs',
];

for (const scriptName of runtimeDisplayUpgradeScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('stage2 runtime display upgrades verification passed');
