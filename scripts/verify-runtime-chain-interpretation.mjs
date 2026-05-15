import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const runtimeAdapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const chainRepository = await read('../src/cosmos/chains/chainRepository.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(capability, /export type RuntimeChainStatus =/);
assert.match(capability, /export type RuntimeUnsupportedReason =/);
assert.match(capability, /export type NativeAssetContext =/);
assert.match(capability, /export type AddressBech32Context =/);
assert.match(capability, /export type RuntimeChainInterpretation =/);
assert.match(capability, /capabilityMatrix: RuntimeChainCapabilityMatrix/);
assert.match(runtimeAdapter, /buildBuiltinRuntimeChainInterpretation/);
assert.match(runtimeAdapter, /buildCustomRuntimeChainInterpretation/);
assert.match(runtimeAdapter, /buildPersistedCustomRuntimeChainInterpretation/);
assert.match(runtimeAdapter, /buildSuggestedRuntimeChainInterpretation/);
assert.match(runtimeAdapter, /ensureRuntimeChainAddressContext/);
assert.match(runtimeAdapter, /ensureRuntimeChainNativeAssetContext/);
assert.match(runtimeAdapter, /ensureRuntimeChainRpcContext/);
assert.match(runtimeAdapter, /ensureRuntimeChainSendFlowContext/);
assert.match(runtimeAdapter, /ensureRuntimeChainQueryContext/);

assert.match(chainRepository, /getRuntimeChainInterpretationByChainId/);
assert.match(chainRepository, /buildRuntimeChainInterpretationBySource/);
assert.match(chainRepository, /buildSuggestedRuntimeChainInterpretationByInfo/);

console.log('runtime chain interpretation verification passed');
