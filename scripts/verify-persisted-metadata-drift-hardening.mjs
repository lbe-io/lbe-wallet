import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const customRuntimePolicy = await read(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
);
const suggestedSource = await read('../src/cosmos/chains/suggestedChainSource.ts');
const customSource = await read('../src/cosmos/chains/customChainSource.ts');
const repository = await read('../src/cosmos/chains/chainRepository.ts');
const runtimeAdapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');

assert.match(
  customRuntimePolicy,
  /export const hasPersistedCustomRuntimeMetadataEnvelope =/,
);

for (const resolverName of [
  'resolvePersistedCustomChainAddressDerivationContext',
  'resolvePersistedCustomChainRestContext',
  'resolvePersistedCustomChainGasPriceStep',
  'resolvePersistedCustomChainNativeAssetContext',
]) {
  assert.match(
    customRuntimePolicy,
    new RegExp(
      `export const ${resolverName} =[\\s\\S]*?if \\(!hasPersistedCustomRuntimeMetadataEnvelope\\(chainRecord\\)\\) {\\s*return null;\\s*}`,
      's',
    ),
  );
}

assert.match(
  suggestedSource,
  /export const hasPersistedSuggestedMetadataEnvelope =/,
);
assert.match(suggestedSource, /const hasSuggestedRuntimeSourceMarker =/);
assert.match(
  suggestedSource,
  /parseSuggestedChainTypeMetadata\(normalized\)/,
);
assert.match(
  suggestedSource,
  /hasSuggestedRuntimeSourceMarker\(normalized\)/,
);
assert.match(
  suggestedSource,
  /\|\|/,
);
assert.match(
  suggestedSource,
  /export const resolvePersistedSuggestedMetadataUnsupportedReason =[\s\S]*?if \(!hasPersistedSuggestedMetadataEnvelope\(chain\)\) {\s*return undefined;\s*}[\s\S]*?const chainInfo = buildPersistedSuggestedChainInfo\(chain, metadata \|\| \{\}\);/s,
);
assert.match(
  suggestedSource,
  /export const isPersistedSuggestedChainRecord =[\s\S]*?=> hasPersistedSuggestedMetadataEnvelope\(chain\);/s,
);
assert.match(
  suggestedSource,
  /if \(!metadata && !hasPersistedSuggestedMetadataEnvelope\(chain\)\) {\s*return undefined;\s*}/,
);
assert.match(
  suggestedSource,
  /const chainInfo = buildPersistedSuggestedChainInfo\(chain, metadata \|\| \{\}\);/,
);
assert.match(suggestedSource, /const buildFallbackStakeCurrency =/);
assert.match(
  suggestedSource,
  /const stakeCurrency =[\s\S]*?\|\|\s*chainRecordCurrency\s*\|\|\s*buildFallbackStakeCurrency\(chain\);/s,
);
assert.match(
  suggestedSource,
  /const coinDenom = normalizeString\(record\.coinDenom\);[\s\S]*?const coinMinimalDenom = normalizeString\(record\.coinMinimalDenom\);[\s\S]*?const coinDecimals = toFiniteNonNegativeInteger\(record\.coinDecimals\);[\s\S]*?if \(!coinDenom \|\| !coinMinimalDenom \|\| coinDecimals === undefined\) {\s*return null;\s*}/s,
);

assert.match(
  runtimeAdapter,
  /resolvePersistedSuggestedMetadataUnsupportedReason/,
);
assert.match(
  runtimeAdapter,
  /unsupportedReason: entry\.persisted\s*\?\s*resolvePersistedSuggestedMetadataUnsupportedReason\(entry\.chainRecord\)\s*:\s*'suggested_chain_not_persisted'/,
);

assert.match(customSource, /!isPersistedSuggestedChainRecord\(item\)/);
assert.match(
  repository,
  /const suggested = await getSuggestedChainSource\(chainId\);[\s\S]*?const custom = await getCustomChainSource\(chainId\);/s,
);
assert.match(repository, /!isPersistedSuggestedChainRecord\(item\)/);

console.log('persisted metadata drift hardening verification passed');
