import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { toBase64 } from '@cosmjs/encoding';
import { TxRaw, TxBody, AuthInfo, Fee, SignerInfo, ModeInfo } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import { Any } from 'cosmjs-types/google/protobuf/any.js';

const sourcePath = new URL('../src/entrypoints/background/controller/provider/approvalPreview.ts', import.meta.url);
const source = await fs.readFile(sourcePath, 'utf8');
const sharedPath = new URL('../src/shared/utils/approvalPreviewShared.ts', import.meta.url);
const sharedSource = await fs.readFile(sharedPath, 'utf8');
const txContractPath = new URL('../src/cosmos/tx/txContract.ts', import.meta.url);
const txContractSource = await fs.readFile(txContractPath, 'utf8');
const feePreviewContractPath = new URL('../src/cosmos/tx/feePreviewContract.ts', import.meta.url);
const feePreviewContractSource = await fs.readFile(feePreviewContractPath, 'utf8');
const txPreviewAdapterPath = new URL('../src/cosmos/tx/txPreviewAdapter.ts', import.meta.url);
const txPreviewAdapterSource = await fs.readFile(txPreviewAdapterPath, 'utf8');
const runtimeChainDisplayAdapterPath = new URL('../src/cosmos/chains/runtimeChainDisplayAdapter.ts', import.meta.url);
const runtimeChainDisplayAdapterSource = await fs.readFile(runtimeChainDisplayAdapterPath, 'utf8');
const runtimeChainNativeAssetDisplayAdapterPath = new URL('../src/cosmos/chains/runtimeChainNativeAssetDisplayAdapter.ts', import.meta.url);
const runtimeChainNativeAssetDisplayAdapterSource = await fs.readFile(runtimeChainNativeAssetDisplayAdapterPath, 'utf8');
const runtimeChainAddressDisplayAdapterPath = new URL('../src/cosmos/chains/runtimeChainAddressDisplayAdapter.ts', import.meta.url);
const runtimeChainAddressDisplayAdapterSource = await fs.readFile(runtimeChainAddressDisplayAdapterPath, 'utf8');
const suggestedChainDisplayCopyPath = new URL('../src/cosmos/chains/suggestedChainDisplayCopy.ts', import.meta.url);
const suggestedChainDisplayCopySource = await fs.readFile(suggestedChainDisplayCopyPath, 'utf8');
const runtimeChainAddTokenDisplayAdapterPath = new URL('../src/cosmos/chains/runtimeChainAddTokenDisplayAdapter.ts', import.meta.url);
const runtimeChainAddTokenDisplayAdapterSource = await fs.readFile(runtimeChainAddTokenDisplayAdapterPath, 'utf8');
const connectComponentPath = new URL('../src/popup/app/approval/component/Connect/index.tsx', import.meta.url);
const connectComponentSource = await fs.readFile(connectComponentPath, 'utf8');
const displayAdapterSource = runtimeChainDisplayAdapterSource;

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'approvalPreview.ts',
});
const transpiledShared = ts.transpileModule(sharedSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'approvalPreviewShared.ts',
});
const transpiledTxContract = ts.transpileModule(txContractSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'txContract.ts',
});
const transpiledFeePreviewContract = ts.transpileModule(feePreviewContractSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'feePreviewContract.ts',
});
const transpiledTxPreviewAdapter = ts.transpileModule(txPreviewAdapterSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'txPreviewAdapter.ts',
});
const transpiledRuntimeChainDisplayAdapter = ts.transpileModule(runtimeChainDisplayAdapterSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'runtimeChainDisplayAdapter.ts',
});
const transpiledRuntimeChainNativeAssetDisplayAdapter = ts.transpileModule(runtimeChainNativeAssetDisplayAdapterSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'runtimeChainNativeAssetDisplayAdapter.ts',
});
const transpiledRuntimeChainAddressDisplayAdapter = ts.transpileModule(runtimeChainAddressDisplayAdapterSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'runtimeChainAddressDisplayAdapter.ts',
});
const transpiledSuggestedChainDisplayCopy = ts.transpileModule(suggestedChainDisplayCopySource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'suggestedChainDisplayCopy.ts',
});

const previewSource = transpiled.outputText.replace(
  "import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';",
  "import { getCosmosChainConfig } from './chain-registry.stub.mjs';",
)
  .replace(
    "from '@/cosmos/chains/runtimeChainDisplayAdapter';",
    "from './runtimeChainDisplayAdapter.mjs';",
  )
  .replace(
    "from '@/cosmos/chains/runtimeChainAddressDisplayAdapter';",
    "from './runtimeChainAddressDisplayAdapter.mjs';",
  )
  .replace(
    "import { buildFallbackSendTxApprovalPreview } from '@/cosmos/tx/txPreviewAdapter';",
    "import { buildFallbackSendTxApprovalPreview } from './txPreviewAdapter.mjs';",
  )
  .replace(
    "from '@/shared/utils/approvalPreviewShared';",
    "from './approvalPreviewShared.mjs';",
  )
  .replace(
    "import { AuthInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';",
    "import { AuthInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';",
  );
