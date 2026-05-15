import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const controllerShared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const signingHandlers = await read('../src/entrypoints/background/controller/provider/signingHandlers.ts');
const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');

assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);

assert.match(controllerShared, /export const ensureProviderSignArbitraryChain = async/);
assert.match(controllerShared, /ensureRuntimeProviderSignArbitraryContext/);

assert.match(signingHandlers, /export const signArbitrary = async/);
assert.match(signingHandlers, /await ensureProviderSignArbitraryChain/);
assert.match(signingHandlers, /wallet\.signCosmosProviderArbitrary/);

assert.match(signerResolver, /resolveProviderSignArbitrarySignerChainContext/);
assert.match(signerResolver, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(signerResolver, /getAminoWalletForProviderSignArbitraryChain/);

assert.match(keyringIndex, /getAminoWalletForProviderSignArbitraryChain as resolveAminoWalletForProviderSignArbitraryChain/);
assert.match(keyringIndex, /private getProviderSignArbitraryWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderArbitrary = async/);

assert.match(walletController, /signCosmosProviderArbitrary =/);

console.log('suggested chain provider signArbitrary upgrade verification passed');
