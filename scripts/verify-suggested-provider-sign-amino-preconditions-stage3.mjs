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
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const ensureRuntimeProviderSignAminoContext =[\s\S]*?getRuntimeProviderSignAminoResult/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);

console.log('suggested provider signAmino preconditions stage3 verification passed');
