import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const fetchWalletData = await read('../src/popup/hooks/useFetchWalletData.ts');

assert.match(capability, /'missing_hydration_context'/);
assert.match(capability, /ensureRuntimeChainHydrationContext/);
assert.match(capability, /'missing_hydration_context'/);
assert.match(capability, /hydrationContext:/);
assert.match(fetchWalletData, /hasRuntimeChainCapability\(runtimeChain, 'hydrationContext'\)/);
assert.match(fetchWalletData, /ensureRuntimeChainHydrationContext\(runtimeChain, 'wallet hydration'\)/);
assert.match(fetchWalletData, /hasRuntimeChainCapability\(hydrationChain, 'addressDerivation'\)/);

console.log('runtime chain hydration gate verification passed');
