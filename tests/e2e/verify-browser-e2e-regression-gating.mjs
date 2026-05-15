import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readText = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const packageJson = JSON.parse(readText('package.json'));
const docs = readText('docs/stage-2-regression-matrix.md');
const baselineScript = readText('tests/e2e/verify-browser-e2e-regression-baseline.mjs');

const expectedScripts = {
  'verify:browser:e2e': 'node tests/e2e/verify-browser-e2e-regression-baseline.mjs',
  'verify:browser:e2e:gating': 'node tests/e2e/verify-browser-e2e-regression-gating.mjs',
  'verify:browser:e2e:gate': 'yarn build && yarn verify:stage2 && yarn verify:browser:e2e',
};

for (const [name, command] of Object.entries(expectedScripts)) {
  assert(packageJson.scripts?.[name] === command, `package.json should expose ${name} as "${command}"`);
}

const requiredDocsSnippets = [
  '### Browser E2E Baseline',
  '`corepack yarn verify:browser:e2e`',
  '`corepack yarn verify:browser:e2e:gate`',
  'Microsoft Edge',
  'provider `enable` / `getKey` / `signDirect` / `signAmino` / `signArbitrary` / `sendTx`',
  'popup wallet home -> `CryptoDetail` -> send confirm',
  'cross-origin authorization isolation',
];

for (const snippet of requiredDocsSnippets) {
  assert(docs.includes(snippet), `docs/stage-2-regression-matrix.md should mention: ${snippet}`);
}

const baselineCoverageMarkers = [
  'runProviderPrimaryFlow',
  'runProviderOriginIsolation',
  'runPopupSendSmoke',
  'provider flow: enable primary chain',
  'provider flow: sendTx invalid bytes',
  'popup smoke: drive send flow to confirm screen',
  "tests', '.tmp-e2e",
  'browser-e2e-latest.stderr.log',
  'browser-e2e-latest.stdout.log',
];

for (const marker of baselineCoverageMarkers) {
  assert(baselineScript.includes(marker), `verify-browser-e2e-regression-baseline.mjs should still cover ${marker}`);
}

console.log('verify-browser-e2e-regression-gating: ok');
