import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const shared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const signing = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');
const accountRead = await read('../src/entrypoints/background/controller/provider/accountReadHandlers.ts');
const tx = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');

assert.match(shared, /ensureRuntimeProviderSignDirectContext/);
assert.match(shared, /export const ensureProviderSignDirectChain = async/);

assert.match(signing, /ensureProviderSignDirectChain/);
assert.match(signing, /wallet\.signCosmosProviderDirect/);

assert.match(signing, /signAmino[\s\S]*?ensureSupportedChain/s);
assert.match(signing, /signArbitrary[\s\S]*?ensureSupportedChain/s);
assert.doesNotMatch(accountRead, /ensureProviderSignDirectChain/);
assert.doesNotMatch(tx, /ensureProviderSignDirectChain/);

console.log('provider signDirect runtime gate verification passed');
