import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(capability, /export type RuntimeUnsupportedReason =/);
assert.match(capability, /'missing_runtime_transport'/);
assert.match(capability, /'missing_address_metadata'/);
assert.match(capability, /'missing_native_asset_metadata'/);
assert.match(capability, /'missing_query_context'/);
assert.match(capability, /'missing_send_context'/);
assert.match(capability, /'not_persisted_runtime_candidate'/);
assert.match(capability, /export const resolveRuntimeExecutableUnsupportedReason =/);
assert.match(capability, /interpretation\.source !== 'builtin' && !interpretation\.persisted/);
assert.match(capability, /return 'missing_runtime_transport'/);
assert.match(capability, /return 'missing_address_metadata'/);
assert.match(capability, /return 'missing_native_asset_metadata'/);
assert.match(capability, /\(capability === 'queryContext' && !preconditions\.validRest\)/);
assert.match(capability, /if \(capability === 'queryContext'\)/);
assert.match(capability, /'missing_query_context'/);
assert.match(capability, /'missing_send_context'/);

console.log('stage3 runtime support reason taxonomy verification passed');
