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
const chainRepository = await read(
  '../src/cosmos/chains/chainRepository.ts',
);

assert.match(
  customRuntimePolicy,
  /resolvePersistedCustomChainAddressDerivationContext/,
);
assert.match(
  customRuntimePolicy,
  /canSelectivelyUpgradeCustomChainAddressDerivation/,
);
assert.match(customRuntimePolicy, /new URL\(value\)/);
assert.match(customRuntimePolicy, /fromBech32/);
assert.match(customRuntimePolicy, /coinType/);
assert.match(
  customRuntimePolicy,
  /typeMetadata = parseCustomChainTypeMetadata/,
);

assert.match(
  runtimeAdapter,
  /buildPersistedCustomRuntimeChainInterpretation/,
);
assert.match(
  runtimeAdapter,
  /resolvePersistedCustomChainAddressDerivationContext/,
);
assert.match(
  runtimeAdapter,
  /addressContext: options\?\.addressContext \|\| null/,
);

assert.match(chainRepository, /getAllAddresses/);
assert.match(
  chainRepository,
  /buildPersistedCustomRuntimeChainInterpretation/,
);
assert.match(
  chainRepository,
  /filter\(\(address\) => address\.chainId === source\.chainId\)/,
);

console.log('custom chain address derivation upgrade verification passed');
