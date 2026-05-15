import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const customRuntimePolicy = await read(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
);
const runtimeAdapter = await read(
  '../src/cosmos/chains/runtimeChainAdapter.ts',
);
const displayAdapter = await read(
  '../src/cosmos/chains/runtimeChainDisplayAdapter.ts',
);
const nativeAssetDisplayAdapter = await read(
  '../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts',
);

assert.match(
  customRuntimePolicy,
  /resolvePersistedCustomChainNativeAssetContext/,
);
assert.match(
  customRuntimePolicy,
  /canSelectivelyUpgradeCustomChainNativeAssetContext/,
);
assert.match(customRuntimePolicy, /new URL\(value\)/);
assert.match(customRuntimePolicy, /coinMinimalDenom/);
assert.match(customRuntimePolicy, /coinDenom/);
assert.match(customRuntimePolicy, /coinDecimals/);
assert.match(customRuntimePolicy, /chainRecord\.token/);
assert.match(customRuntimePolicy, /chainRecord\.symbol/);
assert.match(customRuntimePolicy, /chainRecord\.decimals/);

assert.match(
  runtimeAdapter,
  /resolvePersistedCustomChainNativeAssetContext/,
);
assert.match(
  runtimeAdapter,
  /nativeAssetContext:\s*options\?\.nativeAssetContext !== undefined/,
);
assert.match(
  runtimeAdapter,
  /const nativeAssetContext = resolvePersistedCustomChainNativeAssetContext/,
);

assert.match(displayAdapter, /resolveLegacyNativeAssetTitle/);
assert.match(displayAdapter, /nativeAssetDisplay/);
assert.match(displayAdapter, /nativeAssetContext/);
assert.match(
  nativeAssetDisplayAdapter,
  /buildRuntimeChainNativeAssetDisplayContext/,
);
assert.match(
  nativeAssetDisplayAdapter,
  /Custom chain native asset fallback uses/,
);

console.log('custom chain native asset capability upgrade verification passed');
