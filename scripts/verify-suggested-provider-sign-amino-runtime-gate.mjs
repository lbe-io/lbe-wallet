import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const shared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const signing = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');
const tx = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');

assert.match(
  capability,
  /export const ensureRuntimeProviderSignAminoContext =[\s\S]*?getRuntimeProviderSignAminoResult/s,
);
assert.match(shared, /export const ensureProviderSignAminoChain = async/);
assert.match(shared, /ensureRuntimeProviderSignAminoContext/);

assert.match(signing, /export const signAmino = async/);
assert.match(signing, /await ensureProviderSignAminoChain/);
assert.match(signing, /wallet\.signCosmosProviderAmino/);

assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.doesNotMatch(tx, /ensureProviderSignAminoChain/);

console.log('suggested provider signAmino runtime gate verification passed');
