import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const chainRepositorySource = await fs.readFile(new URL('../src/cosmos/chains/chainRepository.ts', import.meta.url), 'utf8');
const chainSourceAdapterSource = await fs.readFile(new URL('../src/cosmos/chains/chainSourceAdapter.ts', import.meta.url), 'utf8');
const builtinSourceSource = await fs.readFile(new URL('../src/cosmos/chains/builtinChainSource.ts', import.meta.url), 'utf8');
const customSourceSource = await fs.readFile(new URL('../src/cosmos/chains/customChainSource.ts', import.meta.url), 'utf8');
const suggestedSourceSource = await fs.readFile(new URL('../src/cosmos/chains/suggestedChainSource.ts', import.meta.url), 'utf8');
const chainInfoHandlersSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/chainInfoHandlers.ts', import.meta.url),
  'utf8',
);
const walletInitSource = await fs.readFile(new URL('../src/popup/utils/cosmos-wallet-init.ts', import.meta.url), 'utf8');
const networkModalSource = await fs.readFile(new URL('../src/popup/app/modal/network/index.tsx', import.meta.url), 'utf8');
const networkEditSource = await fs.readFile(new URL('../src/popup/app/modal/networkEdit/index.tsx', import.meta.url), 'utf8');

assert.match(chainSourceAdapterSource, /ChainSourceKind/, 'chain source adapter should define explicit chain source kinds');
assert.match(chainSourceAdapterSource, /BuiltinChainSourceEntry/, 'chain source adapter should define builtin source entry');
assert.match(chainSourceAdapterSource, /CustomChainSourceEntry/, 'chain source adapter should define custom source entry');
assert.match(chainSourceAdapterSource, /SuggestedChainSourceEntry/, 'chain source adapter should define suggested source entry');
assert.match(builtinSourceSource, /toBuiltinChainSourceEntry/, 'builtin chain source should normalize builtin entries');
assert.match(customSourceSource, /toCustomChainSourceEntry/, 'custom chain source should normalize custom entries');
assert.match(suggestedSourceSource, /toSuggestedChainSourceEntry/, 'suggested chain source should normalize suggested candidates');

assert.match(chainRepositorySource, /listBuiltinChainSources/, 'chainRepository should expose builtin source reads');
assert.match(chainRepositorySource, /listCustomChainSources/, 'chainRepository should expose custom source reads');
assert.match(chainRepositorySource, /writeBuiltinChainRecords/, 'chainRepository should expose builtin source writes');
assert.match(chainRepositorySource, /writeCustomChainRecord/, 'chainRepository should expose custom source writes');
assert.match(chainRepositorySource, /buildSuggestedChainSource/, 'chainRepository should expose suggested source projection');

assert.match(chainInfoHandlersSource, /listBuiltinChainSources/, 'chainInfoHandlers should read canonical chains from the source repository');
assert.match(chainInfoHandlersSource, /buildSuggestedChainSource/, 'chainInfoHandlers should normalize suggested chains through a dedicated source adapter');

assert.match(walletInitSource, /listBuiltinChainSources/, 'wallet init should consume builtin chain sources');
assert.doesNotMatch(walletInitSource, /getBuiltinCosmosChainMetadataList/, 'wallet init should no longer read builtin chains directly from the registry list');

assert.match(networkModalSource, /listBuiltinChainRecords/, 'network modal should read builtin chains through the repository facade');
assert.match(networkModalSource, /listCustomChainRecords/, 'network modal should read custom chains through the repository facade');
assert.doesNotMatch(networkModalSource, /getCosmosChainInfos\(/, 'network modal should not read builtin chain infos directly anymore');

assert.match(networkEditSource, /writeCustomChainRecord/, 'network edit should persist custom chains through the repository facade');

console.log('chain source separation verification passed');
