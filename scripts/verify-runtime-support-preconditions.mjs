import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');

assert.match(capability, /export type RuntimeExecutablePreconditions =/);
assert.match(capability, /export type RuntimeProviderAccountReadPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignAminoPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignArbitraryPreconditions =/);
assert.match(capability, /export type RuntimeProviderSendTxPreconditions =/);
assert.match(capability, /export type RuntimeProviderSignDirectPreconditions =/);
assert.match(capability, /stableChainId:/);
assert.match(capability, /validRpc:/);
assert.match(capability, /validRest:/);
assert.match(capability, /stableBech32Prefix:/);
assert.match(capability, /stableCoinType:/);
assert.match(capability, /stableNativeAssetMetadata:/);
assert.match(capability, /minimalGasFeeContext:/);
assert.match(capability, /const RPC_PROTOCOLS = new Set/);
assert.match(capability, /const REST_PROTOCOLS = new Set/);
assert.match(capability, /feeCurrencies\?\.\[0\]\?\.gasPriceStep\?\.average/);
assert.match(capability, /export const buildRuntimeExecutablePreconditions =/);
assert.match(capability, /export const buildRuntimeProviderAccountReadPreconditions =/);
assert.match(capability, /export const buildRuntimeProviderSignAminoPreconditions =/);
assert.match(capability, /export const buildRuntimeProviderSignArbitraryPreconditions =/);
assert.match(capability, /export const buildRuntimeProviderSendTxPreconditions =/);
assert.match(capability, /export const buildRuntimeProviderSignDirectPreconditions =/);
assert.match(capability, /const hasSatisfiedRuntimeProviderAccountReadPreconditions =/);
assert.match(capability, /const hasSatisfiedRuntimeQueryPreconditions =/);
assert.match(capability, /const hasSatisfiedRuntimeSendPreconditions =/);
assert.match(
  capability,
  /hasSatisfiedRuntimeProviderAccountReadPreconditions[\s\S]*?preconditions\.stableChainId[\s\S]*?preconditions\.stableBech32Prefix[\s\S]*?preconditions\.stableCoinType/,
);
assert.match(capability, /const buildRuntimeSendCapabilitySupport =/);
assert.match(capability, /const buildRuntimeQueryCapabilitySupport =/);
assert.match(capability, /sendFlowContext: buildRuntimeSendCapabilitySupport/);
assert.match(capability, /queryContext: buildRuntimeQueryCapabilitySupport/);

assert.match(adapter, /buildRuntimeExecutablePreconditions/);
assert.match(adapter, /buildRuntimeProviderAccountReadPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignAminoPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignArbitraryPreconditions/);
assert.match(adapter, /buildRuntimeProviderSendTxPreconditions/);
assert.match(adapter, /buildRuntimeProviderSignDirectPreconditions/);

console.log('stage3 runtime support preconditions verification passed');
