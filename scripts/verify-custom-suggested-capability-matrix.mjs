import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const customRuntimePolicy = await read('../src/cosmos/chains/customChainRuntimePolicy.ts');
const suggestedSource = await read('../src/cosmos/chains/suggestedChainSource.ts');

assert.match(adapter, /runtimeStatus: 'supported'/);
assert.match(adapter, /runtimeStatus: 'partial'/);
assert.match(adapter, /unsupportedReason: 'custom_chain_missing_runtime_metadata'/);
assert.match(
  adapter,
  /unsupportedReason: entry\.persisted\s*\?\s*resolvePersistedSuggestedMetadataUnsupportedReason\(entry\.chainRecord\)\s*:\s*'suggested_chain_not_persisted'/,
);
assert.match(adapter, /buildPersistedCustomRuntimeChainInterpretation/);
assert.match(adapter, /addressContext: options\?\.addressContext \|\| null/);
assert.match(adapter, /resolvePersistedCustomChainGasPriceStep/);
assert.match(adapter, /buildPersistedCustomChainInfo/);
assert.match(adapter, /chainInfo:\s*options\?\.chainInfo/);
assert.match(suggestedSource, /toPersistedSuggestedChainSourceEntry/);
assert.match(suggestedSource, /getSuggestedChainSource = async/);
assert.match(suggestedSource, /runtimeSource: 'suggested'/);
assert.match(
  suggestedSource,
  /export const hasPersistedSuggestedMetadataEnvelope =/,
);
assert.match(
  suggestedSource,
  /export const resolvePersistedSuggestedMetadataUnsupportedReason =/,
);

assert.match(capability, /sendFlowContext:/);
assert.match(capability, /queryContext:/);
assert.match(capability, /approvalDisplayContext:/);
assert.match(capability, /hydrationContext:/);
assert.match(capability, /nativeAssetContext:/);
assert.match(capability, /addressDerivation:/);
assert.match(capability, /buildRuntimeSendCapabilitySupport/);
assert.match(capability, /buildRuntimeQueryCapabilitySupport/);
assert.match(capability, /hasSatisfiedRuntimeQueryPreconditions/);
assert.match(capability, /hasSatisfiedRuntimeSendPreconditions/);
assert.match(capability, /buildRuntimeExecutablePreconditions/);
assert.match(capability, /buildRuntimeProviderAccountReadPreconditions/);
assert.match(capability, /buildRuntimeProviderSignAminoPreconditions/);
assert.match(capability, /buildRuntimeProviderSignArbitraryPreconditions/);
assert.match(capability, /buildRuntimeProviderSendTxPreconditions/);
assert.match(capability, /buildRuntimeProviderSignDirectPreconditions/);
assert.match(capability, /interpretation\.runtimeStatus === 'supported'/);
assert.match(capability, /not_persisted_runtime_candidate/);
assert.match(capability, /missing_runtime_transport/);
assert.match(capability, /missing_send_context/);
assert.match(capability, /missing_query_context/);
assert.match(capability, /ensureRuntimeProviderAccountReadContext/);
assert.match(capability, /ensureRuntimeProviderSignAminoContext/);
assert.match(capability, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(capability, /ensureRuntimeProviderSendTxContext/);
assert.match(capability, /ensureRuntimeProviderSignDirectContext/);
assert.match(capability, /interpretation\.source === 'custom'/);
assert.match(capability, /interpretation\.persisted/);
assert.match(capability, /interpretation\.source === 'suggested'/);
assert.match(
  capability,
  /const buildRuntimeQueryCapabilitySupport =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeQueryPreconditions/s,
);
assert.match(
  capability,
  /const buildRuntimeSendCapabilitySupport =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeSendPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderAccountReadResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignDirectResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignAminoResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSignArbitraryResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderAccountReadPreconditions/s,
);
assert.match(
  capability,
  /export const getRuntimeProviderSendTxResult =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeProviderSendTxPreconditions/s,
);
assert.match(customRuntimePolicy, /hasValidCustomChainId/);
assert.match(customRuntimePolicy, /hasValidCustomChainRpc/);
assert.match(customRuntimePolicy, /resolvePersistedCustomChainRestContext/);
assert.match(customRuntimePolicy, /resolvePersistedCustomChainGasPriceStep/);
assert.match(customRuntimePolicy, /gasPriceStep/);
assert.match(customRuntimePolicy, /coinType/);
assert.match(customRuntimePolicy, /interpretation\.source !== 'custom'/);
assert.match(customRuntimePolicy, /interpretation\.persisted/);
assert.match(customRuntimePolicy, /addressContext/);
assert.match(customRuntimePolicy, /chainName/);
assert.match(customRuntimePolicy, /coinMinimalDenom/);
assert.match(customRuntimePolicy, /coinDenom/);
assert.match(customRuntimePolicy, /coinDecimals/);

console.log('custom suggested capability matrix verification passed');
