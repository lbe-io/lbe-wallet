import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const txHandlers = await read('../src/entrypoints/background/controller/provider/txHandlers.ts');
const approvalPage = await read('../src/popup/app/approval/component/CosmosSendTx/index.tsx');
const txPreviewAdapter = await read('../src/cosmos/tx/txPreviewAdapter.ts');
const txContract = await read('../src/cosmos/tx/txContract.ts');

assert.match(approvalPreview, /decodeTxPreview\(payload\.txBytes.*payload\.mode\)/s);
assert.match(approvalPreview, /buildFallbackSendTxApprovalPreview/);
assert.match(approvalPage, /decodeTxPreview\(params\?\.data\?\.txBytes,\s*params\?\.data\?\.mode\)/);
assert.match(approvalPage, /buildFallbackSendTxApprovalPreview/);

assert.match(txPreviewAdapter, /SendTxApprovalPreview/);
assert.match(txPreviewAdapter, /feePolicy/);

assert.match(txHandlers, /buildProviderBroadcastTxRequest/);
assert.match(txHandlers, /ensureProviderSendTxChain/);
assert.match(txHandlers, /wallet\.sendCosmosProviderTx\(\s*txRequest\.chainId,\s*txRequest\.txBytes,\s*txRequest\.mode,?\s*\)/);
assert.match(txContract, /export type ProviderBroadcastTxRequest/);
assert.match(txContract, /export const normalizeTxBroadcastMode/);

console.log('provider sendTx preview contract verification passed');
