import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const extensionDir = path.join(repoRoot, '.output', 'chrome-mv3');
const e2eTempDir = path.join(repoRoot, 'tests', '.tmp-e2e');
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PRIMARY_CHAIN_ID = 'cosmos-1';
const SECONDARY_CHAIN_ID = 'cosmoshub-4';
const PASSWORD = 'Stage4Baseline123';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const summarizeError = (error) => ({
  code: error?.code,
  data: error?.data,
  message: error?.message || String(error),
});

const logStep = (message) => {
  console.log(`[browser-e2e] ${message}`);
};

const ensureE2eTempDir = () => {
  fs.mkdirSync(e2eTempDir, { recursive: true });
  return e2eTempDir;
};

const writeE2eArtifact = (name, contents) => {
  const targetPath = path.join(ensureE2eTempDir(), name);
  fs.writeFileSync(targetPath, contents, 'utf8');
  return targetPath;
};

const createStructuredError = (result) => {
  const error = new Error(result?.error?.message || 'Browser action failed');
  error.code = result?.error?.code;
  error.data = result?.error?.data;
  return error;
};

const waitFor = async (predicate, { timeout = 15_000, interval = 200, label = 'condition' } = {}) => {
  const start = Date.now();
  for (;;) {
    const value = await predicate();
    if (value) {
      return value;
    }
    if (Date.now() - start >= timeout) {
      throw new Error(`Timed out waiting for ${label}`);
    }
    await delay(interval);
  }
};

const readJson = async (url, init) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return res.json();
};

