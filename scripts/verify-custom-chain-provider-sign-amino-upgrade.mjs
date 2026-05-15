import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');
const signingHandlers = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');

assert.match(signerResolver, /ensureRuntimeProviderSignAminoContext/);
assert.match(signerResolver, /resolveProviderSignAminoSignerChainContext/);
assert.match(signerResolver, /getAminoWalletForProviderSignAminoChain/);

assert.match(keyringIndex, /getAminoWalletForProviderSignAminoChain as resolveAminoWalletForProviderSignAminoChain/);
assert.match(keyringIndex, /private getProviderSignAminoWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderAmino = async/);
assert.match(keyringIndex, /this\.getProviderSignAminoWalletForChain/);

assert.match(walletController, /signCosmosProviderAmino =/);
assert.match(signingHandlers, /wallet\.signCosmosProviderAmino/);

console.log('custom chain provider signAmino upgrade verification passed');
