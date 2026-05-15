import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const shared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const accountRead = await read('../src/entrypoints/background/controller/provider/accountReadHandlers.ts');
const signing = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');
const tx = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');

assert.match(shared, /getRuntimeChainInterpretationByChainId/);
assert.match(shared, /ensureRuntimeProviderAccountReadContext/);
assert.match(shared, /export const ensureProviderAccountReadableChain = async/);

assert.match(accountRead, /ensureProviderAccountReadableChain/);
assert.doesNotMatch(accountRead, /ensureSupportedChain/);

assert.match(signing, /ensureSupportedChain/);
assert.doesNotMatch(signing, /ensureProviderAccountReadableChain/);

assert.doesNotMatch(tx, /ensureProviderAccountReadableChain/);

console.log('provider account-read runtime gate verification passed');
