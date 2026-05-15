import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const authorityWriteServiceSource = await fs.readFile(
  new URL('../src/entrypoints/background/service/authorityWriteService.ts', import.meta.url),
  'utf8',
);
const preferenceSource = await fs.readFile(
  new URL('../src/entrypoints/background/service/preference.ts', import.meta.url),
  'utf8',
);
const walletSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/wallet.ts', import.meta.url),
  'utf8',
);
const connectionHandlersSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/connectionHandlers.ts', import.meta.url),
  'utf8',
);
const approvalOrchestratorSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/approvalOrchestrator.ts', import.meta.url),
  'utf8',
);
const connectApprovalSource = await fs.readFile(
  new URL('../src/popup/app/approval/component/Connect/index.tsx', import.meta.url),
  'utf8',
);
const networkModalSource = await fs.readFile(
  new URL('../src/popup/app/modal/network/index.tsx', import.meta.url),
  'utf8',
);
const walletEditSource = await fs.readFile(
  new URL('../src/popup/app/modal/walletEdit/index.tsx', import.meta.url),
  'utf8',
);
const selectionSyncSource = await fs.readFile(
  new URL('../src/popup/utils/selectionSyncService.ts', import.meta.url),
  'utf8',
);
const walletContextSource = await fs.readFile(
  new URL('../src/app/contexts/walletContext.tsx', import.meta.url),
  'utf8',
);

assert.match(authorityWriteServiceSource, /setOriginEnabledChains/, 'authorityWriteService should expose setOriginEnabledChains');
assert.match(authorityWriteServiceSource, /setOriginActiveChain/, 'authorityWriteService should expose setOriginActiveChain');
assert.match(authorityWriteServiceSource, /connectOriginSite/, 'authorityWriteService should expose connectOriginSite');
assert.match(authorityWriteServiceSource, /setOriginAccountBinding/, 'authorityWriteService should expose setOriginAccountBinding');

assert.match(preferenceSource, /setSelectedChain/, 'preferenceService should expose a selected-chain write path');
assert.match(preferenceSource, /changeSelectedChain/, 'preferenceService should expose a global chain selection change path');
assert.doesNotMatch(preferenceSource, /sessionService\.broadcastEvent\('accountsChanged'/, 'preferenceService should no longer broadcast provider account events');
assert.doesNotMatch(preferenceSource, /sessionService\.broadcastEvent\(\s*'chainChanged'/, 'preferenceService should no longer broadcast provider chain events');
assert.doesNotMatch(preferenceSource, /sessionService\.broadcastEvent\(\s*'networkChanged'/, 'preferenceService should no longer broadcast provider network events');

assert.match(walletSource, /setSelectedAccount/, 'wallet controller should expose setSelectedAccount');
assert.match(walletSource, /changeSelectedAccount/, 'wallet controller should expose changeSelectedAccount');
assert.match(walletSource, /setSelectedChain/, 'wallet controller should expose setSelectedChain');
assert.match(walletSource, /changeSelectedChain/, 'wallet controller should expose changeSelectedChain');
assert.match(walletSource, /setOriginChainId/, 'wallet controller should expose setOriginChainId');
assert.match(walletContextSource, /setSelectedAccount/, 'wallet context should expose setSelectedAccount');
assert.match(walletContextSource, /changeSelectedAccount/, 'wallet context should expose changeSelectedAccount');
assert.match(walletContextSource, /setSelectedChain/, 'wallet context should expose setSelectedChain');
assert.match(walletContextSource, /changeSelectedChain/, 'wallet context should expose changeSelectedChain');
assert.match(walletContextSource, /setOriginChainId/, 'wallet context should expose setOriginChainId');

assert.match(connectionHandlersSource, /setOriginEnabledChains/, 'enable should write origin-scoped chain authority');
assert.doesNotMatch(connectionHandlersSource, /\bwallet\.setChainId\(/, 'enable should no longer write through the broad setChainId path');

assert.match(approvalOrchestratorSource, /connectOriginSite/, 'connect approval should write through origin authority write service');

assert.doesNotMatch(connectApprovalSource, /\bsetCurrentAccount\(/, 'Connect approval should no longer mutate the global selected account');

assert.match(networkModalSource, /\bchangeSelectedChain\(/, 'network modal should update the global selected chain through the explicit path');
assert.doesNotMatch(networkModalSource, /\bsetChainId\(/, 'network modal should no longer use the broad setChainId path');

assert.match(walletEditSource, /\bchangeSelectedAccount\(/, 'wallet edit should update the global selected account through the explicit path');
assert.doesNotMatch(walletEditSource, /\bchangeAccounts\(/, 'wallet edit should no longer use the broad changeAccounts path');
assert.match(selectionSyncSource, /syncSelectedAccount/, 'selection sync service should expose account sync');
assert.match(selectionSyncSource, /syncSelectedChain/, 'selection sync service should expose chain sync');
assert.doesNotMatch(selectionSyncSource, /\bsetOriginChainId\(/, 'selection sync service should remain global-selection only');

console.log('authority write alignment verification passed');
