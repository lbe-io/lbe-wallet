import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../src/entrypoints/background/handleRequest.ts', import.meta.url), 'utf8');

assert.match(source, /let appStoreReadyPromise: Promise<void> \| null = null;/, 'background should keep a single ready promise');
assert.match(source, /const ensureBackgroundReady = async \(\) =>/, 'background should expose an explicit ready gate');
assert.match(source, /if \(!appStoreReadyPromise\) \{\s*appStoreReadyPromise = restoreAppState\(\);/s, 'background ready gate should memoize restoreAppState');
assert.match(source, /await ensureBackgroundReady\(\);/, 'popup and provider message handling should await background readiness');
assert.match(source, /await notificationService\.restoreRuntime\(\);/, 'background restore should hydrate approval runtime state');

console.log('background ready gate verification passed');
