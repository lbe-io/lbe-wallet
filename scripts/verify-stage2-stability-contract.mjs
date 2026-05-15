import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const packageJsonPath = path.join(repoRoot, 'package.json');
const runtimeSupportDocPath = path.join(repoRoot, 'docs', 'runtime-chain-support-matrix.md');
const runtimeChainBundlePath = path.join(scriptDir, 'verify-stage2-runtime-chain.mjs');
const integrationBundlePath = path.join(scriptDir, 'verify-stage2-integration.mjs');
const runtimeCapabilityBundlePath = path.join(scriptDir, 'verify-stage2-runtime-capability-upgrades.mjs');
const runtimeDisplayBundlePath = path.join(scriptDir, 'verify-stage2-runtime-display-upgrades.mjs');
const customRuntimeClosureBundlePath = path.join(scriptDir, 'verify-custom-runtime-closure-stage3.mjs');
const suggestedRuntimeClosureBundlePath = path.join(scriptDir, 'verify-suggested-runtime-closure-stage3.mjs');
const suggestedDisplayConsolidationPath = path.join(scriptDir, 'verify-suggested-chain-display-consolidation.mjs');
const manualEntry = path.join(repoRoot, 'tests', 'manual', 'provider-regression.html');

await fs.access(packageJsonPath);
await fs.access(runtimeSupportDocPath);
await fs.access(runtimeChainBundlePath);
await fs.access(integrationBundlePath);
await fs.access(runtimeCapabilityBundlePath);
await fs.access(runtimeDisplayBundlePath);
await fs.access(customRuntimeClosureBundlePath);
await fs.access(suggestedRuntimeClosureBundlePath);
await fs.access(suggestedDisplayConsolidationPath);
await fs.access(manualEntry);

const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
const runtimeSupportDoc = await fs.readFile(runtimeSupportDocPath, 'utf8');
const runtimeChainBundleSource = await fs.readFile(runtimeChainBundlePath, 'utf8');
const integrationBundleSource = await fs.readFile(integrationBundlePath, 'utf8');
const runtimeCapabilityBundleSource = await fs.readFile(runtimeCapabilityBundlePath, 'utf8');
const runtimeDisplayBundleSource = await fs.readFile(runtimeDisplayBundlePath, 'utf8');
const customRuntimeClosureBundleSource = await fs.readFile(customRuntimeClosureBundlePath, 'utf8');
const suggestedRuntimeClosureBundleSource = await fs.readFile(suggestedRuntimeClosureBundlePath, 'utf8');
const manualPage = await fs.readFile(manualEntry, 'utf8');

assert.equal(packageJson.scripts['verify:stage2:compile'], 'tsc --noEmit');
assert.equal(packageJson.scripts['verify:stage2:smoke'], 'node scripts/verify-stage2-smoke.mjs');
assert.equal(packageJson.scripts['verify:stage2:integration'], 'node scripts/verify-stage2-integration.mjs');
assert.equal(packageJson.scripts['verify:stage2:stability'], 'node scripts/verify-stage2-stability-contract.mjs');
assert.equal(
  packageJson.scripts['verify:stage2'],
  'yarn verify:stage2:compile && yarn verify:stage2:smoke && yarn verify:stage2:integration && yarn verify:stage2:stability',
);

assert.match(manualPage, /data-action="enablePrimary"/);
assert.match(manualPage, /data-action="getKey"/);
assert.match(manualPage, /data-action="signAmino"/);
assert.match(manualPage, /data-action="signDirect"/);
assert.match(manualPage, /data-action="signArbitrary"/);
assert.match(manualPage, /data-action="sendTxInvalid"/);
assert.match(manualPage, /data-action="getChainInfos"/);
assert.match(manualPage, /data-action="getProviderState"/);