const startStaticServer = async ({ listenHost, originHost = listenHost }) => {
  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let filePath = path.join(repoRoot, decodeURIComponent(requestUrl.pathname));

      if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!filePath.startsWith(repoRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.end(fs.readFileSync(filePath));
    } catch (error) {
      res.statusCode = 500;
      res.end(String(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, listenHost, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  assert(address && typeof address === 'object', 'Failed to resolve local HTTP server port');
  return {
    origin: `http://${originHost}:${address.port}`,
    port: address.port,
    close: async () => {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
};

const launchEdge = async () => {
  assert(fs.existsSync(extensionDir), `Missing built extension output at ${extensionDir}`);
  assert(fs.existsSync(edgePath), `Microsoft Edge not found at ${edgePath}`);

  const debugPort = 9200 + Math.floor(Math.random() * 400);
  const profileDir = fs.mkdtempSync(path.join(ensureE2eTempDir(), 'edge-profile-'));
  const stderrChunks = [];
  const stdoutChunks = [];
  const child = spawn(
    edgePath,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=DisableLoadExtensionCommandLineSwitch',
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  child.stdout.on('data', (chunk) => stdoutChunks.push(chunk.toString()));
  child.stderr.on('data', (chunk) => stderrChunks.push(chunk.toString()));

  child.once('exit', (code) => {
    if (code && code !== 0) {
      const stderr = stderrChunks.join('');
      console.error(stderr || `Microsoft Edge exited with code ${code}`);
    }
  });

  await waitFor(
    async () => {
      try {
        return await readJson(`http://127.0.0.1:${debugPort}/json/version`);
      } catch {
        return null;
      }
    },
    { timeout: 20_000, label: 'Edge DevTools endpoint' },
  );

  return {
    debugPort,
    stderr: () => stderrChunks.join(''),
    stdout: () => stdoutChunks.join(''),
    close: async () => {
      child.kill();
      await delay(500);
      fs.rmSync(profileDir, { recursive: true, force: true });
    },
  };
};

const listTargets = async (debugPort) => readJson(`http://127.0.0.1:${debugPort}/json/list`);

const openTarget = async (debugPort, url) =>
  readJson(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });

const closeTarget = async (debugPort, targetId) => {
  const res = await fetch(`http://127.0.0.1:${debugPort}/json/close/${targetId}`);
  return res.ok;
};

const resolveExtensionId = async (debugPort) => {
  const targets = await listTargets(debugPort);
  const target = targets.find((item) => {
    const url = String(item.url || '');
    return url.startsWith('chrome-extension://') && (url.endsWith('/background.js') || url.includes('/onboarding.html'));
  });
  assert(target, 'Failed to resolve loaded extension target');
  return new URL(target.url).host;
};

class PageSession {
  constructor(target) {
    this.target = target;
    this.ws = new WebSocket(target.webSocketDebuggerUrl);
    this.nextId = 0;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      const payload = JSON.parse(event.data.toString());
      if (!payload.id || !this.pending.has(payload.id)) {
        return;
      }
      const { resolve, reject } = this.pending.get(payload.id);
      this.pending.delete(payload.id);
      if (payload.error) {
        reject(new Error(payload.error.message || JSON.stringify(payload.error)));
        return;
      }
      resolve(payload.result);
    };
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    return this;
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, { awaitPromise = true, returnByValue = true } = {}) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue,
    });
    return result.result?.value;
  }

  async waitFor(expression, label, timeout = 15_000) {
    return waitFor(
      async () => {
        try {
          return await this.evaluate(expression);
        } catch {
          return false;
        }
      },
      { timeout, label },
    );
  }

  async waitForText(text, timeout = 15_000) {
    const needle = JSON.stringify(text);
    return this.waitFor(`document.body && document.body.innerText.includes(${needle})`, `text ${text}`, timeout);
  }

  async waitForUrlFragment(fragment, timeout = 15_000) {
    const needle = JSON.stringify(fragment);
    return this.waitFor(`location.href.includes(${needle})`, `url fragment ${fragment}`, timeout);
  }

  async waitForSelectorCount(selector, count = 1, timeout = 15_000) {
    return this.waitFor(
      `document.querySelectorAll(${JSON.stringify(selector)}).length >= ${count}`,
      `selector ${selector} count >= ${count}`,
      timeout,
    );
  }

  async clickSelector(selector, index = 0) {
    const ok = await this.evaluate(`
      (() => {
        const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        const target = nodes[${index}] || null;
        if (!target) return false;
        target.click();
        return true;
      })()
    `);
    assert(ok, `Unable to click selector ${selector} at index ${index}`);
  }

  async clickButton(text) {
    return this.clickText(text, 'button');
  }

  async clickButtonWithin(containerSelector, text) {
    const ok = await this.evaluate(`
      (() => {
        const container = document.querySelector(${JSON.stringify(containerSelector)});
        if (!container) return false;
        const target = Array.from(container.querySelectorAll('button')).find((node) => {
          const value = (node.innerText || node.textContent || '').replace(/\\s+/g, ' ').trim();
          return value.includes(${JSON.stringify(text)});
        });
        if (!target) return false;
        target.click();
        return true;
      })()
    `);
    assert(ok, `Unable to click button "${text}" within ${containerSelector}`);
  }

  async clickText(text, selector = '*') {
    const ok = await this.evaluate(`
      (() => {
        const target = Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find((node) => {
          const value = (node.innerText || node.textContent || '').replace(/\\s+/g, ' ').trim();
          return value.includes(${JSON.stringify(text)});
        });
        if (!target) return false;
        target.click();
        return true;
      })()
    `);
    assert(ok, `Unable to click text "${text}" within ${selector}`);
  }

  async clickActionByLabel(text) {
    const ok = await this.evaluate(`
      (() => {
        const label = Array.from(document.querySelectorAll('div, span, p')).find((node) => {
          const value = (node.innerText || node.textContent || '').replace(/\\s+/g, ' ').trim();
          return value === ${JSON.stringify(text)};
        });
        const button = label?.parentElement?.querySelector('button');
        if (!button) return false;
        button.click();
        return true;
      })()
    `);
    assert(ok, `Unable to click action by label "${text}"`);
  }

  async setInputValue(selector, value, index = 0) {
    const ok = await this.evaluate(`
      (() => {
        const input = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))[${index}] || null;
        if (!input) return false;
        const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        descriptor?.set?.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()
    `);
    assert(ok, `Unable to set input value for ${selector}`);
  }

  async setCheckbox(selector = 'input[type="checkbox"]', checked = true, index = 0) {
    const ok = await this.evaluate(`
      (() => {
        const input = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))[${index}] || null;
        if (!input) return false;
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
        descriptor?.set?.call(input, ${checked ? 'true' : 'false'});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()
    `);
    assert(ok, `Unable to set checkbox ${selector} at index ${index}`);
  }

  async reload() {
    await this.send('Page.reload');
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
  }

  async getBodyText() {
    return this.evaluate(`document.body ? document.body.innerText : ''`);
  }

  async getPopupSendDiagnostics() {
    return this.evaluate(`
      (() => ({
        bodyText: document.body ? document.body.innerText : '',
        location: location.href,
        selectAddressOpen: !!document.querySelector('.select-address'),
        sendAmountOpen: !!document.querySelector('.send-amount'),
        sendInfoOpen: !!document.querySelector('.send-info'),
        buttonTexts: Array.from(document.querySelectorAll('button')).map((node) =>
          (node.innerText || node.textContent || '').replace(/\\s+/g, ' ').trim(),
        ).filter(Boolean),
      }))()
    `);
  }

  close() {
    this.ws.close();
  }
}

const connectToTarget = async (target) => new PageSession(target).connect();

const waitForApprovalTarget = async (debugPort, extensionId, seenIds) =>
  waitFor(
    async () => {
      const targets = await listTargets(debugPort);
      return (
        targets.find((target) => {
          if (seenIds.has(target.id)) return false;
          const url = String(target.url || '');
          return (
            url.startsWith(`chrome-extension://${extensionId}/popup.html`) &&
            url.includes('approval')
          );
        }) || null
      );
    },
    { timeout: 20_000, label: 'approval target' },
  );

const settlePendingProvider = async (page) =>
  page.evaluate(`
    window.__codexPending
      .then((value) => ({ ok: true, value }))
      .catch((error) => ({
        ok: false,
        error: {
          message: error?.message || String(error),
          code: error?.code,
          data: error?.data,
        },
      }))
  `);

const expectProviderFailure = async (page, expression, code, message) => {
  const result = await page.evaluate(`
    Promise.resolve()
      .then(() => (${expression}))
      .then((value) => ({ ok: true, value }))
      .catch((error) => ({
        ok: false,
        error: {
          message: error?.message || String(error),
          code: error?.code,
          data: error?.data,
        },
      }))
  `);

  assert(!result.ok, `${message} should fail`);
  assert(result.error.code === code, `${message} should fail with code ${code}, got ${result.error.code}`);
};

const approvePendingRequest = async (debugPort, extensionId, seenIds) => {
  const target = await waitForApprovalTarget(debugPort, extensionId, seenIds);
  const approvalPage = await connectToTarget(target);
  await approvalPage.waitForText('Confirm', 20_000);
  await approvalPage.clickButton('Confirm');
  approvalPage.close();
  await waitFor(
    async () => {
      const targets = await listTargets(debugPort);
      return !targets.some((item) => item.id === target.id);
    },
    { timeout: 10_000, label: 'approval window close' },
  );
};

const rejectPendingRequest = async (debugPort, extensionId, seenIds) => {
  const target = await waitForApprovalTarget(debugPort, extensionId, seenIds);
  await closeTarget(debugPort, target.id);
  await waitFor(
    async () => {
      const targets = await listTargets(debugPort);
      return !targets.some((item) => item.id === target.id);
    },
    { timeout: 10_000, label: 'approval window close after reject' },
  );
};

const setupWallet = async (debugPort, extensionId) => {
  logStep('wallet setup: open onboarding welcome');
  const onboardingTarget = await openTarget(debugPort, `chrome-extension://${extensionId}/onboarding.html#/welcome`);
  const onboarding = await connectToTarget(onboardingTarget);
  await onboarding.waitForText("Let's begin!");
  logStep('wallet setup: create password');
  await onboarding.clickButton('Create a new wallet');
  await onboarding.waitForUrlFragment('/create-password');
  await onboarding.waitForText('Create a password');
  await onboarding.waitForSelectorCount('input[type="password"]', 2);
  await onboarding.setInputValue('input[type="password"]', PASSWORD, 0);
  await onboarding.setInputValue('input[type="password"]', PASSWORD, 1);
  await onboarding.waitForSelectorCount('label[class*="checkbox-wrapper"]', 1);
  await onboarding.clickSelector('label[class*="checkbox-wrapper"]');
  await onboarding.clickButton('Create password');
  await onboarding.waitForUrlFragment('/review-recovery-phrase', 20_000);
  logStep('wallet setup: skip recovery confirmation');
  await onboarding.waitForSelectorCount('.review-recovery .mnemonic-wrapper', 1, 20_000);
  await onboarding.clickSelector('.review-recovery .mnemonic-wrapper');
  await onboarding.clickButton('Remind me later');
  await onboarding.waitForText('Skip account security?', 20_000);
  await onboarding.waitForSelectorCount('label[class*="checkbox-wrapper"]', 1, 20_000);
  await onboarding.clickSelector('label[class*="checkbox-wrapper"]', 0);
  await onboarding.clickButton('Jump over');
  await onboarding.waitForUrlFragment('/onboarding-complete', 20_000);
  await onboarding.waitForText('Your wallet is ready.');
  logStep('wallet setup: complete');
  onboarding.close();
  await closeTarget(debugPort, onboardingTarget.id);
};

const runProviderPrimaryFlow = async (debugPort, extensionId, origin) => {
  logStep('provider flow: open primary origin');
  const providerTarget = await openTarget(debugPort, `${origin}/tests/manual/provider-regression.html`);
  const page = await connectToTarget(providerTarget);
  await page.waitFor('typeof window.lbeWallet !== "undefined"', 'provider injection', 20_000);

  logStep('provider flow: enable primary chain');
  const beforeEnableIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`window.__codexPending = window.lbeWallet.enable(${JSON.stringify(PRIMARY_CHAIN_ID)}); true;`);
  await approvePendingRequest(debugPort, extensionId, beforeEnableIds);
  const enableResult = await settlePendingProvider(page);
  assert(enableResult.ok, `enable(${PRIMARY_CHAIN_ID}) should succeed`);

  logStep('provider flow: reject override and disabled-chain access');
  await expectProviderFailure(
    page,
    `window.lbeWallet.request({ method: 'getKey', params: { chainId: ${JSON.stringify(PRIMARY_CHAIN_ID)}, accountIndex: 999 } })`,
    4100,
    'raw getKey(accountIndex override)',
  );

  await expectProviderFailure(
    page,
    `window.lbeWallet.getKey(${JSON.stringify(SECONDARY_CHAIN_ID)})`,
    4100,
    'getKey on non-enabled chain',
  );

  const key = await page.evaluate(`
    (async () => {
      const key = await window.lbeWallet.getKey(${JSON.stringify(PRIMARY_CHAIN_ID)});
      window.__codexKey = key;
      return key;
    })()
  `);
  assert(key?.bech32Address, 'getKey should return a bech32Address');

  logStep('provider flow: signDirect');
  const signDirectIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`
    (() => {
      const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
      window.__codexPending = window.lbeWallet.signDirect(${JSON.stringify(PRIMARY_CHAIN_ID)}, window.__codexKey.bech32Address, {
        chainId: ${JSON.stringify(PRIMARY_CHAIN_ID)},
        accountNumber: '0',
        bodyBytes: toBase64(Uint8Array.from([10, 0, 18, 0])),
        authInfoBytes: toBase64(Uint8Array.from([18, 0, 26, 0])),
      });
      return true;
    })()
  `);
  await approvePendingRequest(debugPort, extensionId, signDirectIds);
  const signDirectResult = await settlePendingProvider(page);
  assert(signDirectResult.ok, 'signDirect should succeed');

  logStep('provider flow: signAmino');
  const signAminoIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`
    (() => {
      window.__codexPending = window.lbeWallet.signAmino(${JSON.stringify(PRIMARY_CHAIN_ID)}, window.__codexKey.bech32Address, {
        chain_id: ${JSON.stringify(PRIMARY_CHAIN_ID)},
        account_number: '0',
        sequence: '0',
        fee: {
          amount: [{ denom: 'uatom', amount: '1' }],
          gas: '200000',
        },
        msgs: [{
          type: 'cosmos-sdk/MsgSend',
          value: {
            from_address: window.__codexKey.bech32Address,
            to_address: window.__codexKey.bech32Address,
            amount: [{ denom: 'uatom', amount: '1' }],
          },
        }],
        memo: 'browser-e2e-amino',
      });
      return true;
    })()
  `);
  await approvePendingRequest(debugPort, extensionId, signAminoIds);
  const signAminoResult = await settlePendingProvider(page);
  assert(signAminoResult.ok, 'signAmino should succeed');

  logStep('provider flow: signArbitrary');
  const signArbitraryIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`
    window.__codexPending = window.lbeWallet.request({
      method: 'signArbitrary',
      params: {
        chainId: ${JSON.stringify(PRIMARY_CHAIN_ID)},
        signer: window.__codexKey.bech32Address,
        data: 'browser-e2e-arbitrary-sign',
      },
    });
    true;
  `);
  await approvePendingRequest(debugPort, extensionId, signArbitraryIds);
  const signArbitraryResult = await settlePendingProvider(page);
  assert(signArbitraryResult.ok, 'signArbitrary should succeed');

  logStep('provider flow: sendTx invalid bytes');
  const sendTxIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`
    window.__codexPending = window.lbeWallet.request({
      method: 'sendTx',
      params: {
        chainId: ${JSON.stringify(PRIMARY_CHAIN_ID)},
        txBytes: [10, 0, 18, 0],
        mode: 'sync',
      },
    });
    true;
  `);
  await approvePendingRequest(debugPort, extensionId, sendTxIds);
  const sendTxResult = await settlePendingProvider(page);
  assert(!sendTxResult.ok, 'sendTx(invalid txBytes) should fail after approval');
  assert(![4001, 4100].includes(sendTxResult.error.code), 'sendTx(invalid txBytes) should reach broadcast failure, not authority rejection');

  logStep('provider flow: complete');
  page.close();
  await closeTarget(debugPort, providerTarget.id);
  return key.bech32Address;
};

