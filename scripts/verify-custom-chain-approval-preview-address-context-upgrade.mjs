import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(approvalPreview, /requestedAddressLabel\?: string/);
assert.match(approvalPreview, /requestedAddressSourceText\?: string/);
assert.match(approvalPreview, /requestedAddressTitle\?: string/);
assert.match(approvalPreview, /requestedAddressSubtitle\?: string/);
assert.match(approvalPreview, /requestedAddressExplanation\?: string/);
assert.match(approvalPreview, /requestedAddressDisplay/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(approvalPreview, /requestedAddressExplanation: suggestedPreviewProps\?\.requestedAddressExplanation \|\| requestedAddressDisplay\?\.previewExplanation/);

assert.match(connectApproval, /requestedAddressExplanation/);
assert.match(connectApproval, /requestedAddressLabel/);

console.log('custom chain approval preview address context upgrade verification passed');
