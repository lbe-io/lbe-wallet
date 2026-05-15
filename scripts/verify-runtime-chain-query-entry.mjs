import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const assetQueryService = await read('../src/entrypoints/background/service/keyring/assetQueryService.ts');
const txHistoryQueryService = await read('../src/entrypoints/background/service/keyring/txHistoryQueryService.ts');
const stakingQueryService = await read('../src/entrypoints/background/service/keyring/stakingQueryService.ts');
const priceQueryService = await read('../src/entrypoints/background/service/keyring/priceQueryService.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');

for (const source of [assetQueryService, txHistoryQueryService, stakingQueryService]) {
  assert.match(source, /getRuntimeChainInterpretationByChainId/);
  assert.match(source, /ensureRuntimeExecutableQueryContext/);
  assert.match(source, /ensureRuntimeChainNativeAssetContext/);
  assert.doesNotMatch(source, /getCosmosChainConfig\(/);
}

assert.match(txHistoryQueryService, /ensureRuntimeChainRestContext/);
assert.match(priceQueryService, /getRuntimeChainInterpretationByChainId/);
assert.match(priceQueryService, /ensureRuntimeExecutableQueryContext/);

assert.match(keyringIndex, /from '@\/cosmos\/chains\/chainRepository'/);
assert.match(keyringIndex, /getRuntimeChainInterpretationByChainId: \(resolvedChainId\) => getRuntimeChainInterpretationByChainId\(resolvedChainId\)/);

console.log('runtime chain query entry verification passed');
