import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const fetchWalletData = await read('../src/popup/hooks/useFetchWalletData.ts');
const connectApproval = await read(
  '../src/popup/app/approval/component/Connect/index.tsx',
);

assert.match(capability, /ensureRuntimeChainAddressContext/);
assert.match(
  capability,
  /addressDerivation: hasAddressContext\s*\?/,
);

for (const source of [fetchWalletData, connectApproval]) {
  assert.match(source, /hasRuntimeChainCapability/);
  assert.match(source, /'addressDerivation'/);
  assert.match(source, /getRuntimeChainInterpretationByChainId/);
}

assert.match(fetchWalletData, /ensureRuntimeChainHydrationContext/);
assert.match(connectApproval, /ensureRuntimeChainApprovalDisplayContext/);

console.log('runtime chain address capability gate verification passed');
