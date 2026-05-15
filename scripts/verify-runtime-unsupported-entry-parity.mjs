import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const adapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const controllerShared = await read(
  '../src/entrypoints/background/controller/provider/controllerShared.ts',
);
const keyringIndex = await read(
  '../src/entrypoints/background/service/keyring/index.ts',
);
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');

assert.match(capability, /export const buildRuntimeUnsupportedEntryDetails =/);
assert.match(capability, /source: source \|\| 'custom',/);
assert.match(capability, /persisted: persisted \?\? false,/);
assert.match(capability, /runtimeStatus: runtimeStatus \|\| 'unsupported',/);
assert.match(capability, /export const buildRuntimeUnsupportedEntryError =/);
assert.match(capability, /error\.data = details;/);
assert.match(capability, /error\.runtimeUnsupported = details;/);

assert.match(adapter, /buildRuntimeUnsupportedEntryDetails,/);
assert.match(adapter, /buildRuntimeUnsupportedEntryError,/);

assert.match(
  controllerShared,
  /getChainSourceByChainId/,
);
assert.match(
  controllerShared,
  /getRuntimeChainInterpretationByChainId/,
);
assert.match(
  controllerShared,
  /from '@\/cosmos\/chains\/chainRepository';/,
);
assert.match(
  controllerShared,
  /buildRuntimeUnsupportedEntryDetails/,
);
assert.match(
  controllerShared,
  /getRuntimeUnsupportedErrorData/,
);
assert.match(
  controllerShared,
  /from '@\/cosmos\/chains\/runtimeChainAdapter';/,
);
assert.match(
  controllerShared,
  /buildRuntimeUnsupportedProviderErrorInput\(chainId, undefined\)/,
);
assert.match(
  controllerShared,
  /data:\s*buildRuntimeUnsupportedEntryDetails\(\{/,
);

assert.match(keyringIndex, /buildRuntimeUnsupportedEntryError,/);
assert.match(keyringIndex, /getRuntimeUnsupportedErrorData/);
assert.match(
  keyringIndex,
  /private buildRuntimeUnsupportedChainError = async \(/,
);
assert.match(
  keyringIndex,
  /private normalizeRuntimeUnsupportedChainError = async \(/,
);
assert.match(
  keyringIndex,
  /if \(getRuntimeUnsupportedErrorData\(error\)\) \{\s*return error;\s*\}/,
);
assert.match(
  keyringIndex,
  /error instanceof Error &&\s*error\.message === `Unsupported chain: \$\{chainId\}`/,
);
for (const method of [
  'getCosmosNativeBalance',
  'getCosmosTokenBalances',
  'getCosmosStakingSummary',
  'getCosmosAssetSnapshot',
  'getCosmosTxHistory',
  'getCosmosNativePriceUsd',
]) {
  assert.match(
    keyringIndex,
    new RegExp(
      `${method}\\s*=\\s*async[\\s\\S]*?normalizeRuntimeUnsupportedChainError\\(chainId, error\\)`,
    ),
  );
}
assert.match(
  keyringIndex,
  /buildRuntimeUnsupportedChainError\(\s*chainId,\s*`Unsupported chain: \$\{chainId\}`/,
);

assert.match(sendFlowFacade, /buildRuntimeUnsupportedEntryError/);
assert.match(
  sendFlowFacade,
  /buildRuntimeUnsupportedChainError\(chainId,\s*'Unsupported chain'\)/,
);
assert.match(
  sendFlowFacade,
  /buildRuntimeUnsupportedChainError\(\s*token\.chainId,\s*`Unsupported chain: \$\{token\.chainId\}`/,
);

assert.match(cosmosSend, /buildRuntimeUnsupportedEntryError/);
assert.match(
  cosmosSend,
  /buildRuntimeUnsupportedChainError\(\s*token\.chainId,\s*`Unsupported chain: \$\{token\.chainId\}`/,
);

console.log('runtime unsupported entry parity verification passed');
