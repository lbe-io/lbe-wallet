import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(capability, /const hasSatisfiedRuntimeSendPreconditions =/);
assert.match(capability, /preconditions\.stableChainId/);
assert.match(capability, /preconditions\.validRpc/);
assert.match(capability, /preconditions\.stableBech32Prefix/);
assert.match(capability, /preconditions\.stableCoinType/);
assert.match(capability, /preconditions\.stableNativeAssetMetadata/);
assert.match(capability, /preconditions\.minimalGasFeeContext/);
assert.doesNotMatch(
  capability,
  /hasSatisfiedRuntimeQueryPreconditions\(preconditions\)\s*&&\s*preconditions\.minimalGasFeeContext/,
);
assert.match(
  capability,
  /\(capability === 'queryContext' && !preconditions\.validRest\)/,
);

console.log('stage3 send flow preconditions verification passed');
