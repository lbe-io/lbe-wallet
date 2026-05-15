import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const suggestedSource = await read('../src/cosmos/chains/suggestedChainSource.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const controllerShared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const accountReadHandlers = await read('../src/entrypoints/background/controller/provider/accountReadHandlers.ts');
const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');

assert.match(suggestedSource, /toPersistedSuggestedChainSourceEntry/);
assert.match(suggestedSource, /getSuggestedChainSource = async/);
assert.match(
  capability,
  /export const getRuntimeProviderAccountReadResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(capability, /export const getRuntimeProviderSignDirectResult =/);
assert.match(capability, /export const getRuntimeProviderSignAminoResult =/);
assert.match(capability, /export const getRuntimeProviderSignArbitraryResult =/);
assert.doesNotMatch(
  capability,
  /ensureRuntimeProviderSignDirectContext[\s\S]*?ensureRuntimeProviderAccountReadContext\(interpretation, capability\)/s,
);
assert.doesNotMatch(
  capability,
  /ensureRuntimeProviderSignAminoContext[\s\S]*?ensureRuntimeProviderAccountReadContext\(interpretation, capability\)/s,
);
assert.doesNotMatch(
  capability,
  /ensureRuntimeProviderSignArbitraryContext[\s\S]*?ensureRuntimeProviderAccountReadContext\(interpretation, capability\)/s,
);
assert.match(controllerShared, /ensureRuntimeProviderAccountReadContext/);
assert.match(controllerShared, /export const ensureProviderAccountReadableChain = async/);
assert.match(accountReadHandlers, /await ensureProviderAccountReadableChain/);
assert.match(signerResolver, /resolveAccountReadSignerChainContext/);
assert.match(signerResolver, /ensureRuntimeProviderAccountReadContext/);
assert.match(keyringIndex, /private getAccountReadWalletForChain = async/);
assert.match(keyringIndex, /this\.getAccountReadWalletForChain/);

console.log('suggested chain provider account-read upgrade verification passed');
