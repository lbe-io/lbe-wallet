import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');
const signingHandlers = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');

assert.match(signerResolver, /ensureRuntimeProviderSignDirectContext/);
assert.match(signerResolver, /resolveProviderSignDirectSignerChainContext/);
assert.match(signerResolver, /getDirectWalletForProviderSignDirectChain/);

assert.match(keyringIndex, /getDirectWalletForProviderSignDirectChain as resolveDirectWalletForProviderSignDirectChain/);
assert.match(keyringIndex, /private getProviderSignDirectWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderDirect = async/);
assert.match(keyringIndex, /this\.getProviderSignDirectWalletForChain/);

assert.match(walletController, /signCosmosProviderDirect =/);
assert.match(signingHandlers, /wallet\.signCosmosProviderDirect/);

console.log('custom chain provider signDirect upgrade verification passed');
