import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const feeContract = await read('../src/cosmos/tx/feePreviewContract.ts');
const previewAdapter = await read('../src/cosmos/tx/txPreviewAdapter.ts');
const approvalPreviewShared = await read('../src/shared/utils/approvalPreviewShared.ts');
const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');
const cosmosSendTxApproval = await read('../src/popup/app/approval/component/CosmosSendTx/index.tsx');
const approvalUi = await read('../src/popup/types/approvalUi.ts');

assert.match(feeContract, /export type TxFeePolicy\b/);
assert.match(feeContract, /export const buildTxFeePolicy\b/);
assert.match(feeContract, /export const buildPopupSendFeePolicy\b/);
assert.match(feeContract, /export const buildDecodedTxFeePolicy\b/);
assert.match(previewAdapter, /export type TxPreviewModel\b/);
assert.match(previewAdapter, /export const buildDecodedTxPreview\b/);
assert.match(previewAdapter, /export const buildPopupSendTxPreview\b/);
assert.match(previewAdapter, /export const toSendTxApprovalPreview\b/);
assert.match(previewAdapter, /export const buildFallbackSendTxApprovalPreview\b/);

assert.match(approvalPreviewShared, /from ['"]@\/cosmos\/tx\/txPreviewAdapter['"]/);
assert.match(approvalPreviewShared, /buildDecodedTxPreview\(/);
assert.match(approvalPreviewShared, /toSendTxApprovalPreview\(/);

assert.match(approvalPreview, /decodeTxPreview\(/);
assert.match(approvalPreview, /buildCosmosSendTxApprovalParams/);
assert.match(approvalPreview, /buildFallbackSendTxApprovalPreview/);

assert.match(cosmosSend, /buildPopupSendTxPreview\(/);
assert.match(sendFlowFacade, /buildPopupSendFeePolicy\(/);
assert.match(cosmosSendTxApproval, /buildFallbackSendTxApprovalPreview\(/);
assert.match(approvalUi, /preview\.feePolicy === undefined \|\| isTxFeePolicy\(preview\.feePolicy\)/);

console.log('tx preview fee contract verification passed');
