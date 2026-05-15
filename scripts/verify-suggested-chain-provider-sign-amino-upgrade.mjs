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
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);

assert.match(controllerShared, /export const ensureProviderSignAminoChain = async/);
assert.match(controllerShared, /ensureRuntimeProviderSignAminoContext/);

assert.match(signingHandlers, /export const signAmino = async/);
assert.match(signingHandlers, /await ensureProviderSignAminoChain/);
assert.match(signingHandlers, /wallet\.signCosmosProviderAmino/);

assert.match(signerResolver, /resolveProviderSignAminoSignerChainContext/);
assert.match(signerResolver, /ensureRuntimeProviderSignAminoContext/);
assert.match(signerResolver, /getAminoWalletForProviderSignAminoChain/);

assert.match(keyringIndex, /getAminoWalletForProviderSignAminoChain as resolveAminoWalletForProviderSignAminoChain/);
assert.match(keyringIndex, /private getProviderSignAminoWalletForChain = async/);
assert.match(keyringIndex, /signCosmosProviderAmino = async/);

assert.match(walletController, /signCosmosProviderAmino =/);

console.log('suggested chain provider signAmino upgrade verification passed');
