import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const transpile = async (relativePath, fileName) => {
  const source = await fs.readFile(new URL(relativePath, import.meta.url), 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
};

const accountReadSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/accountReadHandlers.ts', import.meta.url),
  'utf8',
);
const signingSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/signingHandlers.ts', import.meta.url),
  'utf8',
);
const txSource = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/txHandlers.ts', import.meta.url),
  'utf8',
);

assert.match(
  accountReadSource,
  /export const getKey = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  accountReadSource,
  /export const getOfflineSignerAccounts = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingSource,
  /export const signAmino = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingSource,
  /export const signDirect = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingSource,
  /export const signArbitrary = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingSource,
  /export const verifyArbitrary = async[\s\S]*ensureSupportedChain\(normalizedChainId\)/,
);
assert.doesNotMatch(
  signingSource,
  /export const verifyArbitrary = async[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.doesNotMatch(
  signingSource,
  /export const verifyArbitrary = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)/,
);
assert.match(
  txSource,
  /export const sendTx = async[\s\S]*ensureProviderSendTxChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.doesNotMatch(
  txSource,
  /export const sendTx = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)/,
);

const guardsSource = (await transpile('../src/entrypoints/background/controller/provider/guards.ts', 'guards.ts'))
  .replace(
    "import { getOriginAuthorityState } from '@/entrypoints/background/service';",
    "import { getOriginAuthorityState } from './authority.stub.mjs';",
  )
  .replace("import { rpcErrors } from '@/shared/rpc/errors';", "import { rpcErrors } from './rpc-errors.stub.mjs';");

const flowGuardsSource = (await transpile('../src/entrypoints/background/controller/provider/flowGuards.ts', 'flowGuards.ts'))
  .replace("import { rpcErrors } from '@/shared/rpc/errors';", "import { rpcErrors } from './rpc-errors.stub.mjs';")
  .replace("import { resolveRequestedChainId } from './approvalPreview';", "import { resolveRequestedChainId } from './approval-preview.stub.mjs';")
  .replace("import { runProviderRequestGuards } from './guards';", "import { runProviderRequestGuards } from './guards.mjs';");

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'provider-authority-matrix-'));
await fs.writeFile(path.join(tempDir, 'guards.mjs'), guardsSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'flowGuards.mjs'), flowGuardsSource, 'utf8');

await fs.writeFile(
  path.join(tempDir, 'authority.stub.mjs'),
  `
  const state = globalThis.__providerAuthorityMatrixState;
  export const getOriginAuthorityState = (origin) => state.origins[origin];
  `,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'rpc-errors.stub.mjs'),
  `
  const buildError = (code) => (input = {}) => {
    const { message } = typeof input === 'string' ? { message: input } : input;
    const error = new Error(message || code);
    error.code = code;
    return error;
  };
  export const rpcErrors = {
    rpc: {
      invalidParams: buildError('invalidParams'),
      methodNotFound: buildError('methodNotFound'),
    },
    provider: {
      unauthorized: buildError('unauthorized'),
    },
  };
  `,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'approval-preview.stub.mjs'),
  `
  export const resolveRequestedChainId = (params) => params.chainId || params.chainIds?.[0] || '';
  `,
  'utf8',
);

globalThis.__providerAuthorityMatrixState = {
  origins: {
    'https://allowed.example.com': {
      hasPermission: true,
      enabledChains: ['cosmoshub-4'],
      accountIndex: 3,
    },
    'https://unbound.example.com': {
      hasPermission: true,
      enabledChains: ['cosmoshub-4'],
    },
    'https://chain-mismatch.example.com': {
      hasPermission: true,
      enabledChains: ['osmosis-1'],
      accountIndex: 1,
    },
  },
};

const guardsModule = await import(pathToFileURL(path.join(tempDir, 'guards.mjs')).href);
const flowGuardsModule = await import(pathToFileURL(path.join(tempDir, 'flowGuards.mjs')).href);

const {
  PROVIDER_AUTHORITY_GUARD_MATRIX,
  getProviderAuthorityGuardSpec,
  resolveAuthorizedAccountIndex,
  runProviderRequestGuards,
} = guardsModule;
const { executeProviderRequestGuards } = flowGuardsModule;