const runProviderOriginIsolation = async (debugPort, extensionId, origin) => {
  logStep(`provider isolation: open secondary origin ${origin}`);
  const providerTarget = await openTarget(debugPort, 'about:blank');
  logStep(`provider isolation: target opened ${providerTarget.id}`);
  const page = await connectToTarget(providerTarget);
  logStep('provider isolation: devtools session connected');
  await page.navigate(`${origin}/tests/manual/provider-regression.html`);
  logStep('provider isolation: navigated to provider page');
  await page.waitFor(`location.origin === ${JSON.stringify(origin)}`, `secondary origin ${origin}`, 20_000);
  logStep('provider isolation: secondary origin resolved');
  await page.waitFor('typeof window.lbeWallet !== "undefined"', `provider injection on ${origin}`, 20_000);
  logStep('provider isolation: provider injected');
  const beforeEnableIds = new Set((await listTargets(debugPort)).map((target) => target.id));
  await page.evaluate(`window.__codexPending = window.lbeWallet.enable(${JSON.stringify(PRIMARY_CHAIN_ID)}); true;`);
  logStep('provider isolation: second origin requested fresh enable');
  await rejectPendingRequest(debugPort, extensionId, beforeEnableIds);
  const enableResult = await settlePendingProvider(page);
  assert(!enableResult.ok, 'secondary origin enable should not silently reuse prior authorization');
  assert(
    [4001, 4100].includes(enableResult.error.code),
    `secondary origin enable should reject with approval/authorization failure, got ${enableResult.error.code}`,
  );
  logStep('provider isolation: complete');
  page.close();
  await closeTarget(debugPort, providerTarget.id);
};

