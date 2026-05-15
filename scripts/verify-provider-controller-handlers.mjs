import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const transpileFile = async (relativePath, fileName) => {
  const source = await fs.readFile(new URL(relativePath, import.meta.url), 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
};

const accountReadRaw = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/accountReadHandlers.ts', import.meta.url),
  'utf8',
);
const signingRaw = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/signingHandlers.ts', import.meta.url),
  'utf8',
);
const txRaw = await fs.readFile(
  new URL('../src/entrypoints/background/controller/provider/txHandlers.ts', import.meta.url),
  'utf8',
);

assert.match(
  accountReadRaw,
  /export const getKey = async[\s\S]*await ensureProviderAccountReadableChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  accountReadRaw,
  /export const getKey = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  accountReadRaw,
  /export const getOfflineSignerAccounts = async[\s\S]*await ensureProviderAccountReadableChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  accountReadRaw,
  /export const getOfflineSignerAccounts = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signDirect = async[\s\S]*await ensureProviderSignDirectChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signDirect = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signAmino = async[\s\S]*await ensureProviderSignAminoChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signAmino = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signArbitrary = async[\s\S]*await ensureProviderSignArbitraryChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const signArbitrary = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  signingRaw,
  /export const verifyArbitrary = async[\s\S]*ensureSupportedChain\(normalizedChainId\)/,
);
assert.doesNotMatch(
  signingRaw,
  /export const verifyArbitrary = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)/,
);
assert.match(
  txRaw,
  /export const sendTx = async[\s\S]*await ensureProviderSendTxChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.match(
  txRaw,
  /export const sendTx = async[\s\S]*ensureProviderSendTxChain\(normalizedChainId\)[\s\S]*ensureEnabledChain\(origin, normalizedChainId\)/,
);
assert.doesNotMatch(
  txRaw,
  /export const sendTx = async[\s\S]*resolveAccountIndex\(origin, accountIndex\)/,
);

const sharedSource = (await transpileFile('../src/entrypoints/background/controller/provider/controllerShared.ts', 'controllerShared.ts'))
  .replace("import { rpcErrors } from '@/shared/rpc/errors';", "import { rpcErrors } from './rpc-errors.stub.mjs';")
  .replace("import { isSupportedCosmosChain } from '@/cosmos/chains/chain-registry';", "import { isSupportedCosmosChain } from './chain-registry.stub.mjs';")
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
    "import { ensureEnabledChainForOrigin, parseProviderAccountIndex, resolveAuthorizedAccountIndex } from './guards.stub.mjs';",
  );

const accountReadSource = (await transpileFile('../src/entrypoints/background/controller/provider/accountReadHandlers.ts', 'accountReadHandlers.ts'))
  .replace("import wallet from '../wallet';", "import wallet from './wallet.stub.mjs';")
  .replace(/import\s*\{[^;]*\}\s*from\s*'\.\/controllerShared';/, "import { ensureChainId, ensureEnabledChain, ensureProviderAccountReadableChain, getProviderParams, resolveAccountIndex } from './controllerShared.mjs';");

const signingSource = (await transpileFile('../src/entrypoints/background/controller/provider/signingHandlers.ts', 'signingHandlers.ts'))
  .replace("import wallet from '../wallet';", "import wallet from './wallet.stub.mjs';")
  .replace(/import\s*\{[^;]*\}\s*from\s*'\.\/controllerShared';/, "import { ensureChainId, ensureEnabledChain, ensureProviderSignAminoChain, ensureProviderSignArbitraryChain, ensureProviderSignDirectChain, ensureRequiredObject, ensureRequiredString, ensureRequiredValue, ensureSupportedChain, getProviderParams, resolveAccountIndex } from './controllerShared.mjs';");

