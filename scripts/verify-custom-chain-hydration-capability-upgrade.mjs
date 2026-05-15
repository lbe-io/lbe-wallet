import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const customRuntimePolicy = await read(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
);
const capability = await read(
  '../src/cosmos/chains/runtimeChainCapability.ts',
);
const fetchWalletData = await read('../src/popup/hooks/useFetchWalletData.ts');

assert.match(
  customRuntimePolicy,
  /canSelectivelyUpgradeCustomChainHydrationContext/,
);
assert.match(customRuntimePolicy, /new URL\(value\)/);
assert.match(customRuntimePolicy, /interpretation\.source !== 'custom'/);
assert.match(customRuntimePolicy, /interpretation\.persisted/);
assert.match(customRuntimePolicy, /!!interpretation\.addressContext/);
assert.match(customRuntimePolicy, /chainName/);

assert.match(capability, /canSelectivelyUpgradeCustomChainHydrationContext/);
assert.match(capability, /hydrationContext:/);
assert.match(capability, /interpretation\.source === 'custom'/);
assert.match(capability, /interpretation\.source === 'builtin'/);
assert.match(capability, /supportedCapability\('selective-partial'\)/);
assert.match(capability, /resolveContextReason\(interpretation, 'missing_hydration_context'\)/);

assert.match(fetchWalletData, /hasRuntimeChainCapability\(runtimeChain, 'hydrationContext'\)/);
assert.match(fetchWalletData, /ensureRuntimeChainHydrationContext/);

console.log('custom chain hydration capability upgrade verification passed');
