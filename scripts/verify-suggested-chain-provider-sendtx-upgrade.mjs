import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const controllerShared = await read(
  '../src/entrypoints/background/controller/provider/controllerShared.ts',
);
const txHandlers = await read(
  '../src/entrypoints/background/controller/provider/txHandlers.ts',
);
const txBroadcastService = await read(
  '../src/entrypoints/background/service/keyring/txBroadcastService.ts',
);
const keyringIndex = await read(
  '../src/entrypoints/background/service/keyring/index.ts',
);
const walletController = await read(
  '../src/entrypoints/background/controller/wallet.ts',
);

assert.match(
  capability,
  /export const getRuntimeProviderSendTxResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderSendTxPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);

assert.match(controllerShared, /export const ensureProviderSendTxChain = async/);
assert.match(controllerShared, /ensureRuntimeProviderSendTxContext/);

assert.match(txHandlers, /export const sendTx = async/);
assert.match(txHandlers, /await ensureProviderSendTxChain/);
assert.match(txHandlers, /wallet\.sendCosmosProviderTx/);

assert.match(txBroadcastService, /getRpcEndpointForChain\?:/);
assert.match(keyringIndex, /getProviderBroadcastRpcEndpointOrThrow = async/);
assert.match(keyringIndex, /ensureRuntimeProviderSendTxContext/);
assert.match(keyringIndex, /sendCosmosProviderTx = async/);
assert.match(walletController, /sendCosmosProviderTx =/);

console.log('suggested chain provider sendTx upgrade verification passed');
