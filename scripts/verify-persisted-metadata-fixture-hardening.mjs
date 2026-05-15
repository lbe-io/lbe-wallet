import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const transpile = async (relativePath, fileName) => {
  const source = await fs.readFile(new URL(relativePath, import.meta.url), 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
};

const buildCosmosBech32Config = (prefix) => ({
  bech32PrefixAccAddr: prefix,
  bech32PrefixAccPub: `${prefix}pub`,
  bech32PrefixValAddr: `${prefix}valoper`,
  bech32PrefixValPub: `${prefix}valoperpub`,
  bech32PrefixConsAddr: `${prefix}valcons`,
  bech32PrefixConsPub: `${prefix}valconspub`,
});

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const tempDir = await fs.mkdtemp(
  path.join(scriptDir, '.persisted-metadata-fixture-hardening-'),
);

const customRuntimePolicySource = (await transpile(
  '../src/cosmos/chains/customChainRuntimePolicy.ts',
  'customChainRuntimePolicy.ts',
))
  .replace(
    /from ['"]@cosmjs\/encoding['"];/,
    "from './encoding.stub.mjs';",
  );
await fs.writeFile(
  path.join(tempDir, 'customChainRuntimePolicy.mjs'),
  customRuntimePolicySource,
  'utf8',
);

const suggestedChainSourceSource = (await transpile(
  '../src/cosmos/chains/suggestedChainSource.ts',
  'suggestedChainSource.ts',
))
  .replace(
    /from ['"]@\/cosmos\/storage['"];/,
    "from './storage.stub.mjs';",
  )
  .replace(
    /from ['"]\.\/chainMetadataAdapter['"];/,
    "from './chainMetadataAdapter.stub.mjs';",
  );

await fs.writeFile(
  path.join(tempDir, 'suggestedChainSource.mjs'),
  suggestedChainSourceSource,
  'utf8',
);
await fs.writeFile(
  path.join(tempDir, 'storage.stub.mjs'),
  'export const getChainByChainId = async () => [];\n',
  'utf8',
);
await fs.writeFile(
  path.join(tempDir, 'chainMetadataAdapter.stub.mjs'),
  `export const buildCosmosBech32Config = ${buildCosmosBech32Config.toString()};\n`,
  'utf8',
);
await fs.writeFile(
  path.join(tempDir, 'encoding.stub.mjs'),
  "export const fromBech32 = (value) => ({ prefix: String(value || '').split('1')[0] || '' });\n",
  'utf8',
);

const customRuntimePolicy = await import(
  pathToFileURL(path.join(tempDir, 'customChainRuntimePolicy.mjs')).href
);
const suggestedChainSource = await import(
  pathToFileURL(path.join(tempDir, 'suggestedChainSource.mjs')).href
);

const runtimeAdapterSource = await fs.readFile(
  new URL('../src/cosmos/chains/runtimeChainAdapter.ts', import.meta.url),
  'utf8',
);

const {
  hasPersistedCustomRuntimeMetadataEnvelope,
  resolvePersistedCustomChainAddressDerivationContext,
  resolvePersistedCustomChainRestContext,
  resolvePersistedCustomChainGasPriceStep,
  resolvePersistedCustomChainNativeAssetContext,
} = customRuntimePolicy;

const {
  hasPersistedSuggestedMetadataEnvelope,
  isPersistedSuggestedChainRecord,
  toPersistedSuggestedChainSourceEntry,
  resolvePersistedSuggestedMetadataUnsupportedReason,
} = suggestedChainSource;

const validCurrentCustom = {
  chainId: 'custom-current-1',
  rpc: 'https://rpc.custom-current.example',
  type: JSON.stringify({
    bech32Prefix: 'cosmos',
    coinType: 118,
    rest: 'https://rest.custom-current.example',
    coinDenom: 'ATOM',
    coinMinimalDenom: 'uatom',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.04,
    },
  }),
  token: 'uatom',
  symbol: 'ATOM',
  decimals: '6',
};

assert.equal(hasPersistedCustomRuntimeMetadataEnvelope(validCurrentCustom), true);
assert.deepEqual(
  resolvePersistedCustomChainAddressDerivationContext({
    chainRecord: validCurrentCustom,
  }),
  {
    bech32Prefix: 'cosmos',
    coinType: 118,
  },
);
assert.equal(
  resolvePersistedCustomChainRestContext(validCurrentCustom),
  'https://rest.custom-current.example',
);
assert.deepEqual(
  resolvePersistedCustomChainGasPriceStep(validCurrentCustom),
  {
    low: 0.01,
    average: 0.025,
    high: 0.04,
  },
);
assert.deepEqual(
  resolvePersistedCustomChainNativeAssetContext(validCurrentCustom),
  {
    symbol: 'ATOM',
    minimalDenom: 'uatom',
    decimals: 6,
  },
);

const validLegacyCustom = {
  chainId: 'custom-legacy-1',
  rpc: 'https://rpc.custom-legacy.example',
  type: JSON.stringify({
    bech32Prefix: 'osmo',
    coinType: 118,
    lcd: 'https://lcd.custom-legacy.example',
    feeCurrency: {
      gasPriceStep: {
        low: 0.0025,
        average: 0.003,
        high: 0.004,
      },
    },
  }),
  token: 'uosmo',
  symbol: 'OSMO',
  decimals: '6',
};

assert.equal(hasPersistedCustomRuntimeMetadataEnvelope(validLegacyCustom), true);
assert.deepEqual(
  resolvePersistedCustomChainAddressDerivationContext({
    chainRecord: validLegacyCustom,
  }),
  {
    bech32Prefix: 'osmo',
    coinType: 118,
  },
);
assert.equal(
  resolvePersistedCustomChainRestContext(validLegacyCustom),
  'https://lcd.custom-legacy.example',
);
assert.deepEqual(
  resolvePersistedCustomChainGasPriceStep(validLegacyCustom),
  {
    low: 0.0025,
    average: 0.003,
    high: 0.004,
  },
);
assert.deepEqual(
  resolvePersistedCustomChainNativeAssetContext(validLegacyCustom),
  {
    symbol: 'OSMO',
    minimalDenom: 'uosmo',
    decimals: 6,
  },
);

const malformedJsonCustom = {
  chainId: 'custom-bad-json-1',
  rpc: 'https://rpc.custom-bad-json.example',
  type: '{"bech32Prefix":"cosmos","coinType":118',
  token: 'uatom',
  symbol: 'ATOM',
  decimals: '6',
};

assert.equal(
  hasPersistedCustomRuntimeMetadataEnvelope(malformedJsonCustom),
  false,
);
assert.equal(
  resolvePersistedCustomChainAddressDerivationContext({
    chainRecord: malformedJsonCustom,
  }),
  null,
);
assert.equal(resolvePersistedCustomChainRestContext(malformedJsonCustom), null);
assert.equal(
  resolvePersistedCustomChainGasPriceStep(malformedJsonCustom),
  null,
);
assert.equal(
  resolvePersistedCustomChainNativeAssetContext(malformedJsonCustom),
  null,
);

const invalidFieldCustom = {
  chainId: 'custom-invalid-fields-1',
  rpc: 'https://rpc.custom-invalid-fields.example',
  type: JSON.stringify({
    bech32Prefix: '',
    coinType: '',
    gasPriceStep: {
      low: 0.01,
      average: 0.02,
      high: 0.03,
    },
  }),
  token: '',
  symbol: '',
  decimals: '-1',
};

assert.equal(
  resolvePersistedCustomChainAddressDerivationContext({
    chainRecord: invalidFieldCustom,
  }),
  null,
);
assert.equal(resolvePersistedCustomChainRestContext(invalidFieldCustom), null);
assert.deepEqual(
  resolvePersistedCustomChainGasPriceStep(invalidFieldCustom),
  {
    low: 0.01,
    average: 0.02,
    high: 0.03,
  },
);
assert.equal(
  resolvePersistedCustomChainNativeAssetContext(invalidFieldCustom),
  null,
);

const validCurrentSuggested = {
  chainId: 'suggested-current-1',
  name: 'Suggested Current',
  rpc: 'https://rpc.suggested-current.example',
  symbol: 'ATOM',
  token: 'uatom',
  decimals: '6',
  type: JSON.stringify({
    runtimeSource: 'suggested',
    chainInfo: {
      chainId: 'suggested-current-1',
      chainName: 'Suggested Current',
      rpc: 'https://rpc.suggested-current.example',
      rest: 'https://rest.suggested-current.example',
      stakeCurrency: {
        coinDenom: 'ATOM',
        coinMinimalDenom: 'uatom',
        coinDecimals: 6,
      },
      bip44: {
        coinType: 118,
      },
      bech32Config: buildCosmosBech32Config('cosmos'),
      currencies: [
        {
          coinDenom: 'ATOM',
          coinMinimalDenom: 'uatom',
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: 'ATOM',
          coinMinimalDenom: 'uatom',
          coinDecimals: 6,
          gasPriceStep: {
            low: 0.01,
            average: 0.025,
            high: 0.04,
          },
        },
      ],
      features: ['stargate'],
    },
  }),
};

assert.equal(
  hasPersistedSuggestedMetadataEnvelope(validCurrentSuggested),
  true,
);
assert.equal(isPersistedSuggestedChainRecord(validCurrentSuggested), true);
const validCurrentSuggestedEntry =
  toPersistedSuggestedChainSourceEntry(validCurrentSuggested);
assert.equal(validCurrentSuggestedEntry?.source, 'suggested');
assert.equal(validCurrentSuggestedEntry?.persisted, true);
assert.equal(
  validCurrentSuggestedEntry?.chainInfo.chainId,
  'suggested-current-1',
);
assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(validCurrentSuggested),
  undefined,
);

const validLegacySuggested = {
  chainId: 'suggested-legacy-1',
  name: 'Suggested Legacy',
  rpc: 'https://rpc.suggested-legacy.example',
  symbol: 'OSMO',
  token: 'uosmo',
  decimals: '6',
  type: JSON.stringify({
    source: 'suggested',
    chainInfo: {
      chainId: 'suggested-legacy-1',
      chainName: 'Suggested Legacy',
      rest: 'https://rest.suggested-legacy.example',
      bip44: {
        coinType: 118,
      },
      bech32Config: buildCosmosBech32Config('osmo'),
    },
  }),
};

assert.equal(
  hasPersistedSuggestedMetadataEnvelope(validLegacySuggested),
  true,
);
const validLegacySuggestedEntry =
  toPersistedSuggestedChainSourceEntry(validLegacySuggested);
assert.equal(validLegacySuggestedEntry?.source, 'suggested');
assert.equal(
  validLegacySuggestedEntry?.chainInfo.rpc,
  'https://rpc.suggested-legacy.example',
);
assert.deepEqual(validLegacySuggestedEntry?.chainInfo.stakeCurrency, {
  coinDenom: 'OSMO',
  coinMinimalDenom: 'uosmo',
  coinDecimals: 6,
});
assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(validLegacySuggested),
  undefined,
);

const malformedSuggestedWithMarker = {
  chainId: 'suggested-bad-json-1',
  name: 'Suggested Bad Json',
  rpc: 'https://rpc.suggested-bad-json.example',
  symbol: 'ATOM',
  token: 'uatom',
  decimals: '6',
  type: '{"runtimeSource":"suggested","chainInfo":',
};

assert.equal(
  hasPersistedSuggestedMetadataEnvelope(malformedSuggestedWithMarker),
  true,
);
assert.equal(isPersistedSuggestedChainRecord(malformedSuggestedWithMarker), true);
const malformedSuggestedEntry = toPersistedSuggestedChainSourceEntry(
  malformedSuggestedWithMarker,
);
assert.equal(malformedSuggestedEntry?.source, 'suggested');
assert.equal(malformedSuggestedEntry?.persisted, true);
assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(
    malformedSuggestedWithMarker,
  ),
  'missing_address_metadata',
);

