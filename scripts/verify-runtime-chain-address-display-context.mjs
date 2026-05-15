import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const addressDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddressDisplayAdapter.ts');
const addTokenDisplayAdapter = await read('../src/cosmos/chains/runtimeChainAddTokenDisplayAdapter.ts');
const runtimeDisplayAdapter = await read('../src/cosmos/chains/runtimeChainDisplayAdapter.ts');
const suggestedCopy = await read('../src/cosmos/chains/suggestedChainDisplayCopy.ts');
const connectApproval = await read('../src/popup/app/approval/component/Connect/index.tsx');

assert.match(addressDisplayAdapter, /export type RuntimeChainApprovalAddressDisplayContext =/);
assert.match(addressDisplayAdapter, /buildRuntimeChainApprovalAddressDisplayContext/);
assert.match(addressDisplayAdapter, /previewTitle/);
assert.match(addressDisplayAdapter, /previewSubtitle/);
assert.match(addressDisplayAdapter, /previewExplanation/);
assert.match(addressDisplayAdapter, /This custom chain can resolve a chain-specific derived address/);
assert.match(addressDisplayAdapter, /approval display may still fall back to a typed or wallet address/);
assert.match(addressDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedCopy, /buildSuggestedAddressSourceText/);
assert.match(suggestedCopy, /buildSuggestedApprovalAddressPreviewExplanation/);
assert.match(addTokenDisplayAdapter, /buildRuntimeChainAddTokenAddressDisplayContext/);
assert.match(addTokenDisplayAdapter, /Typed fallback selected for token approval/);
assert.match(addTokenDisplayAdapter, /Wallet fallback selected for token approval/);
assert.match(addTokenDisplayAdapter, /from '\.\/suggestedChainDisplayCopy'/);

assert.match(runtimeDisplayAdapter, /buildRuntimeChainApprovalAddressDisplayContext/);
assert.match(runtimeDisplayAdapter, /Accounts connected \(chain-specific\)/);
assert.match(runtimeDisplayAdapter, /Accounts connected \(typed fallback\)/);
assert.match(runtimeDisplayAdapter, /Accounts connected \(wallet fallback\)/);

assert.match(connectApproval, /requestedAddressExplanation/);

console.log('runtime chain address display context verification passed');
