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

const flowGuardsRaw = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/flowGuards.ts', import.meta.url),
  'utf8',
);
const controllerSharedRaw = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/controllerShared.ts', import.meta.url),
  'utf8',
);

assert.match(flowGuardsRaw, /runProviderRequestGuards/);
assert.doesNotMatch(flowGuardsRaw, /getRuntimeChainInterpretationByChainId/);
assert.doesNotMatch(flowGuardsRaw, /ensureRuntimeProvider[A-Za-z]+Context/);

assert.match(controllerSharedRaw, /getRuntimeChainInterpretationByChainId/);
assert.match(controllerSharedRaw, /ensureRuntimeProviderAccountReadContext/);
assert.match(controllerSharedRaw, /ensureRuntimeProviderSignDirectContext/);
assert.match(controllerSharedRaw, /ensureRuntimeProviderSignAminoContext/);
assert.match(controllerSharedRaw, /ensureRuntimeProviderSignArbitraryContext/);
assert.match(controllerSharedRaw, /ensureRuntimeProviderSendTxContext/);
assert.match(controllerSharedRaw, /buildRuntimeUnsupportedEntryDetails/);
assert.match(controllerSharedRaw, /getChainSourceByChainId/);
assert.match(controllerSharedRaw, /getRuntimeUnsupportedErrorData/);

const guardsSource = (await transpile(
  '../src/entrypoints/background/controller/provider/guards.ts',
  'guards.ts',
))
  .replace(
    "import { getOriginAuthorityState } from '@/entrypoints/background/service';",
    "import { getOriginAuthorityState } from './authority.stub.mjs';",
  )
  .replace(
    "import { rpcErrors } from '@/shared/rpc/errors';",
    "import { rpcErrors } from './rpc-errors.stub.mjs';",
  );

const flowGuardsSource = (await transpile(
  '../src/entrypoints/background/controller/provider/flowGuards.ts',
  'flowGuards.ts',
))
  .replace(
    "import { rpcErrors } from '@/shared/rpc/errors';",
    "import { rpcErrors } from './rpc-errors.stub.mjs';",
  )
  .replace(
    "import { resolveRequestedChainId } from './approvalPreview';",
    "import { resolveRequestedChainId } from './approval-preview.stub.mjs';",
  )
  .replace(
    "import { runProviderRequestGuards } from './guards';",
    "import { runProviderRequestGuards } from './guards.mjs';",
  );

const controllerSharedSource = (await transpile(
  '../src/entrypoints/background/controller/provider/controllerShared.ts',
  'controllerShared.ts',
))
  .replace(
    "import { rpcErrors } from '@/shared/rpc/errors';",
    "import { rpcErrors } from './rpc-errors.stub.mjs';",
  )
  .replace(
    "import { isSupportedCosmosChain } from '@/cosmos/chains/chain-registry';",
    "import { isSupportedCosmosChain } from './chain-registry.stub.mjs';",
  )
  .replace(
    /import\s*\{[^;]*getChainSourceByChainId[^;]*getRuntimeChainInterpretationByChainId[^;]*\}\s*from\s*'@\/cosmos\/chains\/chainRepository';/,
    "import { getChainSourceByChainId, getRuntimeChainInterpretationByChainId } from './chain-repository.stub.mjs';",
  )
  .replace(
    /import\s*\{[^;]*buildRuntimeUnsupportedEntryDetails[^;]*ensureRuntimeProviderAccountReadContext[^;]*ensureRuntimeProviderSignAminoContext[^;]*ensureRuntimeProviderSignArbitraryContext[^;]*ensureRuntimeProviderSendTxContext[^;]*ensureRuntimeProviderSignDirectContext[^;]*getRuntimeUnsupportedErrorData[^;]*\}\s*from\s*'@\/cosmos\/chains\/runtimeChainAdapter';/,
    "import { buildRuntimeUnsupportedEntryDetails, ensureRuntimeProviderAccountReadContext, ensureRuntimeProviderSignAminoContext, ensureRuntimeProviderSignArbitraryContext, ensureRuntimeProviderSendTxContext, ensureRuntimeProviderSignDirectContext, getRuntimeUnsupportedErrorData } from './runtime-chain-adapter.stub.mjs';",
  )
  .replace(
    "import { ensureEnabledChainForOrigin, parseProviderAccountIndex, resolveAuthorizedAccountIndex } from './guards';",
    "import { ensureEnabledChainForOrigin, parseProviderAccountIndex, resolveAuthorizedAccountIndex } from './guards.mjs';",
  );

