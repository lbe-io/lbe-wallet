import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const assetQueryService = await read('../src/entrypoints/background/service/keyring/assetQueryService.ts');
const txHistoryQueryService = await read('../src/entrypoints/background/service/keyring/txHistoryQueryService.ts');
const stakingQueryService = await read('../src/entrypoints/background/service/keyring/stakingQueryService.ts');
const priceQueryService = await read('../src/entrypoints/background/service/keyring/priceQueryService.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');

assert.match(capability, /ensureRuntimeExecutableQueryContext/);
assert.match(capability, /ensureRuntimeChainQueryContext = ensureRuntimeExecutableQueryContext/);

for (const source of [
  assetQueryService,
  txHistoryQueryService,
  stakingQueryService,
  priceQueryService,
]) {
  assert.match(source, /ensureRuntimeExecutableQueryContext/);
}

assert.match(assetQueryService, /const supportedChain = ensureRuntimeExecutableQueryContext/);
assert.match(txHistoryQueryService, /const supportedChain = ensureRuntimeExecutableQueryContext/);
assert.match(stakingQueryService, /const supportedChain = ensureRuntimeExecutableQueryContext/);
assert.match(priceQueryService, /ensureRuntimeExecutableQueryContext\(chain, 'native price query'\)/);
assert.match(txHistoryQueryService, /ensureRuntimeChainRestContext/);
assert.match(keyringIndex, /ensureRuntimeExecutableQueryContext/);
assert.match(keyringIndex, /ensureRuntimeChainRpcContext/);
assert.match(keyringIndex, /private getRpcEndpointOrThrow = async/);
assert.match(keyringIndex, /private getStargateClientForChain = async/);

console.log('runtime executable query gate verification passed');
