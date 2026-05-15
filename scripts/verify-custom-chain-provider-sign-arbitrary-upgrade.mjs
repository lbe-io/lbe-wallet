import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');
const signingHandlers = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');

assert.match(signerResolver, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(signerResolver, /resolveProviderSignArbitrarySignerChainContext/);
assert.match(signerResolver, /getAminoWalletForProviderSignArbitraryChain/);

assert.match(keyringIndex, /getAminoWalletForProviderSignArbitraryChain as resolveAminoWalletForProviderSignArbitraryChain/);
assert.match(keyringIndex, /private getProviderSignArbitraryWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderArbitrary = async/);
assert.match(keyringIndex, /this\.getProviderSignArbitraryWalletForChain/);

assert.match(walletController, /signCosmosProviderArbitrary =/);
assert.match(signingHandlers, /wallet\.signCosmosProviderArbitrary/);

console.log('custom chain provider signArbitrary upgrade verification passed');