assert.deepEqual(PROVIDER_AUTHORITY_GUARD_MATRIX.enable, {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: false,
  requiresBoundAccount: false,
});
assert.deepEqual(getProviderAuthorityGuardSpec('getKey'), {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: true,
  requiresBoundAccount: true,
});
assert.deepEqual(getProviderAuthorityGuardSpec('signDirect'), {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: true,
  requiresBoundAccount: true,
});
assert.deepEqual(getProviderAuthorityGuardSpec('signArbitrary'), {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: true,
  requiresBoundAccount: true,
});
assert.deepEqual(getProviderAuthorityGuardSpec('getOfflineSignerAccounts'), {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: true,
  requiresBoundAccount: true,
});
assert.deepEqual(getProviderAuthorityGuardSpec('sendTx'), {
  requiresAuthorizedOrigin: true,
  requiresEnabledChain: true,
  requiresBoundAccount: false,
});
assert.deepEqual(getProviderAuthorityGuardSpec('verifyArbitrary'), {
  requiresAuthorizedOrigin: false,
  requiresEnabledChain: false,
  requiresBoundAccount: false,
});

assert.equal(resolveAuthorizedAccountIndex('https://allowed.example.com', undefined), 3);
assert.equal(resolveAuthorizedAccountIndex('https://allowed.example.com', '3'), 3);

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'getKey',
      origin: 'https://blocked.example.com',
      chainId: 'cosmoshub-4',
      accountIndex: 3,
    }),
  (error) => error?.code === 'unauthorized',
);
assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'enable',
      origin: 'https://blocked.example.com',
      chainId: 'cosmoshub-4',
    }),
  (error) => error?.code === 'unauthorized',
);
assert.doesNotThrow(() =>
  runProviderRequestGuards({
    method: 'verifyArbitrary',
    origin: 'https://blocked.example.com',
    chainId: 'cosmoshub-4',
  }),
);

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'signDirect',
      origin: 'https://allowed.example.com',
      chainId: 'osmosis-1',
      accountIndex: 3,
    }),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('not enabled'),
);
assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'sendTx',
      origin: 'https://allowed.example.com',
      chainId: 'osmosis-1',
      accountIndex: 99,
    }),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('not enabled'),
);

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'getOfflineSignerAccounts',
      origin: 'https://allowed.example.com',
      chainId: 'cosmoshub-4',
      accountIndex: 4,
    }),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('accountIndex "3"'),
);
assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'signAmino',
      origin: 'https://allowed.example.com',
      chainId: 'cosmoshub-4',
      accountIndex: 4,
    }),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('accountIndex "3"'),
);
assert.doesNotThrow(() =>
  runProviderRequestGuards({
    method: 'sendTx',
    origin: 'https://allowed.example.com',
    chainId: 'cosmoshub-4',
    accountIndex: 99,
  }),
);

assert.throws(
  () =>
    executeProviderRequestGuards(
      {
        session: {
          origin: 'https://allowed.example.com',
          name: 'Example',
          icon: '',
          setProp: () => {},
        },
        data: {
          method: 'sign_direct',
          params: {
            chainIds: ['osmosis-1'],
            accountIndex: 3,
          },
        },
      },
      { mapMethod: 'signDirect' },
    ),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('not enabled'),
);

assert.throws(
  () =>
    executeProviderRequestGuards(
      {
        session: {
          origin: 'https://allowed.example.com',
          name: 'Example',
          icon: '',
          setProp: () => {},
        },
        data: {
          method: 'get_key',
          params: {
            chainId: 'cosmoshub-4',
            accountIndex: 'bad-index',
          },
        },
      },
      { mapMethod: 'getKey' },
    ),
  (error) => error?.code === 'invalidParams' && String(error.message).includes('Invalid accountIndex'),
);

assert.doesNotThrow(() =>
  executeProviderRequestGuards(
    {
      session: {
        origin: 'https://allowed.example.com',
        name: 'Example',
        icon: '',
        setProp: () => {},
      },
      data: {
        method: 'send_tx',
        params: {
          chainId: 'cosmoshub-4',
          accountIndex: 999,
        },
      },
    },
    { mapMethod: 'sendTx' },
  ),
);

assert.throws(
  () =>
    executeProviderRequestGuards(
      {
        session: {
          origin: 'https://allowed.example.com',
          name: 'Example',
          icon: '',
          setProp: () => {},
        },
        data: {
          method: 'sign_arbitrary',
          params: {
            chainId: 'cosmoshub-4',
            accountIndex: 4,
          },
        },
      },
      { mapMethod: 'signArbitrary' },
    ),
  (error) => error?.code === 'unauthorized' && String(error.message).includes('accountIndex "3"'),
);

console.log('provider authority matrix hardening verification passed');
