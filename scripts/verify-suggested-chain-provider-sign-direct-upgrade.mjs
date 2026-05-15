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

assert.match(controllerShared, /export const ensureProviderSignDirectChain = async/);
assert.match(controllerShared, /ensureRuntimeProviderSignDirectContext/);

assert.match(signingHandlers, /export const signDirect = async/);
assert.match(signingHandlers, /await ensureProviderSignDirectChain/);
assert.match(signingHandlers, /wallet\.signCosmosProviderDirect/);

assert.match(signerResolver, /resolveProviderSignDirectSignerChainContext/);
assert.match(signerResolver, /ensureRuntimeProviderSignDirectContext/);
assert.match(signerResolver, /getDirectWalletForProviderSignDirectChain/);

assert.match(keyringIndex, /getDirectWalletForProviderSignDirectChain as resolveDirectWalletForProviderSignDirectChain/);
assert.match(keyringIndex, /private getProviderSignDirectWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderDirect = async/);

assert.match(walletController, /signCosmosProviderDirect =/);

console.log('suggested chain provider signDirect upgrade verification passed');
