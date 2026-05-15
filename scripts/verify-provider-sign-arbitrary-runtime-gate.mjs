import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const shared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const signing = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');
const tx = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');

assert.match(shared, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(shared, /export const ensureProviderSignArbitraryChain = async/);

assert.match(signing, /signArbitrary[\s\S]*?ensureProviderSignArbitraryChain/s);
assert.match(signing, /wallet\.signCosmosProviderArbitrary/);

assert.match(signing, /signAmino[\s\S]*?ensureProviderSignAminoChain/s);
assert.match(signing, /signDirect[\s\S]*?ensureProviderSignDirectChain/s);
assert.doesNotMatch(tx, /ensureProviderSignArbitraryChain/);

console.log('provider signArbitrary runtime gate verification passed');
