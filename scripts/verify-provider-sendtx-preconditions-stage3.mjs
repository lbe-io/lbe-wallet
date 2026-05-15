import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(
  capability,
  /export type RuntimeProviderSendTxPreconditions =\s*\{/,
);
assert.match(capability, /stableChainId:\s*boolean/);
assert.match(capability, /validRpc:\s*boolean/);
assert.match(
  capability,
  /export const buildRuntimeProviderSendTxPreconditions =[\s\S]*?buildRuntimeExecutablePreconditions/,
);
assert.match(
  capability,
  /const hasSatisfiedRuntimeProviderSendTxPreconditions =[\s\S]*?preconditions\.stableChainId[\s\S]*?preconditions\.validRpc/,
);
assert.match(
  capability,
  /export const resolveRuntimeProviderSendTxUnsupportedReason =[\s\S]*?missing_runtime_transport/,
);
assert.match(
  capability,
  /export const ensureRuntimeProviderSendTxContext =[\s\S]*?getRuntimeProviderSendTxResult/,
);

console.log('provider sendTx preconditions stage3 verification passed');