const txSource = (await transpileFile('../src/entrypoints/background/controller/provider/txHandlers.ts', 'txHandlers.ts'))
  .replace("import wallet from '../wallet';", "import wallet from './wallet.stub.mjs';")
  .replace("import { rpcErrors } from '@/shared/rpc/errors';", "import { rpcErrors } from './rpc-errors.stub.mjs';")
  .replace(
    /import\s*\{[^;]*buildProviderBroadcastTxRequest[^;]*normalizeTxBroadcastMode[^;]*\}\s*from\s*'@\/cosmos\/tx\/txContract';/,
    "import { buildProviderBroadcastTxRequest, normalizeTxBroadcastMode } from './tx-contract.stub.mjs';",
  )
  .replace(/import\s*\{[^;]*\}\s*from\s*'\.\/controllerShared';/, "import { ensureChainId, ensureEnabledChain, ensureProviderSendTxChain, ensureRequiredValue, getProviderParams } from './controllerShared.mjs';");

const tempDir = await fs.mkdtemp(path.join(scriptDir, 'provider-controller-handlers-'));
await fs.writeFile(path.join(tempDir, 'controllerShared.mjs'), sharedSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'accountReadHandlers.mjs'), accountReadSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'signingHandlers.mjs'), signingSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'txHandlers.mjs'), txSource, 'utf8');

await fs.writeFile(
  path.join(tempDir, 'tx-contract.stub.mjs'),
  `
export const normalizeTxBroadcastMode = (mode, fallback = 'sync') => {
  if (mode === undefined || mode === null || mode === '') return fallback;
  return ['sync', 'async', 'block'].includes(mode) ? mode : null;
};
export const buildProviderBroadcastTxRequest = ({ chainId, txBytes, mode, memo = '' }) => {
  const normalizedMode = normalizeTxBroadcastMode(mode, 'sync');
  if (!normalizedMode) return null;
  return { kind: 'provider_sendTx', chainId, txBytes, mode: normalizedMode, memo };
};
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
  },
};
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
export const getChainSourceByChainId = async (chainId) => {
  if (chainId === 'customhub-1') {
    return { source: 'custom', persisted: true };
  }
  return undefined;
};
export const getRuntimeChainInterpretationByChainId = async (chainId) => {
  if (chainId !== 'customhub-1') {
    return undefined;
  }
  return {
    source: 'custom',
    persisted: true,
    chainId: 'customhub-1',
    chainName: 'Custom Hub',
    runtimeStatus: 'partial',
    unsupportedReason: 'custom_chain_missing_runtime_metadata',
    rpc: 'https://rpc.customhub.example',
    rest: '',
    chainInfo: undefined,
    nativeAssetContext: null,
    addressContext: {
      bech32Prefix: 'custom',
      coinType: 118,
    },
    capabilityMatrix: {
      addressDerivation: {
        supported: true,
        contractKind: 'selective-partial',
      },
    },
  };
};
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
export const ensureRuntimeProviderAccountReadContext = (chain) => {
  if (chain?.chainId !== 'customhub-1') {
    throw new Error(\`Chain "\${chain?.chainId || ''}" cannot be used for provider account read: not_persisted_runtime_candidate\`);
  }
  return chain;
};
export const ensureRuntimeProviderSignAminoContext = (chain) => {
  if (chain?.chainId !== 'customhub-1') {
    throw new Error(\`Chain "\${chain?.chainId || ''}" cannot be used for provider signAmino: not_persisted_runtime_candidate\`);
  }
  return chain;
};
export const ensureRuntimeProviderSignArbitraryContext = (chain) => {
  if (chain?.chainId !== 'customhub-1') {
    throw new Error(\`Chain "\${chain?.chainId || ''}" cannot be used for provider signArbitrary: not_persisted_runtime_candidate\`);
  }
  return chain;
};
export const ensureRuntimeProviderSendTxContext = (chain) => {
  if (chain?.chainId !== 'customhub-1') {
    throw new Error(\`Chain "\${chain?.chainId || ''}" cannot be used for provider sendTx: not_persisted_runtime_candidate\`);
  }
  return chain;
};
export const ensureRuntimeProviderSignDirectContext = (chain) => {
  if (chain?.chainId !== 'customhub-1') {
    throw new Error(\`Chain "\${chain?.chainId || ''}" cannot be used for provider signDirect: not_persisted_runtime_candidate\`);
  }
  return chain;
};
export const getRuntimeUnsupportedErrorData = (error) => error?.runtimeUnsupported || error?.data;
`,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'guards.stub.mjs'),
  `
export const parseProviderAccountIndex = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = typeof value === 'string' ? Number(value.trim()) : value;
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : undefined;
};
export const resolveAuthorizedAccountIndex = (_origin, value) => parseProviderAccountIndex(value);
export const ensureEnabledChainForOrigin = () => undefined;
`,
  'utf8',
);

