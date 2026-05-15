import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(
  capability,
  /export type RuntimeProviderSignAminoPreconditions =\s*RuntimeProviderAccountReadPreconditions/,
);
assert.match(
  capability,
  /export const buildRuntimeProviderSignAminoPreconditions =\s*buildRuntimeProviderAccountReadPreconditions/,
);
assert.match(
  capability,
  /export const resolveRuntimeProviderSignAminoUnsupportedReason =\s*resolveRuntimeProviderAccountReadUnsupportedReason/,
);
assert.match(
  capability,
  /export const ensureRuntimeProviderSignAminoContext =[\s\S]*?getRuntimeProviderSignAminoResult/s,
);
assert.doesNotMatch(
  capability,
  /export const ensureRuntimeProviderSignAminoContext =[\s\S]*?ensureRuntimeProviderAccountReadContext/s,
);

console.log('provider signAmino preconditions stage3 verification passed');