const missingAddressSuggested = {
  chainId: 'suggested-missing-address-1',
  name: 'Suggested Missing Address',
  rpc: 'https://rpc.suggested-missing-address.example',
  symbol: 'ATOM',
  token: 'uatom',
  decimals: '6',
  type: JSON.stringify({
    runtimeSource: 'suggested',
    chainInfo: {
      chainId: 'suggested-missing-address-1',
      chainName: 'Suggested Missing Address',
      rpc: 'https://rpc.suggested-missing-address.example',
      rest: 'https://rest.suggested-missing-address.example',
      stakeCurrency: {
        coinDenom: 'ATOM',
        coinMinimalDenom: 'uatom',
        coinDecimals: 6,
      },
      bip44: {},
      bech32Config: {},
    },
  }),
};

assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(missingAddressSuggested),
  'missing_address_metadata',
);

const invalidNativeAssetSuggested = {
  chainId: 'suggested-invalid-native-1',
  name: 'Suggested Invalid Native',
  rpc: 'https://rpc.suggested-invalid-native.example',
  symbol: '',
  token: '',
  decimals: '-1',
  type: JSON.stringify({
    runtimeSource: 'suggested',
    chainInfo: {
      chainId: 'suggested-invalid-native-1',
      chainName: 'Suggested Invalid Native',
      rpc: 'https://rpc.suggested-invalid-native.example',
      rest: 'https://rest.suggested-invalid-native.example',
      stakeCurrency: {
        coinDenom: 'BROKEN',
        coinMinimalDenom: 'ubroken',
        coinDecimals: -1,
      },
      bip44: {
        coinType: 118,
      },
      bech32Config: buildCosmosBech32Config('broken'),
    },
  }),
};

assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(
    invalidNativeAssetSuggested,
  ),
  'missing_native_asset_metadata',
);

const missingTransportSuggested = {
  chainId: 'suggested-missing-transport-1',
  name: 'Suggested Missing Transport',
  rpc: 'ftp://rpc.suggested-missing-transport.example',
  symbol: 'ATOM',
  token: 'uatom',
  decimals: '6',
  type: JSON.stringify({
    runtimeSource: 'suggested',
    chainInfo: {
      chainId: 'suggested-missing-transport-1',
      chainName: 'Suggested Missing Transport',
      rpc: 'ftp://rpc.suggested-missing-transport.example',
      rest: '',
      stakeCurrency: {
        coinDenom: 'ATOM',
        coinMinimalDenom: 'uatom',
        coinDecimals: 6,
      },
      bip44: {
        coinType: 118,
      },
      bech32Config: buildCosmosBech32Config('cosmos'),
    },
  }),
};

assert.equal(
  resolvePersistedSuggestedMetadataUnsupportedReason(
    missingTransportSuggested,
  ),
  'missing_runtime_transport',
);

assert.match(
  runtimeAdapterSource,
  /resolvePersistedSuggestedMetadataUnsupportedReason/,
);
assert.match(
  runtimeAdapterSource,
  /unsupportedReason: entry\.persisted\s*\?\s*resolvePersistedSuggestedMetadataUnsupportedReason\(entry\.chainRecord\)\s*:\s*'suggested_chain_not_persisted'/,
);

console.log('persisted metadata fixture hardening verification passed');
