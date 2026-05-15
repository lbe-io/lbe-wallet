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
  /export const ensureRuntimeProviderSignDirectContext =[\s\S]*?getRuntimeProviderSignDirectResult/s,
);
assert.match(shared, /export const ensureProviderSignDirectChain = async/);
assert.match(shared, /ensureRuntimeProviderSignDirectContext/);

assert.match(signing, /export const signDirect = async/);
assert.match(signing, /await ensureProviderSignDirectChain/);
assert.match(signing, /wallet\.signCosmosProviderDirect/);

assert.match(
  capability,
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.doesNotMatch(tx, /ensureProviderSignDirectChain/);

console.log('suggested provider signDirect runtime gate verification passed');