const tempDir = await fs.mkdtemp(
  path.join(os.tmpdir(), 'authority-runtime-eligibility-'),
);

await fs.writeFile(path.join(tempDir, 'guards.mjs'), guardsSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'flowGuards.mjs'), flowGuardsSource, 'utf8');
await fs.writeFile(
  path.join(tempDir, 'controllerShared.mjs'),
  controllerSharedSource,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'authority.stub.mjs'),
  `
  const state = globalThis.__authorityRuntimeEligibilityState;
  export const getOriginAuthorityState = (origin) => state.origins[origin];
  `,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'rpc-errors.stub.mjs'),
  `
  const buildError = (code) => (input = {}) => {
    const { message, data } = typeof input === 'string' ? { message: input, data: undefined } : input;
    const error = new Error(message || code);
    error.code = code;
    error.data = data;
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

await fs.writeFile(
  path.join(tempDir, 'chain-registry.stub.mjs'),
  `
  export const isSupportedCosmosChain = (chainId) => chainId === 'cosmoshub-4';
  `,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'chain-repository.stub.mjs'),
  `
  const state = globalThis.__authorityRuntimeEligibilityState;
  export const getChainSourceByChainId = async (chainId) => state.chainSources[chainId];
  export const getRuntimeChainInterpretationByChainId = async (chainId) =>
    state.runtimeChains[chainId];
  `,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'runtime-chain-adapter.stub.mjs'),
  `
  export const buildRuntimeUnsupportedEntryDetails = ({ source, persisted, runtimeStatus, unsupportedReason } = {}) => ({
    source: source || 'custom',
    persisted: persisted ?? false,
    runtimeStatus: runtimeStatus || 'unsupported',
    unsupportedReason: unsupportedReason || 'not_persisted_runtime_candidate',
  });
  const ensureRuntime = (chain, capability, fallbackReason) => {
    if (!chain) {
      throw new Error(\`Chain "" cannot be used for \${capability}: \${fallbackReason}\`);
    }
    if (chain.runtimeUnsupportedReason) {
      const details = {
        source: chain.source,
        persisted: chain.persisted,
        runtimeStatus: chain.runtimeStatus,
        unsupportedReason: chain.runtimeUnsupportedReason,
      };
      const error = new Error(
        \`Chain "\${chain.chainId}" cannot be used for \${capability}: \${chain.runtimeUnsupportedReason}\`,
      );
      error.data = details;
      error.runtimeUnsupported = details;
      throw error;
    }
    return chain;
  };
  export const ensureRuntimeProviderAccountReadContext = (chain, capability = 'provider account read') =>
    ensureRuntime(chain, capability, 'missing_address_context');
  export const ensureRuntimeProviderSignDirectContext = (chain, capability = 'provider signDirect') =>
    ensureRuntime(chain, capability, 'missing_address_context');
  export const ensureRuntimeProviderSignAminoContext = (chain, capability = 'provider signAmino') =>
    ensureRuntime(chain, capability, 'missing_address_context');
  export const ensureRuntimeProviderSignArbitraryContext = (chain, capability = 'provider signArbitrary') =>
    ensureRuntime(chain, capability, 'missing_address_context');
  export const ensureRuntimeProviderSendTxContext = (chain, capability = 'provider sendTx') =>
    ensureRuntime(chain, capability, 'missing_runtime_transport');
  export const getRuntimeUnsupportedErrorData = (error) => error?.runtimeUnsupported || error?.data;
  `,
  'utf8',
);

globalThis.__authorityRuntimeEligibilityState = {
  chainSources: {
    'customhub-eligible-1': {
      source: 'custom',
      persisted: true,
    },
    'suggestedhub-eligible-1': {
      source: 'suggested',
      persisted: true,
    },
    'customhub-runtime-missing-1': {
      source: 'custom',
      persisted: true,
    },
    'suggestedhub-runtime-missing-1': {
      source: 'suggested',
      persisted: true,
    },
    'suggestedhub-sendtx-eligible-1': {
      source: 'suggested',
      persisted: true,
    },
  },
  origins: {
    'https://blocked.example.com': {
      hasPermission: false,
      enabledChains: ['customhub-eligible-1'],
      accountIndex: 7,
    },
    'https://allowed.example.com': {
      hasPermission: true,
      enabledChains: ['customhub-eligible-1', 'customhub-runtime-missing-1'],
      accountIndex: 3,
    },
    'https://other.example.com': {
      hasPermission: true,
      enabledChains: ['suggestedhub-eligible-1'],
      accountIndex: 1,
    },
    'https://sendtx.example.com': {
      hasPermission: true,
      enabledChains: ['suggestedhub-sendtx-eligible-1'],
      accountIndex: 9,
    },
  },
  runtimeChains: {
    'customhub-eligible-1': {
      chainId: 'customhub-eligible-1',
      source: 'custom',
      persisted: true,
      runtimeStatus: 'partial',
      runtimeUnsupportedReason: undefined,
    },
    'suggestedhub-eligible-1': {
      chainId: 'suggestedhub-eligible-1',
      source: 'suggested',
      persisted: true,
      runtimeStatus: 'partial',
      runtimeUnsupportedReason: undefined,
    },
    'customhub-runtime-missing-1': {
      chainId: 'customhub-runtime-missing-1',
      source: 'custom',
      persisted: true,
      runtimeStatus: 'partial',
      runtimeUnsupportedReason: 'missing_address_metadata',
    },
    'suggestedhub-runtime-missing-1': {
      chainId: 'suggestedhub-runtime-missing-1',
      source: 'suggested',
      persisted: true,
      runtimeStatus: 'partial',
      runtimeUnsupportedReason: 'missing_runtime_transport',
    },
    'suggestedhub-sendtx-eligible-1': {
      chainId: 'suggestedhub-sendtx-eligible-1',
      source: 'suggested',
      persisted: true,
      runtimeStatus: 'partial',
      runtimeUnsupportedReason: undefined,
    },
  },
};

const guardsModule = await import(
  pathToFileURL(path.join(tempDir, 'guards.mjs')).href
);
const flowGuardsModule = await import(
  pathToFileURL(path.join(tempDir, 'flowGuards.mjs')).href
);
const controllerSharedModule = await import(
  pathToFileURL(path.join(tempDir, 'controllerShared.mjs')).href
);

const { runProviderRequestGuards } = guardsModule;
const { executeProviderRequestGuards } = flowGuardsModule;
const {
  ensureProviderAccountReadableChain,
  ensureProviderSignDirectChain,
  ensureProviderSignAminoChain,
  ensureProviderSignArbitraryChain,
  ensureProviderSendTxChain,
} = controllerSharedModule;

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'signDirect',
      origin: 'https://blocked.example.com',
      chainId: 'customhub-eligible-1',
      accountIndex: 7,
    }),
  (error) => error?.code === 'unauthorized' && error?.data === undefined,
);

