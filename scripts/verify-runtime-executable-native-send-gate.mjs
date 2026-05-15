import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const signerResolver = await read(
  '../src/entrypoints/background/service/keyring/signerResolver.ts',
);
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const txHandlers = await read(
  '../src/entrypoints/background/controller/provider/txHandlers.ts',
);
const txBroadcastService = await read(
  '../src/entrypoints/background/service/keyring/txBroadcastService.ts',
);
const signingHandlers = await read(
  '../src/entrypoints/background/controller/provider/signingHandlers.ts',
);

assert.match(
  signerResolver,
  /ensureRuntimeSignerChainContext\(\s*chainId,\s*'popup native send signer',\s*ensureRuntimeExecutableSendFlowContext/s,
);
assert.match(
  signerResolver,
  /ensureRuntimeChainAddressContext\(\s*guard\(runtimeChain,\s*usage\),\s*usage/s,
);
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext\(chain, 'popup send'\)/);

assert.doesNotMatch(txHandlers, /ensureRuntimeExecutableSendFlowContext/);
assert.match(signingHandlers, /ensureSupportedChain/);
assert.doesNotMatch(signingHandlers, /ensureRuntimeExecutableSendFlowContext/);
assert.match(txBroadcastService, /getCosmosChainConfig/);
assert.doesNotMatch(txBroadcastService, /getRuntimeChainInterpretationByChainId/);

console.log('runtime executable native send gate verification passed');
