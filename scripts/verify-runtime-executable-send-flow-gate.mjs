import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const txHandlers = await read(
  '../src/entrypoints/background/controller/provider/txHandlers.ts',
);
const txBroadcastService = await read(
  '../src/entrypoints/background/service/keyring/txBroadcastService.ts',
);

assert.match(capability, /ensureRuntimeExecutableSendFlowContext/);
assert.match(
  capability,
  /ensureRuntimeChainSendFlowContext\s*=\s*ensureRuntimeExecutableSendFlowContext/,
);

assert.match(sendFlowFacade, /ensureRuntimeExecutableSendFlowContext/);
assert.match(
  sendFlowFacade,
  /ensureRuntimeExecutableSendFlowContext\(chain, 'send address validation'\)/,
);
assert.match(
  sendFlowFacade,
  /ensureRuntimeExecutableSendFlowContext\(runtimeChain, 'send fee preview'\)/,
);

assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);
assert.match(
  cosmosSend,
  /ensureRuntimeExecutableSendFlowContext\(chain, 'popup send'\)/,
);

assert.doesNotMatch(txHandlers, /ensureRuntimeExecutableSendFlowContext/);
assert.match(txBroadcastService, /getCosmosChainConfig/);
assert.doesNotMatch(txBroadcastService, /getRuntimeChainInterpretationByChainId/);

console.log('runtime executable send flow gate verification passed');
