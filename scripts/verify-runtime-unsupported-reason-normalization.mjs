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

assert.match(capability, /export type RuntimeUnsupportedDetails = \{/);
assert.match(capability, /source: ChainSourceKind;/);
assert.match(capability, /persisted: boolean;/);
assert.match(capability, /runtimeStatus: RuntimeChainStatus;/);
assert.match(capability, /unsupportedReason: RuntimeUnsupportedReason;/);
assert.match(capability, /export type RuntimeUnsupportedError = Error & \{/);
assert.match(capability, /data\?: RuntimeUnsupportedDetails;/);
assert.match(capability, /runtimeUnsupported\?: RuntimeUnsupportedDetails;/);

assert.match(capability, /export const buildRuntimeUnsupportedDetails =/);
assert.match(capability, /export const buildRuntimeUnsupportedEntryDetails =/);
assert.match(capability, /export const buildRuntimeUnsupportedEntryError =/);
assert.match(capability, /export const getRuntimeUnsupportedErrorData =/);
assert.match(capability, /error\.data = details;/);
assert.match(capability, /error\.runtimeUnsupported = details;/);
assert.match(
  capability,
  /Chain "\$\{interpretation\.chainId\}" cannot be used for \$\{capability\}: \$\{reason\}/,
);

assert.match(adapter, /RuntimeUnsupportedDetails,/);
assert.match(adapter, /RuntimeUnsupportedError,/);
assert.match(adapter, /buildRuntimeUnsupportedEntryDetails,/);
assert.match(adapter, /buildRuntimeUnsupportedEntryError,/);
assert.match(adapter, /buildRuntimeUnsupportedDetails,/);
assert.match(adapter, /getRuntimeUnsupportedErrorData,/);

assert.match(
  controllerShared,
  /from '@\/cosmos\/chains\/runtimeChainAdapter';/,
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
  /const buildRuntimeUnsupportedProviderErrorInput = async \(/,
);
assert.match(
  controllerShared,
  /const normalizedData = getRuntimeUnsupportedErrorData\(error\);/,
);
assert.match(
  controllerShared,
  /data: buildRuntimeUnsupportedEntryDetails\(\{\s*source: chainSource\?\.source,\s*persisted: chainSource\?\.persisted,\s*\}\),/,
);

assert.match(
  keyringIndex,
  /buildRuntimeUnsupportedEntryError,/,
);
assert.match(
  keyringIndex,
  /getRuntimeUnsupportedErrorData/,
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
assert.match(
  keyringIndex,
  /throw await this\.normalizeRuntimeUnsupportedChainError\(chainId, error\);/,
);
assert.match(
  keyringIndex,
  /ensureRuntimeExecutableQueryContext\(\s*runtimeChain,\s*'stargate query client',?\s*\)/,
);
assert.match(
  keyringIndex,
  /ensureRuntimeProviderSendTxContext\(\s*runtimeChain,\s*'provider sendTx broadcast',?\s*\)/,
);
assert.match(
  sendFlowFacade,
  /buildRuntimeUnsupportedEntryError\(/,
);
assert.match(
  sendFlowFacade,
  /ensureRuntimeExecutableSendFlowContext\(chain, 'send address validation'\)/,
);
assert.match(
  sendFlowFacade,
  /ensureRuntimeExecutableSendFlowContext\(runtimeChain, 'send fee preview'\)/,
);
assert.match(
  cosmosSend,
  /buildRuntimeUnsupportedEntryError\(/,
);
assert.match(
  cosmosSend,
  /ensureRuntimeExecutableSendFlowContext\(chain, 'popup send'\)/,
);

console.log('runtime unsupported reason normalization verification passed');
