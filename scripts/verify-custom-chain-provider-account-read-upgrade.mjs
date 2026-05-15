import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const accountReadHandlers = await read('../src/entrypoints/background/controller/provider/accountReadHandlers.ts');

assert.match(signerResolver, /resolveAccountReadSignerChainContext/);
assert.match(signerResolver, /ensureRuntimeProviderAccountReadContext/);
assert.match(signerResolver, /getDirectWalletForAccountReadChain/);

assert.match(keyringIndex, /getDirectWalletForAccountReadChain as resolveDirectWalletForAccountReadChain/);
assert.match(keyringIndex, /private getAccountReadWalletForChain = async/);
assert.match(keyringIndex, /this\.getAccountReadWalletForChain/);

assert.match(accountReadHandlers, /wallet\.getCosmosKey/);
assert.match(accountReadHandlers, /wallet\.getOfflineSignerAccounts/);
assert.match(accountReadHandlers, /await ensureProviderAccountReadableChain/);

console.log('custom chain provider account-read upgrade verification passed');
