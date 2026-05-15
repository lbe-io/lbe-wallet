import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const repository = await read('../src/cosmos/chains/chainRepository.ts');

assert.match(capability, /export type RuntimeCapabilityContractKind =/);
assert.match(capability, /export type RuntimeDisplayOnlyCapability =/);
assert.match(capability, /export type RuntimeSelectivePartialCapability =/);
assert.match(capability, /export type RuntimeExecutableCapability =/);
assert.match(capability, /export type RuntimeProviderAccountReadPreconditions =/);
assert.match(capability, /export type RuntimeProviderAccountReadResult =/);
assert.match(capability, /export type RuntimeProviderSignAminoPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignAminoResult =/);
assert.match(capability, /export type RuntimeProviderSignArbitraryPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignArbitraryResult =/);
assert.match(capability, /export type RuntimeProviderSendTxPreconditions =/);
assert.match(capability, /export type RuntimeProviderSendTxResult =/);
assert.match(capability, /export type RuntimeProviderSignDirectPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignDirectResult =/);
assert.match(capability, /RUNTIME_CHAIN_CAPABILITY_CONTRACT/);
assert.match(capability, /approvalDisplayContext: 'display-only'/);
assert.match(capability, /addressDerivation: 'selective-partial'/);
assert.match(capability, /nativeAssetContext: 'selective-partial'/);
assert.match(capability, /hydrationContext: 'selective-partial'/);
assert.match(capability, /sendFlowContext: 'runtime-executable'/);
assert.match(capability, /queryContext: 'runtime-executable'/);
assert.match(capability, /export type RuntimeExecutableCapabilityResult =/);
assert.match(capability, /contractKind: 'runtime-executable'/);
assert.match(capability, /export const getRuntimeCapabilityContractKind =/);
assert.match(capability, /export const getRuntimeExecutableCapabilityResult =/);
assert.match(capability, /export const getRuntimeProviderAccountReadResult =/);
assert.match(capability, /export const getRuntimeProviderSignAminoResult =/);
assert.match(capability, /export const getRuntimeProviderSignArbitraryResult =/);
assert.match(capability, /export const getRuntimeProviderSendTxResult =/);
assert.match(capability, /export const getRuntimeProviderSignDirectResult =/);
assert.match(capability, /export const ensureRuntimeExecutableCapability =/);
assert.match(capability, /export const ensureRuntimeExecutableSendFlowContext =/);
assert.match(capability, /export const ensureRuntimeExecutableQueryContext =/);
assert.match(capability, /export const ensureRuntimeProviderAccountReadContext =/);
assert.match(capability, /export const ensureRuntimeProviderSignAminoContext =/);
assert.match(capability, /export const ensureRuntimeProviderSignArbitraryContext =/);
assert.match(capability, /export const ensureRuntimeProviderSendTxContext =/);
assert.match(capability, /export const ensureRuntimeProviderSignDirectContext =/);
assert.match(capability, /const buildRuntimeQueryCapabilitySupport =/);
assert.match(capability, /const buildRuntimeSendCapabilitySupport =/);

assert.match(adapter, /RuntimeCapabilityContractKind/);
assert.match(adapter, /RuntimeExecutableCapability/);
assert.match(adapter, /RuntimeExecutableCapabilityResult/);
assert.match(adapter, /buildRuntimeExecutablePreconditions/);
assert.match(adapter, /buildRuntimeProviderAccountReadPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignAminoPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignArbitraryPreconditions/);
assert.match(adapter, /buildRuntimeProviderSendTxPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignDirectPreconditions/);
assert.match(adapter, /ensureRuntimeExecutableSendFlowContext/);
assert.match(adapter, /ensureRuntimeExecutableQueryContext/);
assert.match(adapter, /ensureRuntimeProviderAccountReadContext/);
assert.match(adapter, /ensureRuntimeProviderSignAminoContext/);
assert.match(adapter, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(adapter, /ensureRuntimeProviderSendTxContext/);
assert.match(adapter, /ensureRuntimeProviderSignDirectContext/);

assert.match(repository, /getRuntimeExecutableCapabilityByChainId/);
assert.match(repository, /getRuntimeExecutablePreconditionsByChainId/);

console.log('stage3 runtime support contract verification passed');
