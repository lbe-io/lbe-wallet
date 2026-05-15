import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const shared = await read(
  '../src/entrypoints/background/controller/provider/controllerShared.ts',
);
const txHandlers = await read(
  '../src/entrypoints/background/controller/provider/txHandlers.ts',
);
const signing = await read(
  '../src/entrypoints/background/controller/provider/signingHandlers.ts',
);
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(
  capability,
  /export const ensureRuntimeProviderSendTxContext =[\s\S]*?getRuntimeProviderSendTxResult/s,
);
assert.match(shared, /ensureRuntimeProviderSendTxContext/);
assert.match(shared, /export const ensureProviderSendTxChain = async/);

assert.match(txHandlers, /ensureProviderSendTxChain/);
assert.match(txHandlers, /wallet\.sendCosmosProviderTx/);

assert.doesNotMatch(signing, /ensureProviderSendTxChain/);

console.log('suggested provider sendTx runtime gate stage3 verification passed');