assert.throws(
  () =>
    executeProviderRequestGuards(
      {
        session: {
          origin: 'https://allowed.example.com',
          name: 'Allowed',
          icon: '',
          setProp: () => {},
        },
        data: {
          method: 'sign_direct',
          params: {
            chainIds: ['suggestedhub-eligible-1'],
            accountIndex: 3,
          },
        },
      },
      { mapMethod: 'signDirect' },
    ),
  (error) =>
    error?.code === 'unauthorized' &&
    String(error.message).includes('not enabled'),
);

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'getKey',
      origin: 'https://allowed.example.com',
      chainId: 'customhub-eligible-1',
      accountIndex: 4,
    }),
  (error) =>
    error?.code === 'unauthorized' &&
    String(error.message).includes('accountIndex "3"'),
);

assert.doesNotThrow(() =>
  runProviderRequestGuards({
    method: 'sendTx',
    origin: 'https://sendtx.example.com',
    chainId: 'suggestedhub-sendtx-eligible-1',
    accountIndex: 999,
  }),
);

assert.throws(
  () =>
    runProviderRequestGuards({
      method: 'signAmino',
      origin: 'https://other.example.com',
      chainId: 'suggestedhub-eligible-1',
      accountIndex: 3,
    }),
  (error) =>
    error?.code === 'unauthorized' &&
    String(error.message).includes('accountIndex "1"'),
);