await fs.writeFile(
  path.join(tempDir, 'wallet.stub.mjs'),
  `
export const calls = [];
const wallet = {
  getCosmosKey: async (...args) => {
    calls.push(['getCosmosKey', ...args]);
    return { ok: 'key' };
  },
  getOfflineSignerAccounts: async (...args) => {
    calls.push(['getOfflineSignerAccounts', ...args]);
    return [{ address: 'cosmos1abc' }];
  },
  signCosmosAmino: async (...args) => {
    calls.push(['signCosmosAmino', ...args]);
    return { signed: 'amino' };
  },
  signCosmosProviderAmino: async (...args) => {
    calls.push(['signCosmosProviderAmino', ...args]);
    return { signed: 'provider-amino' };
  },
  signCosmosDirect: async (...args) => {
    calls.push(['signCosmosDirect', ...args]);
    return { signed: 'direct' };
  },
  signCosmosProviderDirect: async (...args) => {
    calls.push(['signCosmosProviderDirect', ...args]);
    return { signed: 'provider-direct' };
  },
  signCosmosProviderArbitrary: async (...args) => {
    calls.push(['signCosmosProviderArbitrary', ...args]);
    return { signed: 'provider-arbitrary' };
  },
  signCosmosArbitrary: async (...args) => {
    calls.push(['signCosmosArbitrary', ...args]);
    return { signed: 'arbitrary' };
  },
  verifyCosmosArbitrary: async (...args) => {
    calls.push(['verifyCosmosArbitrary', ...args]);
    return true;
  },
  sendCosmosTx: async (...args) => {
    calls.push(['sendCosmosTx', ...args]);
    return { txhash: 'ABC' };
  },
  sendCosmosProviderTx: async (...args) => {
    calls.push(['sendCosmosProviderTx', ...args]);
    return { txhash: 'CUSTOM' };
  },
};
export default wallet;
`,
  'utf8',
);

const { getKey, getOfflineSignerAccounts } = await import(pathToFileURL(path.join(tempDir, 'accountReadHandlers.mjs')).href);
const { signAmino, signDirect, signArbitrary, verifyArbitrary } = await import(pathToFileURL(path.join(tempDir, 'signingHandlers.mjs')).href);
const { sendTx } = await import(pathToFileURL(path.join(tempDir, 'txHandlers.mjs')).href);
const walletStub = await import(pathToFileURL(path.join(tempDir, 'wallet.stub.mjs')).href);

const baseReq = {
  session: { origin: 'https://app.example.com', name: 'Example', icon: '' },
};

