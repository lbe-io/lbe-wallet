import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const suggestedDisplayTypes = await read('../src/cosmos/chains/suggestedChainDisplayTypes.ts');
const suggestedCopy = await read('../src/cosmos/chains/suggestedChainDisplayCopy.ts');
const runtimeDisplayAdapter = await read('../src/cosmos/chains/runtimeChainDisplayAdapter.ts');
const nativeAssetDisplayAdapter = await read('../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts');
const addressDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddressDisplayAdapter.ts');
const addTokenDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddTokenDisplayAdapter.ts');
const approvalPreview = await read('../src/entrypoints/background/controller/provider/approvalPreview.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(suggestedDisplayTypes, /export type SuggestedRuntimeChainDisplayTextFields =/);
assert.match(suggestedDisplayTypes, /export type SuggestedRuntimeChainDisplayPropShape =/);
assert.match(suggestedDisplayTypes, /export type SuggestedRuntimeChainApprovalPreviewDisplayContext =/);
assert.match(suggestedDisplayTypes, /export type SuggestedRuntimeChainPreviewInput =/);
assert.match(suggestedDisplayTypes, /export type SuggestedRuntimeChainAddTokenDisplayContext =/);

assert.match(suggestedCopy, /buildSuggestedChainLabel/);
assert.match(suggestedCopy, /buildSuggestedSurfaceDisplayTitle/);
assert.match(suggestedCopy, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(suggestedCopy, /buildSuggestedAddressSourceText/);
assert.match(suggestedCopy, /buildSuggestedApprovalAddressPreviewExplanation/);
assert.match(suggestedCopy, /buildSuggestedAddTokenAddressPreviewExplanation/);
assert.match(suggestedCopy, /buildSuggestedAddTokenNativeAssetPreviewExplanation/);
assert.match(suggestedCopy, /SUGGESTED_PARTIAL_PERSISTED_RUNTIME_COPY/);
assert.match(suggestedCopy, /SUGGESTED_PARTIAL_DISPLAY_ONLY_COPY/);

assert.match(runtimeDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(runtimeDisplayAdapter, /from '\.\/suggestedChainDisplayTypes'/);
assert.match(runtimeDisplayAdapter, /export type SuggestedRuntimeChainDisplayAssembly =/);
assert.match(runtimeDisplayAdapter, /buildSuggestedRuntimeChainDisplayAssembly/);
assert.match(runtimeDisplayAdapter, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(runtimeDisplayAdapter, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);
assert.match(runtimeDisplayAdapter, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(runtimeDisplayAdapter, /surface\?: 'connect' \| 'add-token'/);

assert.match(nativeAssetDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(nativeAssetDisplayAdapter, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(addressDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(addressDisplayAdapter, /buildSuggestedAddressSourceText/);

assert.match(addTokenDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(addTokenDisplayAdapter, /from '\.\/suggestedChainDisplayTypes'/);
assert.match(addTokenDisplayAdapter, /buildSuggestedRuntimeChainAddTokenDisplayContext/);
assert.match(addTokenDisplayAdapter, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(addTokenDisplayAdapter, /buildSuggestedAddTokenAddressPreviewExplanation/);
assert.match(addTokenDisplayAdapter, /buildSuggestedAddTokenNativeAssetPreviewExplanation/);
assert.match(addTokenDisplayAdapter, /SuggestedRuntimeChainAddTokenDisplayContext as RuntimeChainAddTokenDisplayContext/);

assert.match(approvalPreview, /from '@\/cosmos\/chains\/suggestedChainDisplayTypes'/);
assert.match(approvalPreview, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(approvalPreview, /const suggestedPreviewProps: SuggestedRuntimeChainApprovalPreviewDisplayContext \| null/);

assert.match(connectApproval, /from '@\/cosmos\/chains\/suggestedChainDisplayTypes'/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(connectApproval, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);
assert.match(connectApproval, /const suggestedDisplayProps: SuggestedRuntimeChainDisplayPropShape \| null/);

console.log('suggested chain display consolidation verification passed');
