import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const customRuntimePolicy = await read(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
);
const runtimeAdapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(customRuntimePolicy, /resolvePersistedCustomChainGasPriceStep/);
assert.match(customRuntimePolicy, /toValidGasPriceStep/);
assert.match(customRuntimePolicy, /resolveGasPriceStepFromFeeCurrencies/);
assert.match(customRuntimePolicy, /typeMetadata\.gasPriceStep/);
assert.match(customRuntimePolicy, /typeMetadata\.feeCurrencies/);
assert.match(customRuntimePolicy, /typeMetadata\.chainInfo/);

assert.match(runtimeAdapter, /resolvePersistedCustomChainGasPriceStep/);
assert.match(runtimeAdapter, /buildPersistedCustomChainInfo/);
assert.match(runtimeAdapter, /buildCosmosBech32Config/);
assert.match(runtimeAdapter, /feeCurrencies:/);
assert.match(runtimeAdapter, /gasPriceStep/);
assert.match(runtimeAdapter, /chainInfo:\s*options\?\.chainInfo/);

assert.match(capability, /const buildRuntimeSendCapabilitySupport =/);
assert.match(capability, /interpretation\.source === 'custom'/);
assert.match(capability, /interpretation\.persisted/);
assert.match(capability, /hasSatisfiedRuntimeSendPreconditions\(preconditions\)/);
assert.match(capability, /sendFlowContext: buildRuntimeSendCapabilitySupport/);
assert.match(capability, /'missing_send_context'/);
assert.match(capability, /'not_persisted_runtime_candidate'/);

console.log('custom chain send flow context upgrade verification passed');
