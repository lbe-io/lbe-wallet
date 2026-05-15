import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(approvalPreview, /requestedChainTitle\?: string/);
assert.match(approvalPreview, /requestedChainSubtitle\?: string/);
assert.match(approvalPreview, /requestedNativeAssetLabel\?: string/);
assert.match(approvalPreview, /requestedNativeAssetExplanation\?: string/);
assert.match(approvalPreview, /requestedChainDisplay\.nativeAssetDisplay/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(approvalPreview, /requestedChainTitle: suggestedPreviewProps\?\.requestedChainTitle \|\| requestedChainDisplay\.chainTitle/);

assert.match(connectApproval, /requestedChainTitle/);
assert.match(connectApproval, /requestedNativeAssetExplanation/);
assert.match(connectApproval, /setChainDisplayTitle/);

console.log('custom chain approval preview native asset upgrade verification passed');
