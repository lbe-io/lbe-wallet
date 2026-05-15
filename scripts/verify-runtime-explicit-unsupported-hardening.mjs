import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');

assert.match(capability, /export type RuntimeUnsupportedReason =/);
assert.match(capability, /export type RuntimeUnsupportedDetails =/);
assert.match(capability, /export type RuntimeUnsupportedError =/);
for (const reason of [
  'custom_chain_missing_runtime_metadata',
  'suggested_chain_not_persisted',
  'missing_runtime_transport',
  'missing_address_metadata',
  'missing_native_asset_metadata',
  'missing_query_context',
  'missing_send_context',
  'not_persisted_runtime_candidate',
]) {
  assert.match(capability, new RegExp(`'${reason}'`));
}

assert.match(
  adapter,
  /unsupportedReason: 'custom_chain_missing_runtime_metadata'/,
);
assert.match(
  adapter,
  /unsupportedReason: entry\.persisted\s*\?\s*resolvePersistedSuggestedMetadataUnsupportedReason\(entry\.chainRecord\)\s*:\s*'suggested_chain_not_persisted'/,
);
assert.match(
  adapter,
  /resolvePersistedSuggestedMetadataUnsupportedReason/,
);

assert.match(capability, /const resolveBaseUnsupportedReason =/);
assert.match(capability, /export const buildRuntimeUnsupportedDetails =/);
assert.match(capability, /export const buildRuntimeUnsupportedEntryDetails =/);
assert.match(capability, /export const buildRuntimeUnsupportedEntryError =/);
assert.match(capability, /export const getRuntimeUnsupportedErrorData =/);
assert.match(capability, /const resolveRuntimeUnsupportedEntryReason =/);
assert.match(capability, /return 'missing_runtime_transport';/);
assert.match(
  capability,
  /if \(interpretation\.unsupportedReason\) {\s*return interpretation\.unsupportedReason;\s*}/,
);
assert.match(capability, /return 'not_persisted_runtime_candidate';/);
assert.match(capability, /return 'suggested_chain_not_persisted';/);
assert.match(capability, /return 'custom_chain_missing_runtime_metadata';/);

assert.match(capability, /export const resolveRuntimeExecutableUnsupportedReason =/);
assert.match(capability, /return 'missing_runtime_transport';/);
assert.match(capability, /return 'missing_address_metadata';/);
assert.match(capability, /return 'missing_native_asset_metadata';/);
assert.match(capability, /return 'missing_query_context';/);
assert.match(capability, /return 'missing_send_context';/);

assert.match(
  capability,
  /return unsupportedCapability\(\s*'runtime-executable',\s*resolveRuntimeExecutableUnsupportedReason\(/,
);
assert.match(
  capability,
  /unsupportedReason:\s*addressSupport\.unsupportedReason \|\|\s*resolveRuntimeProviderAccountReadUnsupportedReason\(/,
);
assert.match(
  capability,
  /unsupportedReason:\s*addressSupport\.unsupportedReason \|\|\s*resolveRuntimeProviderSignDirectUnsupportedReason\(/,
);
assert.match(
  capability,
  /unsupportedReason:\s*addressSupport\.unsupportedReason \|\|\s*resolveRuntimeProviderSignAminoUnsupportedReason\(/,
);
assert.match(
  capability,
  /unsupportedReason:\s*addressSupport\.unsupportedReason \|\|\s*resolveRuntimeProviderSignArbitraryUnsupportedReason\(/,
);
assert.match(
  capability,
  /unsupportedReason:\s*resolveRuntimeProviderSendTxUnsupportedReason\(/,
);

assert.match(
  capability,
  /throw buildRuntimeCapabilityError\(/,
);
assert.match(capability, /support\.unsupportedReason \|\| fallbackReason/);
assert.match(capability, /error\.data = details;/);
assert.match(capability, /error\.runtimeUnsupported = details;/);

console.log('runtime explicit unsupported hardening verification passed');
