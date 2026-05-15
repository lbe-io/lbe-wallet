import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const providerShared = await read('../src/entrypoints/background/controller/provider/controllerShared.ts');
const signerResolver = await read('../src/entrypoints/background/service/keyring/signerResolver.ts');
const txBroadcastService = await read('../src/entrypoints/background/service/keyring/txBroadcastService.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');

const countMatches = (source, pattern) => [...source.matchAll(pattern)].length;

assert.match(
  capability,
  /if \(interpretation\.source !== 'builtin' && !interpretation\.persisted\) {\s*return 'not_persisted_runtime_candidate';\s*}/,
);
assert.match(
  capability,
  /if \(interpretation\.source === 'suggested'\) {\s*return 'suggested_chain_not_persisted';\s*}/,
);
assert.match(
  capability,
  /if \(interpretation\.source === 'custom'\) {\s*return 'custom_chain_missing_runtime_metadata';\s*}/,
);

assert.match(
  capability,
  /\(interpretation\.source === 'custom' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeSendPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'suggested' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeSendPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'custom' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeQueryPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'suggested' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeQueryPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'custom' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeProviderAccountReadPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'suggested' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeProviderAccountReadPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'custom' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeProviderSendTxPreconditions\(preconditions\)\)/,
);
assert.match(
  capability,
  /\(interpretation\.source === 'suggested' &&\s*interpretation\.persisted &&\s*hasSatisfiedRuntimeProviderSendTxPreconditions\(preconditions\)\)/,
);

for (const source of [sendFlowFacade, cosmosSend, providerShared]) {
  assert.doesNotMatch(source, /getCosmosChainConfig\(/);
  assert.match(source, /getRuntimeChainInterpretationByChainId/);
}

assert.match(sendFlowFacade, /ensureRuntimeExecutableSendFlowContext/);
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);
assert.match(providerShared, /ensureRuntimeProviderAccountReadContext/);
assert.match(providerShared, /ensureRuntimeProviderSignDirectContext/);
assert.match(providerShared, /ensureRuntimeProviderSignAminoContext/);
assert.match(providerShared, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(providerShared, /ensureRuntimeProviderSendTxContext/);

assert.equal(countMatches(signerResolver, /getCosmosChainConfig\(/g), 1);
assert.match(signerResolver, /const getBuiltinSignerChainContext =/);
assert.match(signerResolver, /const ensureRuntimeSignerChainContext = async/);

assert.equal(countMatches(txBroadcastService, /getCosmosChainConfig\(/g), 1);
assert.match(txBroadcastService, /const getBuiltinBroadcastRpcEndpointOrThrow =/);

assert.equal(countMatches(keyringIndex, /getCosmosChainConfig\(/g), 1);
assert.match(keyringIndex, /private getBuiltinChainConfig =/);
assert.match(keyringIndex, /private getBuiltinRpcEndpointOrThrow =/);
assert.match(keyringIndex, /private buildBuiltinCurrencyList =/);
assert.match(
  keyringIndex,
  /sendCosmosTxWithDeps\(\s*{\s*normalizeTxBytes: \(resolvedTxBytes\) => this\.normalizeTxBytes\(resolvedTxBytes\),\s*getRpcEndpointForChain:/s,
);

console.log('runtime no builtin fallback hardening verification passed');
