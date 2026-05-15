import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const runtimeAdapter = await read('../src/cosmos/chains/runtimeChainAdapter.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');

assert.match(capability, /const buildRuntimeSendCapabilitySupport =/);
assert.match(
  capability,
  /const buildRuntimeSendCapabilitySupport =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeSendPreconditions/s,
);
assert.match(capability, /sendFlowContext: buildRuntimeSendCapabilitySupport/);
assert.match(capability, /'missing_send_context'/);
assert.match(capability, /'not_persisted_runtime_candidate'/);

assert.match(runtimeAdapter, /ensureRuntimeExecutableSendFlowContext/);

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
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext\(chain, 'popup send'\)/);

console.log('suggested chain send flow context upgrade verification passed');