const sharedPreviewSource = transpiledShared.outputText.replace(
  "import { AuthInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';",
  "import { AuthInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';",
).replace(
  "from '@/cosmos/tx/txPreviewAdapter';",
  "from './txPreviewAdapter.mjs';",
);
const txContractModuleSource = transpiledTxContract.outputText;
const feePreviewContractModuleSource = transpiledFeePreviewContract.outputText.replace(
  "from './txContract';",
  "from './txContract.mjs';",
);
const txPreviewAdapterModuleSource = transpiledTxPreviewAdapter.outputText.replace(
  "from './feePreviewContract';",
  "from './feePreviewContract.mjs';",
);
const runtimeChainDisplayAdapterModuleSource = transpiledRuntimeChainDisplayAdapter.outputText.replace(
  "from './chain-registry';",
  "from './chain-registry.stub.mjs';",
).replace(
  "from './runtimeChainNativeAssetDisplayAdapter';",
  "from './runtimeChainNativeAssetDisplayAdapter.mjs';",
).replace(
  "from './runtimeChainAddressDisplayAdapter';",
  "from './runtimeChainAddressDisplayAdapter.mjs';",
).replace(
  "from './suggestedChainDisplayCopy';",
  "from './suggestedChainDisplayCopy.mjs';",
);
const runtimeChainNativeAssetDisplayAdapterModuleSource =
  transpiledRuntimeChainNativeAssetDisplayAdapter.outputText.replace(
    "from './suggestedChainDisplayCopy';",
    "from './suggestedChainDisplayCopy.mjs';",
  );
const runtimeChainAddressDisplayAdapterModuleSource =
  transpiledRuntimeChainAddressDisplayAdapter.outputText.replace(
    "from './suggestedChainDisplayCopy';",
    "from './suggestedChainDisplayCopy.mjs';",
  );
const suggestedChainDisplayCopyModuleSource =
  transpiledSuggestedChainDisplayCopy.outputText;

const tempDir = await fs.mkdtemp(path.join(path.dirname(fileURLToPath(import.meta.url)), 'approval-preview-'));
const tempModulePath = path.join(tempDir, 'approvalPreview.mjs');

await fs.writeFile(
  path.join(tempDir, 'chain-registry.stub.mjs'),
  `
export const getCosmosChainConfig = (chainId) =>
  chainId === 'cosmoshub-4' ? { chainName: 'Cosmos Hub' } : undefined;
`,
  'utf8',
);

await fs.writeFile(tempModulePath, previewSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'approvalPreviewShared.mjs'), sharedPreviewSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'txContract.mjs'), txContractModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'feePreviewContract.mjs'), feePreviewContractModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'txPreviewAdapter.mjs'), txPreviewAdapterModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'runtimeChainDisplayAdapter.mjs'), runtimeChainDisplayAdapterModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'runtimeChainNativeAssetDisplayAdapter.mjs'), runtimeChainNativeAssetDisplayAdapterModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'runtimeChainAddressDisplayAdapter.mjs'), runtimeChainAddressDisplayAdapterModuleSource, 'utf8');
await fs.writeFile(path.join(tempDir, 'suggestedChainDisplayCopy.mjs'), suggestedChainDisplayCopyModuleSource, 'utf8');

const previewModule = await import(pathToFileURL(tempModulePath).href);
const {
  buildConnectApprovalParams,
  buildCosmosSignApprovalParams,
  buildCosmosSendTxApprovalParams,
} = previewModule;

const connectParams = buildConnectApprovalParams(
  'enable',
  { chainIds: ['cosmoshub-4'] },
  { origin: 'https://app.example.com', name: 'Example', icon: 'https://app.example.com/icon.png' },
);

assert.equal(connectParams.preview.requestMethod, 'enable');
assert.equal(connectParams.preview.requestedChainId, 'cosmoshub-4');
assert.equal(connectParams.preview.requestedChainName, 'Cosmos Hub');

const customConnectParams = buildConnectApprovalParams(
  'connect',
  {
    chainId: 'custom-1',
    chainName: 'Custom Chain',
    symbol: 'CTK',
    minimalDenom: 'uctk',
    decimals: 6,
  },
  { origin: 'https://custom.example.com', name: 'Custom App', icon: '' },
);