assert.match(runtimeSupportDoc, /# Runtime Chain Support Matrix/);
assert.match(runtimeSupportDoc, /## Status Baseline/);
assert.match(runtimeSupportDoc, /## Capability Matrix/);
assert.match(runtimeSupportDoc, /## Popup Native Send Baseline/);
assert.match(runtimeSupportDoc, /## Provider Runtime Baseline/);
assert.match(runtimeSupportDoc, /## Display Context Baseline/);
assert.match(runtimeSupportDoc, /## Guardrail Expectations/);
assert.match(runtimeSupportDoc, /## Required Automated Checks/);
assert.match(runtimeSupportDoc, /custom runtime closure/i);
assert.match(runtimeSupportDoc, /suggested runtime closure/i);
assert.match(runtimeSupportDoc, /provider\s+`?signDirect`?/i);
assert.match(runtimeSupportDoc, /provider\s+`?signArbitrary`?/i);
assert.match(runtimeSupportDoc, /provider\s+`?sendTx`?/i);
assert.match(runtimeSupportDoc, /shared suggested copy source/i);
assert.match(runtimeSupportDoc, /shared prop shape/i);
assert.match(runtimeSupportDoc, /shared display type contract/i);
assert.match(runtimeSupportDoc, /verify-custom-runtime-closure-stage3\.mjs/i);
assert.match(runtimeSupportDoc, /verify-suggested-runtime-closure-stage3\.mjs/i);
assert.match(runtimeSupportDoc, /verify-suggested-chain-display-consolidation\.mjs/i);

assert.match(runtimeCapabilityBundleSource, /verify-custom-chain-address-derivation-upgrade\.mjs/);
assert.match(runtimeCapabilityBundleSource, /verify-runtime-chain-address-capability-gate\.mjs/);
assert.match(runtimeCapabilityBundleSource, /verify-custom-chain-hydration-capability-upgrade\.mjs/);
assert.match(runtimeCapabilityBundleSource, /verify-runtime-chain-hydration-gate\.mjs/);
assert.match(runtimeCapabilityBundleSource, /verify-custom-chain-native-asset-capability-upgrade\.mjs/);
assert.match(runtimeCapabilityBundleSource, /verify-runtime-chain-native-asset-gate\.mjs/);
assert.doesNotMatch(runtimeCapabilityBundleSource, /verify-add-token-address-display-context\.mjs/);
assert.doesNotMatch(runtimeCapabilityBundleSource, /verify-custom-chain-add-token-address-context-upgrade\.mjs/);

assert.match(runtimeDisplayBundleSource, /verify-provider-approval-preview\.mjs/);
assert.match(runtimeDisplayBundleSource, /verify-suggested-chain-approval-display-hardening\.mjs/);
assert.match(runtimeDisplayBundleSource, /verify-suggested-chain-display-consolidation\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-add-token-address-display-context\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-custom-chain-add-token-address-context-upgrade\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-add-token-display-context\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-add-token-native-asset-display-parity\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-display-finalization\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-display-copy-cleanup\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-approval-preview-copy-parity\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-preview-prop-shape-cleanup\.mjs/);
assert.doesNotMatch(runtimeDisplayBundleSource, /verify-suggested-chain-display-type-contract-cleanup\.mjs/);

assert.match(runtimeChainBundleSource, /verify-runtime-chain-interpretation\.mjs/);
assert.match(runtimeChainBundleSource, /verify-custom-suggested-runtime-closure\.mjs/);
assert.match(runtimeChainBundleSource, /verify-runtime-chain-capability-contract\.mjs/);
assert.match(runtimeChainBundleSource, /verify-custom-runtime-closure-stage3\.mjs/);
assert.match(runtimeChainBundleSource, /verify-suggested-runtime-closure-stage3\.mjs/);
assert.match(runtimeChainBundleSource, /verify-runtime-chain-query-entry\.mjs/);
assert.match(runtimeChainBundleSource, /verify-stage2-runtime-capability-upgrades\.mjs/);
assert.match(runtimeChainBundleSource, /verify-stage2-runtime-display-upgrades\.mjs/);
assert.doesNotMatch(runtimeChainBundleSource, /verify-suggested-chain-display-finalization\.mjs/);
assert.doesNotMatch(runtimeChainBundleSource, /verify-suggested-chain-display-copy-cleanup\.mjs/);
assert.doesNotMatch(runtimeChainBundleSource, /verify-suggested-chain-approval-preview-copy-parity\.mjs/);
assert.doesNotMatch(runtimeChainBundleSource, /verify-suggested-chain-preview-prop-shape-cleanup\.mjs/);
assert.doesNotMatch(runtimeChainBundleSource, /verify-suggested-chain-display-type-contract-cleanup\.mjs/);

assert.match(customRuntimeClosureBundleSource, /verify-runtime-support-contract-stage3\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-runtime-support-preconditions\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-runtime-support-reason-taxonomy\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-query-context-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-native-send-execution-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-provider-account-read-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-provider-sign-direct-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-provider-sign-amino-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-provider-sign-arbitrary-upgrade\.mjs/);
assert.match(customRuntimeClosureBundleSource, /verify-custom-chain-provider-sendtx-upgrade\.mjs/);

assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-runtime-readable-gates\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-provider-sign-direct-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-provider-sign-amino-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-provider-sign-arbitrary-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-provider-sendtx-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-send-flow-context-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-chain-native-send-execution-upgrade\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-runtime-executable-send-flow-gate\.mjs/);
assert.match(suggestedRuntimeClosureBundleSource, /verify-suggested-native-send-execution-gate\.mjs/);

assert.match(integrationBundleSource, /verify-suggested-runtime-closure-stage3\.mjs/);

console.log('stage2 stability contract verification passed (current approval scope: Connect/CosmosSign/CosmosSendTx)');
