import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const nativeAssetDisplayAdapter = await read('../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts');
const addTokenDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddTokenDisplayAdapter.ts');
const runtimeDisplayAdapter = await read('../src/cosmos/chains/runtimeChainDisplayAdapter.ts');
const suggestedCopy = await read('../src/cosmos/chains/suggestedChainDisplayCopy.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(nativeAssetDisplayAdapter, /export type RuntimeChainNativeAssetDisplayContext =/);
assert.match(nativeAssetDisplayAdapter, /buildRuntimeChainNativeAssetDisplayContext/);
assert.match(nativeAssetDisplayAdapter, /nativeAssetLabel/);
assert.match(nativeAssetDisplayAdapter, /fallbackText/);
assert.match(nativeAssetDisplayAdapter, /previewTitle/);
assert.match(nativeAssetDisplayAdapter, /previewSubtitle/);
assert.match(nativeAssetDisplayAdapter, /previewExplanation/);
assert.match(nativeAssetDisplayAdapter, /source !== 'custom'/);
assert.match(nativeAssetDisplayAdapter, /Other runtime capabilities may still be partial/);
assert.match(nativeAssetDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedCopy, /buildSuggestedNativeAssetPreviewTitle/);
assert.match(suggestedCopy, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(suggestedCopy, /buildSuggestedAddTokenNativeAssetFallbackText/);
assert.match(suggestedCopy, /buildSuggestedAddTokenNativeAssetPreviewExplanation/);

assert.match(runtimeDisplayAdapter, /runtimeChainNativeAssetDisplayAdapter/);
assert.match(runtimeDisplayAdapter, /nativeAssetDisplay/);
assert.match(runtimeDisplayAdapter, /previewExplanation/);
assert.match(addTokenDisplayAdapter, /buildRuntimeChainAddTokenNativeAssetDisplayContext/);
assert.match(addTokenDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(addTokenDisplayAdapter, /buildSuggestedRuntimeChainAddTokenDisplayContext/);

assert.match(connectApproval, /chainDisplayTitle/);

console.log('runtime chain native asset display context verification passed');
