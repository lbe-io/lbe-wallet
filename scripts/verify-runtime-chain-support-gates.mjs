import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const fetchWalletData = await read('../src/popup/hooks/useFetchWalletData.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');
const assetQueryService = await read('../src/entrypoints/background/service/keyring/assetQueryService.ts');
const txHistoryQueryService = await read('../src/entrypoints/background/service/keyring/txHistoryQueryService.ts');
const stakingQueryService = await read('../src/entrypoints/background/service/keyring/stakingQueryService.ts');
const priceQueryService = await read('../src/entrypoints/background/service/keyring/priceQueryService.ts');
const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');

assert.match(capability, /ensureRuntimeExecutableSendFlowContext/);
assert.match(capability, /ensureRuntimeExecutableQueryContext/);
assert.match(capability, /ensureRuntimeProviderAccountReadContext/);
assert.match(capability, /ensureRuntimeProviderSignAminoContext/);
assert.match(capability, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(capability, /ensureRuntimeProviderSendTxContext/);
assert.match(capability, /ensureRuntimeProviderSignDirectContext/);
assert.match(capability, /ensureRuntimeChainSendFlowContext =/);
assert.match(capability, /ensureRuntimeChainQueryContext =/);

assert.match(sendFlowFacade, /ensureRuntimeExecutableSendFlowContext/);
assert.match(sendFlowFacade, /ensureRuntimeChainApprovalDisplayContext/);
assert.match(sendFlowFacade, /hasRuntimeChainCapability/);

assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);

assert.match(fetchWalletData, /ensureRuntimeChainHydrationContext/);
assert.match(fetchWalletData, /hasRuntimeChainCapability/);
assert.match(fetchWalletData, /'hydrationContext'/);

assert.match(connectApproval, /ensureRuntimeChainApprovalDisplayContext/);
assert.match(connectApproval, /hasRuntimeChainCapability/);

for (const source of [
  assetQueryService,
  txHistoryQueryService,
  stakingQueryService,
  priceQueryService,
]) {
  assert.match(source, /ensureRuntimeExecutableQueryContext/);
}

console.log('runtime chain support gates verification passed');
