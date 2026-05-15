import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const txBroadcastService = await read('../src/entrypoints/background/service/keyring/txBroadcastService.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');
const txHandlers = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');

assert.match(txBroadcastService, /getRpcEndpointForChain\?:/);
assert.match(txBroadcastService, /const rpcEndpoint = deps\.getRpcEndpointForChain/);
assert.match(txBroadcastService, /Tendermint34Client\.connect\(rpcEndpoint\)/);

assert.match(keyringIndex, /ensureRuntimeProviderSendTxContext/);
assert.match(keyringIndex, /private getProviderBroadcastRpcEndpointOrThrow = async/);
assert.match(keyringIndex, /sendCosmosProviderTx = async/);
assert.match(keyringIndex, /this\.getProviderBroadcastRpcEndpointOrThrow/);

assert.match(walletController, /sendCosmosProviderTx =/);
assert.match(txHandlers, /wallet\.sendCosmosProviderTx/);

console.log('custom chain provider sendTx upgrade verification passed');
