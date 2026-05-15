import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const nativeAssetDisplayAdapter = await read('../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts');
const addressDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddressDisplayAdapter.ts');
const addTokenDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddTokenDisplayAdapter.ts');
const displayAdapter = await read('../src/cosmos/chains/runtimeChainDisplayAdapter.ts');
const suggestedCopy = await read('../src/cosmos/chains/suggestedChainDisplayCopy.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');
const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');

assert.match(nativeAssetDisplayAdapter, /buildRuntimeChainNativeAssetDisplayContext/);
assert.match(nativeAssetDisplayAdapter, /previewExplanation/);
assert.match(nativeAssetDisplayAdapter, /source !== 'custom' && source !== 'suggested'/);
assert.match(nativeAssetDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedCopy, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(suggestedCopy, /Suggested chain display uses/);
assert.match(addressDisplayAdapter, /buildRuntimeChainApprovalAddressDisplayContext/);
assert.match(addressDisplayAdapter, /Accounts connected \(chain-specific\)/);
assert.match(addressDisplayAdapter, /Accounts connected \(context fallback\)/);
assert.match(addressDisplayAdapter, /Accounts connected \(suggested context\)/);
assert.match(addressDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedCopy, /buildSuggestedAddressSourceText/);
assert.match(suggestedCopy, /Suggested bech32 prefix/);
assert.match(suggestedCopy, /Accounts connected \(suggested fallback\)/);
assert.match(suggestedCopy, /No local address is available for this suggested chain/);

assert.match(displayAdapter, /export type RuntimeChainDisplayContext =/);
assert.match(displayAdapter, /export type RuntimeChainAddressDisplayContext =/);
assert.match(displayAdapter, /buildRuntimeChainDisplayContext/);
assert.match(displayAdapter, /buildRequestedRuntimeChainDisplayContext/);
assert.match(displayAdapter, /buildSuggestedRuntimeChainDisplayContextFromInfo/);
assert.match(displayAdapter, /buildSuggestedRuntimeChainDisplayAssembly/);
assert.match(displayAdapter, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(displayAdapter, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);
assert.match(displayAdapter, /resolveRuntimeChainAddressDisplayContext/);
assert.match(displayAdapter, /buildRuntimeChainApprovalAddressDisplayContext/);
assert.match(displayAdapter, /nativeAssetDisplay/);
assert.match(displayAdapter, /\(Custom\)/);
assert.match(displayAdapter, /\(Suggested\)/);
assert.match(displayAdapter, /Accounts connected \(fallback\)/);
assert.match(displayAdapter, /Accounts connected \(typed fallback\)/);
assert.match(displayAdapter, /Accounts connected \(wallet fallback\)/);
assert.match(displayAdapter, /Accounts connected \(suggested fallback\)/);

assert.match(connectApproval, /buildRequestedRuntimeChainDisplayContext/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);
assert.match(connectApproval, /resolveRuntimeChainAddressDisplayContext/);
assert.match(connectApproval, /addressLabel/);
assert.match(connectApproval, /chainDisplayTitle/);
assert.match(connectApproval, /requestedNativeAssetExplanation/);
assert.match(connectApproval, /requestedAddressExplanation/);
assert.match(connectApproval, /requestedAddressLabel/);

assert.match(approvalPreview, /buildRequestedRuntimeChainDisplayContext/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainDisplayContextFromInfo/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(approvalPreview, /requestedChainName: suggestedPreviewProps\?\.requestedChainName \|\| requestedChainDisplay\.chainLabel/);
assert.match(approvalPreview, /requestedChainTitle: suggestedPreviewProps\?\.requestedChainTitle \|\| requestedChainDisplay\.chainTitle/);
assert.match(approvalPreview, /requestedNativeAssetExplanation/);
assert.match(approvalPreview, /requestedAddressExplanation/);

console.log('runtime chain display context verification passed');
