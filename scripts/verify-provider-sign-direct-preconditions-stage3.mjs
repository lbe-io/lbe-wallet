import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(
  capability,
  /export type RuntimeProviderSignDirectPreconditions =\s*RuntimeProviderAccountReadPreconditions/,
);
assert.match(
  capability,
  /export const buildRuntimeProviderSignDirectPreconditions =\s*buildRuntimeProviderAccountReadPreconditions/,
);
assert.match(
  capability,
  /export const resolveRuntimeProviderSignDirectUnsupportedReason =\s*resolveRuntimeProviderAccountReadUnsupportedReason/,
);
assert.match(
  capability,
  /export const ensureRuntimeProviderSignDirectContext =[\s\S]*?getRuntimeProviderSignDirectResult/s,
);
assert.doesNotMatch(
  capability,
  /export const ensureRuntimeProviderSignDirectContext =[\s\S]*?ensureRuntimeProviderAccountReadContext/s,
);

console.log('provider signDirect preconditions stage3 verification passed');
