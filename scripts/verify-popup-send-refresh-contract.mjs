import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const sendInfoViewModel = await read('../src/popup/hooks/useSendInfoViewModel.ts');

assert.match(cosmosSend, /SigningStargateClient\.connectWithSigner/);
assert.match(cosmosSend, /signAndBroadcast/);
assert.match(cosmosSend, /buildPopupSendTxRequest/);
assert.match(cosmosSend, /buildPopupSendTxPreview/);
assert.doesNotMatch(cosmosSend, /wallet\.sendCosmosTx\(/, 'popup send should remain on the native popup send path');

assert.match(sendFlowFacade, /buildPopupSendFeePolicy/);
assert.match(sendFlowFacade, /sendCosmosToken\(/);
assert.match(sendFlowFacade, /refreshCosmosAccountAssets\(/);
assert.match(sendFlowFacade, /EVENTS\.COSMOS_ASSET_REFRESH/);

assert.match(sendInfoViewModel, /submitSendFlow\(/);

console.log('popup send refresh contract verification passed');
