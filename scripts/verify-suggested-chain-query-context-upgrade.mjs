import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const suggestedSource = await read('../src/cosmos/chains/suggestedChainSource.ts');
const repository = await read('../src/cosmos/chains/chainRepository.ts');
const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const assetQueryService = await read('../src/entrypoints/background/service/keyring/assetQueryService.ts');
const txHistoryQueryService = await read('../src/entrypoints/background/service/keyring/txHistoryQueryService.ts');
const stakingQueryService = await read('../src/entrypoints/background/service/keyring/stakingQueryService.ts');
const priceQueryService = await read('../src/entrypoints/background/service/keyring/priceQueryService.ts');

assert.match(suggestedSource, /toPersistedSuggestedChainSourceEntry/);
assert.match(suggestedSource, /getSuggestedChainSource = async/);
assert.match(suggestedSource, /runtimeSource: 'suggested'/);
assert.match(repository, /getSuggestedChainSource/);
assert.match(repository, /const suggested = await getSuggestedChainSource/);
assert.match(
  adapter,
  /unsupportedReason: entry\.persisted\s*\?\s*resolvePersistedSuggestedMetadataUnsupportedReason\(entry\.chainRecord\)\s*:\s*'suggested_chain_not_persisted'/,
);
assert.match(
  capability,
  /const buildRuntimeQueryCapabilitySupport =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeQueryPreconditions/s,
);

for (const source of [
  assetQueryService,
  txHistoryQueryService,
  stakingQueryService,
  priceQueryService,
]) {
  assert.match(source, /ensureRuntimeExecutableQueryContext/);
}

console.log('suggested chain query context upgrade verification passed');