assert.equal(customConnectParams.preview.requestedChainName, 'Custom Chain (Custom)');
assert.equal(customConnectParams.preview.requestedNativeAssetLabel, 'CTK (uctk)');
assert.match(customConnectParams.preview.requestedChainTitle, /Custom Chain \(Custom\)/);
assert.match(customConnectParams.preview.requestedNativeAssetExplanation, /Other runtime capabilities may still be partial/);
assert.match(customConnectParams.preview.requestedChainSubtitle, /Symbol: CTK [·路] Denom: uctk [·路] Decimals: 6/);

const customAddressConnectParams = buildConnectApprovalParams(
  'connect',
  {
    chainId: 'custom-1',
    chainName: 'Custom Chain',
    addressContext: {
      bech32Prefix: 'custom',
      coinType: 118,
    },
  },
  { origin: 'https://custom.example.com', name: 'Custom App', icon: '' },
);

assert.equal(customAddressConnectParams.preview.requestedAddressLabel, 'Accounts connected (chain-specific)');
assert.equal(customAddressConnectParams.preview.requestedAddressSourceText, 'Derived using custom prefix');
assert.equal(customAddressConnectParams.preview.requestedAddressTitle, 'Custom Chain address context: custom');
assert.match(customAddressConnectParams.preview.requestedAddressSubtitle, /bech32 prefix custom [·路] coin type 118/);
assert.match(customAddressConnectParams.preview.requestedAddressExplanation, /chain-specific derived address/);

const suggestedConnectParams = buildConnectApprovalParams(
  'connect',
  {
    chainInfo: {
      chainId: 'suggested-1',
      chainName: 'Suggested Chain',
      stakeCurrency: {
        coinDenom: 'SUG',
        coinMinimalDenom: 'usug',
        coinDecimals: 6,
      },
      bech32Config: {
        bech32PrefixAccAddr: 'suggested',
      },
      bip44: {
        coinType: 118,
      },
    },
  },
  { origin: 'https://suggested.example.com', name: 'Suggested App', icon: '' },
);

assert.equal(suggestedConnectParams.preview.requestedChainName, 'Suggested Chain (Suggested)');
assert.equal(suggestedConnectParams.preview.requestedNativeAssetLabel, 'SUG (usug)');
assert.match(suggestedConnectParams.preview.requestedChainSubtitle, /Symbol: SUG - Denom: usug - Decimals: 6/);
assert.match(suggestedConnectParams.preview.requestedChainSubtitle, /bech32 prefix suggested - coin type 118/);
assert.match(suggestedConnectParams.preview.requestedNativeAssetExplanation, /Suggested chain display uses SUG \(usug\) as native asset context/);
assert.equal(suggestedConnectParams.preview.requestedAddressLabel, 'Accounts connected (suggested context)');
assert.equal(suggestedConnectParams.preview.requestedAddressSourceText, 'Suggested bech32 prefix suggested');
assert.match(suggestedConnectParams.preview.requestedAddressTitle, /Suggested Chain suggested address context/);
assert.match(suggestedConnectParams.preview.requestedAddressTitle, /bech32 prefix suggested - coin type 118/);
assert.match(suggestedConnectParams.preview.requestedAddressSubtitle, /bech32 prefix suggested - coin type 118/);
assert.match(suggestedConnectParams.preview.requestedAddressExplanation, /approval may still use fallback addresses and runtime support remains partial/);

const aminoParams = buildCosmosSignApprovalParams(
  'signAmino',
  {
    chainId: 'cosmoshub-4',
    signer: 'cosmos1abc',
    signDoc: {
      chain_id: 'cosmoshub-4',
      account_number: '7',
      sequence: '9',
      memo: 'hello',
      msgs: [{ type: 'cosmos-sdk/MsgSend' }],
      fee: {
        gas: '120000',
        amount: [{ amount: '50', denom: 'uatom' }],
      },
    },
  },
  { origin: 'https://app.example.com', name: 'Example', icon: '' },
);

assert.equal(aminoParams.preview.mode, 'amino');
assert.equal(aminoParams.preview.chainId, 'cosmoshub-4');
assert.equal(aminoParams.preview.accountNumber, '7');
assert.equal(aminoParams.preview.gasLimit, '120000');
assert.deepEqual(aminoParams.preview.messageTypes, ['cosmos-sdk/MsgSend']);
assert.deepEqual(aminoParams.preview.feeCoins, ['50 uatom']);

const directBodyBytes = TxBody.encode(
  TxBody.fromPartial({
    memo: 'memo-direct',
    messages: [Any.fromPartial({ typeUrl: '/cosmos.bank.v1beta1.MsgSend' })],
  }),
).finish();
const directAuthInfoBytes = AuthInfo.encode(
  AuthInfo.fromPartial({
    signerInfos: [SignerInfo.fromPartial({ modeInfo: ModeInfo.fromPartial({}) })],
    fee: Fee.fromPartial({
      gasLimit: BigInt(220000),
      amount: [{ amount: '88', denom: 'uatom' }],
    }),
  }),
).finish();

