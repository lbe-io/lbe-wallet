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
  /export const ensureRuntimeProviderSignArbitraryContext =[\s\S]*?getRuntimeProviderSignArbitraryResult/s,
);
assert.match(shared, /export const ensureProviderSignArbitraryChain = async/);
assert.match(shared, /ensureRuntimeProviderSignArbitraryContext/);

assert.match(signing, /export const signArbitrary = async/);
assert.match(signing, /await ensureProviderSignArbitraryChain/);
assert.match(signing, /wallet\.signCosmosProviderArbitrary/);

assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.doesNotMatch(tx, /ensureProviderSignArbitraryChain/);

console.log('suggested provider signArbitrary runtime gate verification passed');
