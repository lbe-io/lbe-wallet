import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const nativeAssetDisplayAdapter = await read('../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts');
const addressDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddressDisplayAdapter.ts');
const suggestedCopy = await read('../src/cosmos/chains/suggestedChainDisplayCopy.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(nativeAssetDisplayAdapter, /source !== 'custom' && source !== 'suggested'/);
assert.match(nativeAssetDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(addressDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedCopy, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(suggestedCopy, /Suggested chain display uses/);
assert.match(suggestedCopy, /buildSuggestedAddressSourceText/);
assert.match(suggestedCopy, /Suggested bech32 prefix/);
assert.match(suggestedCopy, /buildSuggestedApprovalAddressPreviewExplanation/);
assert.match(suggestedCopy, /suggested chain includes address metadata for display/);

assert.match(approvalPreview, /requestedNativeAssetExplanation/);
assert.match(approvalPreview, /requestedAddressExplanation/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainDisplayContextFromInfo/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);

assert.match(connectApproval, /requestedNativeAssetExplanation/);
assert.match(connectApproval, /requestedAddressExplanation/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);

console.log('suggested chain approval display hardening verification passed');