const directParams = buildCosmosSignApprovalParams(
  'signDirect',
  {
    chainId: 'cosmoshub-4',
    signer: 'cosmos1abc',
    signDoc: {
      chainId: 'cosmoshub-4',
      accountNumber: '11',
      bodyBytes: toBase64(directBodyBytes),
      authInfoBytes: toBase64(directAuthInfoBytes),
    },
  },
  { origin: 'https://app.example.com', name: 'Example', icon: '' },
);

assert.equal(directParams.preview.mode, 'direct');
assert.equal(directParams.preview.memo, 'memo-direct');
assert.deepEqual(directParams.preview.messageTypes, ['/cosmos.bank.v1beta1.MsgSend']);

const txBytes = TxRaw.encode(
  TxRaw.fromPartial({
    bodyBytes: directBodyBytes,
    authInfoBytes: directAuthInfoBytes,
    signatures: [new Uint8Array([1, 2, 3])],
  }),
).finish();

const sendTxParams = buildCosmosSendTxApprovalParams(
  'sendTx',
  {
    chainId: 'cosmoshub-4',
    txBytes: toBase64(txBytes),
    mode: 'sync',
  },
  { origin: 'https://app.example.com', name: 'Example', icon: '' },
);

assert.equal(sendTxParams.preview.txSize > 0, true);
assert.equal(sendTxParams.preview.memo, 'memo-direct');
assert.equal(sendTxParams.preview.signatureCount, 1);
assert.deepEqual(sendTxParams.preview.messageTypes, ['/cosmos.bank.v1beta1.MsgSend']);
assert.equal(sendTxParams.preview.feePolicy.mode, 'sync');
assert.equal(sendTxParams.preview.feePolicy.gasLimit, '220000');
assert.deepEqual(sendTxParams.preview.feePolicy.feeCoins, ['88 uatom']);

assert.match(connectComponentSource, /ensureRuntimeChainApprovalDisplayContext/);
assert.match(connectComponentSource, /buildRequestedRuntimeChainDisplayContext/);
assert.match(connectComponentSource, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(connectComponentSource, /buildSuggestedRuntimeChainDisplayPropShapeFromPreview/);
assert.match(connectComponentSource, /requestedNativeAssetExplanation/);
assert.match(connectComponentSource, /requestedAddressExplanation/);
assert.match(connectComponentSource, /requestedAddressLabel/);
assert.match(displayAdapterSource, /buildSuggestedRuntimeChainDisplayContextFromInfo/);
assert.match(displayAdapterSource, /buildSuggestedRuntimeChainDisplayAssembly/);
assert.match(displayAdapterSource, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(displayAdapterSource, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(displayAdapterSource, /Native asset:/);
assert.match(displayAdapterSource, /nativeAssetContext/);
assert.match(displayAdapterSource, /nativeAssetDisplay/);
assert.match(source, /buildSuggestedRuntimeChainApprovalPreviewDisplayContext/);
assert.match(runtimeChainNativeAssetDisplayAdapterSource, /Custom chain native asset fallback uses/);
assert.match(runtimeChainNativeAssetDisplayAdapterSource, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedChainDisplayCopySource, /buildSuggestedNativeAssetPreviewExplanation/);
assert.match(suggestedChainDisplayCopySource, /Suggested chain display uses/);
assert.match(runtimeChainAddressDisplayAdapterSource, /buildRuntimeChainApprovalAddressDisplayContext/);
assert.match(runtimeChainAddressDisplayAdapterSource, /typed or wallet address/);
assert.match(runtimeChainAddressDisplayAdapterSource, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedChainDisplayCopySource, /buildSuggestedAddressSourceText/);
assert.match(suggestedChainDisplayCopySource, /Suggested bech32 prefix/);
assert.match(runtimeChainAddTokenDisplayAdapterSource, /buildRuntimeChainAddTokenAddressDisplayContext/);
assert.match(runtimeChainAddTokenDisplayAdapterSource, /buildSuggestedRuntimeChainDisplayPropShape/);
assert.match(runtimeChainAddTokenDisplayAdapterSource, /from '\.\/suggestedChainDisplayCopy'/);
assert.match(suggestedChainDisplayCopySource, /the current address is a typed fallback/);
assert.match(suggestedChainDisplayCopySource, /using a wallet fallback for display only/);
assert.match(suggestedChainDisplayCopySource, /suggested chain exposes address metadata for AddToken display/);

console.log('provider approval preview verification passed');