assert.doesNotThrow(() =>
  runProviderRequestGuards({
    method: 'signDirect',
    origin: 'https://allowed.example.com',
    chainId: 'customhub-runtime-missing-1',
    accountIndex: 3,
  }),
);

await assert.rejects(
  () => ensureProviderSignDirectChain('customhub-runtime-missing-1'),
  (error) =>
    error?.code === 'invalidParams' &&
    String(error.message).includes('missing_address_metadata') &&
    error?.data?.source === 'custom' &&
    error?.data?.persisted === true &&
    error?.data?.runtimeStatus === 'partial' &&
    error?.data?.unsupportedReason === 'missing_address_metadata',
);

await assert.rejects(
  () => ensureProviderSendTxChain('suggestedhub-runtime-missing-1'),
  (error) =>
    error?.code === 'invalidParams' &&
    String(error.message).includes('missing_runtime_transport') &&
    error?.data?.source === 'suggested' &&
    error?.data?.persisted === true &&
    error?.data?.runtimeStatus === 'partial' &&
    error?.data?.unsupportedReason === 'missing_runtime_transport',
);

await assert.doesNotReject(() =>
  ensureProviderAccountReadableChain('customhub-eligible-1'),
);
await assert.doesNotReject(() =>
  ensureProviderSignDirectChain('suggestedhub-eligible-1'),
);
await assert.doesNotReject(() =>
  ensureProviderSignAminoChain('suggestedhub-eligible-1'),
);
await assert.doesNotReject(() =>
  ensureProviderSignArbitraryChain('suggestedhub-eligible-1'),
);
await assert.doesNotReject(() =>
  ensureProviderSendTxChain('suggestedhub-sendtx-eligible-1'),
);

await assert.doesNotReject(() =>
  ensureProviderSignDirectChain('cosmoshub-4'),
);

await assert.rejects(
  () => ensureProviderSignDirectChain('unknown-unsupported-1'),
  (error) =>
    error?.code === 'invalidParams' &&
    String(error.message).includes('Unsupported chainId') &&
    error?.data?.source === 'custom' &&
    error?.data?.persisted === false &&
    error?.data?.runtimeStatus === 'unsupported' &&
    error?.data?.unsupportedReason === 'not_persisted_runtime_candidate',
);

assert.throws(
  () =>
    executeProviderRequestGuards(
      {
        session: {
          origin: 'https://blocked.example.com',
          name: 'Blocked',
          icon: '',
          setProp: () => {},
        },
        data: {
          method: 'sign_direct',
          params: {
            chainId: 'customhub-eligible-1',
            accountIndex: 7,
          },
        },
      },
      { mapMethod: 'signDirect' },
    ),
  (error) => error?.code === 'unauthorized',
);

await assert.doesNotReject(() =>
  ensureProviderSignDirectChain('customhub-eligible-1'),
);

console.log('authority runtime eligibility hardening verification passed');
