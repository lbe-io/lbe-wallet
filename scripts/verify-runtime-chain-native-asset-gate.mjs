import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const displayAdapter = await read(
  '../src/cosmos/chains/runtimeChainDisplayAdapter.ts',
);
const providerApprovalPreview = await read(
  '../src/entrypoints/background/controller/provider/approvalPreview.ts',
);

assert.match(capability, /nativeAssetContext:/);
assert.match(capability, /ensureRuntimeChainNativeAssetContext/);
assert.match(displayAdapter, /nativeAssetContext/);
assert.match(displayAdapter, /Native asset:/);
assert.match(
  providerApprovalPreview,
  /buildRequestedRuntimeChainDisplayContext/,
);
assert.match(
  providerApprovalPreview,
  /buildSuggestedRuntimeChainDisplayContextFromInfo/,
);

console.log('runtime chain native asset gate verification passed');
