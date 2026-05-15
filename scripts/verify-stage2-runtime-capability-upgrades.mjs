import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const runtimeCapabilityUpgradeScripts = [
  'verify-custom-chain-address-derivation-upgrade.mjs',
  'verify-runtime-chain-address-capability-gate.mjs',
  'verify-custom-chain-hydration-capability-upgrade.mjs',
  'verify-runtime-chain-hydration-gate.mjs',
  'verify-custom-chain-native-asset-capability-upgrade.mjs',
  'verify-runtime-chain-native-asset-gate.mjs',
  'verify-runtime-chain-native-asset-display-context.mjs',
  'verify-runtime-chain-address-display-context.mjs',
  'verify-custom-chain-approval-preview-native-asset-upgrade.mjs',
  'verify-custom-chain-approval-preview-address-context-upgrade.mjs',
];

for (const scriptName of runtimeCapabilityUpgradeScripts) {
  await import(pathToFileURL(path.join(scriptDir, scriptName)).href);
}

console.log('stage2 runtime capability upgrades verification passed');
