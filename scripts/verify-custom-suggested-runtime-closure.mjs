import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const fetchWalletData = await read('../src/popup/hooks/useFetchWalletData.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');
const chainInfoHandlers = await read('../src/entrypoints/background/controller/provider/chainInfoHandlers.ts');

assert.match(sendFlowFacade, /getRuntimeChainInterpretationByChainId/);
assert.match(sendFlowFacade, /ensureRuntimeExecutableSendFlowContext/);
assert.match(sendFlowFacade, /ensureRuntimeChainApprovalDisplayContext/);
assert.match(sendFlowFacade, /hasRuntimeChainCapability/);
assert.doesNotMatch(sendFlowFacade, /getCosmosChainConfig\(/);

assert.match(cosmosSend, /getRuntimeChainInterpretationByChainId/);
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);
assert.match(cosmosSend, /ensureRuntimeChainAddressContext/);
assert.match(cosmosSend, /ensureRuntimeChainNativeAssetContext/);
assert.match(cosmosSend, /ensureRuntimeChainRpcContext/);
assert.doesNotMatch(cosmosSend, /getCosmosChainConfig\(/);

assert.match(fetchWalletData, /getRuntimeChainInterpretationByChainId/);
assert.match(fetchWalletData, /ensureRuntimeChainHydrationContext/);
assert.match(fetchWalletData, /hasRuntimeChainCapability/);

assert.match(connectApproval, /getRuntimeChainInterpretationByChainId/);
assert.match(connectApproval, /ensureRuntimeChainApprovalDisplayContext/);
assert.doesNotMatch(connectApproval, /getCosmosChainConfig\(/);

assert.match(chainInfoHandlers, /buildSuggestedRuntimeChainInterpretationByInfo/);

console.log('custom suggested runtime closure verification passed');