await getKey({
  ...baseReq,
  data: { method: 'get_key', params: { chainId: 'cosmoshub-4', accountIndex: 2 } },
});
await getKey({
  ...baseReq,
  data: { method: 'get_key', params: { chainId: 'customhub-1', accountIndex: 7 } },
});
await getOfflineSignerAccounts({
  ...baseReq,
  data: { method: 'get_offline_signer_accounts', params: { chainId: 'cosmoshub-4', accountIndex: 3 } },
});
await getOfflineSignerAccounts({
  ...baseReq,
  data: { method: 'get_offline_signer_accounts', params: { chainId: 'customhub-1', accountIndex: 8 } },
});
await signAmino({
  ...baseReq,
  data: { method: 'sign_amino', params: { chainId: 'cosmoshub-4', signer: 'cosmos1abc', signDoc: {}, accountIndex: 4 } },
});
await signAmino({
  ...baseReq,
  data: { method: 'sign_amino', params: { chainId: 'customhub-1', signer: 'custom1abc', signDoc: {}, accountIndex: 9 } },
});
await signDirect({
  ...baseReq,
  data: { method: 'sign_direct', params: { chainId: 'cosmoshub-4', signer: 'cosmos1abc', signDoc: {}, accountIndex: 5 } },
});
await signDirect({
  ...baseReq,
  data: { method: 'sign_direct', params: { chainId: 'customhub-1', signer: 'custom1abc', signDoc: {}, accountIndex: 10 } },
});
await signArbitrary({
  ...baseReq,
  data: { method: 'sign_arbitrary', params: { chainId: 'cosmoshub-4', signer: 'cosmos1abc', data: 'hello', accountIndex: 6 } },
});
await signArbitrary({
  ...baseReq,
  data: { method: 'sign_arbitrary', params: { chainId: 'customhub-1', signer: 'custom1abc', data: 'hello', accountIndex: 11 } },
});
await verifyArbitrary({
  ...baseReq,
  data: { method: 'verify_arbitrary', params: { chainId: 'cosmoshub-4', signer: 'cosmos1abc', data: 'hello', signature: 'sig' } },
});
await sendTx({
  ...baseReq,
  data: { method: 'send_tx', params: { chainId: 'cosmoshub-4', txBytes: 'AQID', mode: 'block' } },
});
await sendTx({
  ...baseReq,
  data: { method: 'send_tx', params: { chainId: 'customhub-1', txBytes: 'AQID', mode: 'sync' } },
});

assert.deepEqual(walletStub.calls[0], ['getCosmosKey', 'cosmoshub-4', 2]);
assert.deepEqual(walletStub.calls[1], ['getCosmosKey', 'customhub-1', 7]);
assert.deepEqual(walletStub.calls[2], ['getOfflineSignerAccounts', 'cosmoshub-4', 3]);
assert.deepEqual(walletStub.calls[3], ['getOfflineSignerAccounts', 'customhub-1', 8]);
assert.deepEqual(walletStub.calls[4], ['signCosmosProviderAmino', 'cosmoshub-4', 'cosmos1abc', {}, 4]);
assert.deepEqual(walletStub.calls[5], ['signCosmosProviderAmino', 'customhub-1', 'custom1abc', {}, 9]);
assert.deepEqual(walletStub.calls[6], ['signCosmosProviderDirect', 'cosmoshub-4', 'cosmos1abc', {}, 5]);
assert.deepEqual(walletStub.calls[7], ['signCosmosProviderDirect', 'customhub-1', 'custom1abc', {}, 10]);
assert.deepEqual(walletStub.calls[8], ['signCosmosProviderArbitrary', 'cosmoshub-4', 'cosmos1abc', 'hello', 6]);
assert.deepEqual(walletStub.calls[9], ['signCosmosProviderArbitrary', 'customhub-1', 'custom1abc', 'hello', 11]);
assert.deepEqual(walletStub.calls[10], ['verifyCosmosArbitrary', 'cosmoshub-4', 'cosmos1abc', 'hello', 'sig']);
assert.deepEqual(walletStub.calls[11], ['sendCosmosProviderTx', 'cosmoshub-4', 'AQID', 'block']);
assert.deepEqual(walletStub.calls[12], ['sendCosmosProviderTx', 'customhub-1', 'AQID', 'sync']);

await assert.rejects(
  () =>
    signAmino({
      ...baseReq,
      data: { method: 'sign_amino', params: { chainId: 'cosmoshub-4', signDoc: {} } },
    }),
  (error) => error?.code === 'invalidParams' && String(error.message).includes('signer is required'),
);

await assert.rejects(
  () =>
    sendTx({
      ...baseReq,
      data: { method: 'send_tx', params: { chainId: 'cosmoshub-4', txBytes: 'AQID', mode: 'weird' } },
    }),
  (error) => error?.code === 'invalidParams' && String(error.message).includes('Unsupported broadcast mode'),
);

console.log('provider controller handlers verification passed');
