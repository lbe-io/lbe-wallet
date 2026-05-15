import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const initPath = path.join(repoRoot, 'src', 'popup', 'utils', 'cosmos-wallet-init.ts');
const bootstrapPath = path.join(repoRoot, 'src', 'popup', 'hooks', 'useDexieBootstrap.ts');

const initSource = await fs.readFile(initPath, 'utf8');
const bootstrapSource = await fs.readFile(bootstrapPath, 'utf8');

// New-wallet bootstrap must generate native token rows from `currencies`,
// not stakeCurrency-only single record generation.
assert.match(initSource, /const\s+buildBuiltinChainTokenRecords\s*=\s*\(chain:\s*BuiltinChainMetadata\):\s*ChainToken\[\]\s*=>/);
assert.match(initSource, /chain\.currencies\.reduce<ChainToken\[]>/);
assert.match(initSource, /derivedChains\.flatMap\(\(chain\)\s*=>\s*buildBuiltinChainTokenRecords\(chain\)\)/);

// Existing wallets should run a backfill pass so extraCurrencies (e.g. ZDB)
// can be auto-populated into selected native token list.
assert.match(bootstrapSource, /if\s*\(wallets\.length\)\s*\{/);
assert.match(bootstrapSource, /await\s+ensureSelectedNativeTokens\(\)/);

console.log('verify-builtin-native-token-bootstrap: passed');
