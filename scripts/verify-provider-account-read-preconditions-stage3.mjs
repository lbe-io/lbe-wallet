import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(
  capability,
  /export type RuntimeProviderAccountReadPreconditions = \{\s*stableChainId: boolean;\s*stableBech32Prefix: boolean;\s*stableCoinType: boolean;\s*\};/s,
);
assert.match(capability, /export const buildRuntimeProviderAccountReadPreconditions =/);
assert.match(
  capability,
  /const hasSatisfiedRuntimeProviderAccountReadPreconditions =[\s\S]*?preconditions\.stableChainId[\s\S]*?preconditions\.stableBech32Prefix[\s\S]*?preconditions\.stableCoinType/s,
);
assert.match(capability, /export const resolveRuntimeProviderAccountReadUnsupportedReason =/);
assert.match(capability, /export const ensureRuntimeProviderAccountReadContext =/);

console.log('provider account-read preconditions stage3 verification passed');