const runPopupSendSmoke = async (debugPort, extensionId, recipientAddress) => {
  logStep('popup smoke: open wallet home');
  const popupTarget = await openTarget(debugPort, `chrome-extension://${extensionId}/popup.html#/home/wallet`);
  const page = await connectToTarget(popupTarget);
  await page.waitForText('Tokens', 20_000);
  await page.waitForText('Transfer', 20_000);
  await page.waitFor('document.querySelectorAll(".item-card").length > 0', 'wallet asset rows', 20_000);

  logStep('popup smoke: reload wallet home');
  await page.reload();
  await page.waitForText('Tokens', 20_000);
  await page.waitFor('document.querySelectorAll(".item-card").length > 0', 'wallet asset rows after reload', 20_000);

  logStep('popup smoke: open crypto detail');
  await page.clickSelector('.item-card', 0);
  await page.waitForText('Transactions', 20_000);
  await page.waitForText('Current price', 20_000);
  logStep('popup smoke: drive send flow to confirm screen');
  await page.clickActionByLabel('Send');
  await page.waitForText('Send to', 20_000);
  await page.setInputValue('input[placeholder*="wallet address"]', recipientAddress);
  await page.clickButtonWithin('.select-address', 'NEXT');
  await page.waitForText('Transferable balance', 20_000);
  await page.waitForSelectorCount('.send-amount input', 1, 20_000);
  await page.setInputValue('.send-amount input', '1');
  await page.clickButtonWithin('.send-amount', 'NEXT');
  await delay(1000);
  const diagnostics = await page.getPopupSendDiagnostics();
  assert(diagnostics.sendInfoOpen, `Send confirm page did not open: ${JSON.stringify(diagnostics).slice(0, 3000)}`);
  assert(
    diagnostics.bodyText.includes('From'),
    `Send confirm page should show From. Current state: ${JSON.stringify(diagnostics).slice(0, 3000)}`,
  );
  await page.waitForText('To', 20_000);
  await page.waitForText('Confirm', 20_000);

  logStep('popup smoke: complete');
  page.close();
  await closeTarget(debugPort, popupTarget.id);
};

