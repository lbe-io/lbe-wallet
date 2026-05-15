import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(capability, /const hasSatisfiedRuntimeQueryPreconditions =/);
assert.match(capability, /const hasSatisfiedRuntimeSendPreconditions =/);
assert.match(capability, /preconditions\.stableChainId/);
assert.match(capability, /preconditions\.validRpc/);
assert.match(capability, /preconditions\.validRest/);
assert.match(capability, /preconditions\.stableBech32Prefix/);
assert.match(capability, /preconditions\.stableCoinType/);
assert.match(capability, /preconditions\.stableNativeAssetMetadata/);
assert.match(capability, /preconditions\.minimalGasFeeContext/);
assert.match(capability, /const buildRuntimeSendCapabilitySupport =/);
assert.match(capability, /const buildRuntimeQueryCapabilitySupport =/);
assert.match(capability, /sendFlowContext: buildRuntimeSendCapabilitySupport/);
assert.match(capability, /queryContext: buildRuntimeQueryCapabilitySupport/);
assert.match(capability, /interpretation\.source === 'builtin'/);
assert.match(capability, /interpretation\.source === 'custom'/);
assert.match(capability, /interpretation\.runtimeStatus === 'supported'/);

console.log('stage3 query context preconditions verification passed');
