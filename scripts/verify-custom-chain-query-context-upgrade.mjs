import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const customRuntimePolicy = await read(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
);
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const runtimeAdapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const chainRepository = await read('../src/cosmos/chains/chainRepository.ts');

assert.match(customRuntimePolicy, /resolvePersistedCustomChainRestContext/);
assert.match(customRuntimePolicy, /SUPPORTED_REST_PROTOCOLS/);
assert.match(customRuntimePolicy, /typeMetadata\.rest/);
assert.match(customRuntimePolicy, /typeMetadata\.restUrl/);
assert.match(customRuntimePolicy, /typeMetadata\.api/);
assert.match(customRuntimePolicy, /typeMetadata\.lcd/);
assert.match(customRuntimePolicy, /resolveRestAddressFromApis/);

assert.match(runtimeAdapter, /resolvePersistedCustomChainRestContext/);
assert.match(runtimeAdapter, /rest:\s*options\?\.rest \|\| undefined/);
assert.match(runtimeAdapter, /const rest = resolvePersistedCustomChainRestContext/);

assert.match(capability, /const hasSatisfiedRuntimeQueryPreconditions =/);
assert.match(capability, /const buildRuntimeQueryCapabilitySupport =/);
assert.match(capability, /interpretation\.source === 'custom'/);
assert.match(capability, /interpretation\.persisted/);
assert.match(capability, /hasSatisfiedRuntimeQueryPreconditions\(preconditions\)/);
assert.match(capability, /queryContext: buildRuntimeQueryCapabilitySupport/);
assert.match(capability, /'missing_query_context'/);
assert.match(capability, /'not_persisted_runtime_candidate'/);

assert.match(chainRepository, /getRuntimeExecutableCapabilityByChainId/);
assert.match(chainRepository, /getRuntimeExecutablePreconditionsByChainId/);

console.log('custom chain query context upgrade verification passed');