const main = async () => {
  const primaryServer = await startStaticServer({
    listenHost: '127.0.0.1',
    originHost: '127.0.0.1',
  });
  const secondaryServer = await startStaticServer({
    listenHost: '127.0.0.1',
    originHost: '127.0.0.1',
  });
  const browser = await launchEdge();
  try {
    const extensionId = await waitFor(
      async () => {
        try {
          return await resolveExtensionId(browser.debugPort);
        } catch {
          return null;
        }
      },
      { timeout: 20_000, label: 'loaded extension id' },
    );

    logStep(`resolved extension id ${extensionId}`);
    await setupWallet(browser.debugPort, extensionId);
    const recipientAddress = await runProviderPrimaryFlow(browser.debugPort, extensionId, primaryServer.origin);
    await runProviderOriginIsolation(browser.debugPort, extensionId, secondaryServer.origin);
    await runPopupSendSmoke(browser.debugPort, extensionId, recipientAddress);

    console.log('browser-e2e-regression-baseline: ok');
  } catch (error) {
    const stderrPath = writeE2eArtifact('browser-e2e-latest.stderr.log', browser.stderr());
    const stdoutPath = writeE2eArtifact('browser-e2e-latest.stdout.log', browser.stdout());
    const details = {
      error: summarizeError(error),
      e2eTempDir,
      edgeStderrPath: stderrPath,
      edgeStdoutPath: stdoutPath,
      edgeStderr: browser.stderr(),
      edgeStdout: browser.stdout(),
    };
    console.error(JSON.stringify(details, null, 2));
    throw error;
  } finally {
    await browser.close();
    await Promise.all([primaryServer.close(), secondaryServer.close()]);
  }
};

await main();
