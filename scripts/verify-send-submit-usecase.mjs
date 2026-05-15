import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const facade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');

assert.match(facade, /submitSendFlow = async/);
assert.match(facade, /sendCosmosToken\(/);
assert.match(facade, /refreshCosmosAccountAssets\(/);
assert.match(facade, /EVENTS\.COSMOS_ASSET_REFRESH/);
assert.match(facade, /buildPopupSendFeePolicy/);
assert.match(cosmosSend, /buildPopupSendTxRequest/);
assert.match(cosmosSend, /buildPopupSendTxPreview/);
assert.match(cosmosSend, /toPopupSendTxResult/);
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);
assert.match(cosmosSend, /createWalletDirectSigner/);
assert.match(cosmosSend, /SigningStargateClient\.connectWithSigner/);
assert.match(cosmosSend, /client\.signAndBroadcast/);

console.log('send submit usecase verification passed');
