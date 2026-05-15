import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) =>
  fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const capability = await read('../src/cosmos/chains/runtimeChainCapability.ts');
const signerResolver = await read(
  '../src/entrypoints/background/service/keyring/signerResolver.ts',
);
const cosmosSend = await read('../src/popup/utils/cosmosSend.ts');
const sendFlowFacade = await read('../src/popup/utils/sendFlowFacade.ts');

assert.match(
  capability,
  /const buildRuntimeSendCapabilitySupport =[\s\S]*?interpretation\.source === 'suggested'[\s\S]*?interpretation\.persisted[\s\S]*?hasSatisfiedRuntimeSendPreconditions/s,
);

assert.match(signerResolver, /getRuntimeChainInterpretationByChainId/);
assert.match(signerResolver, /ensureRuntimeExecutableSendFlowContext/);
assert.match(signerResolver, /ensureRuntimeChainAddressContext/);
assert.match(signerResolver, /const resolveSignerChainContext = async/);
assert.match(
  signerResolver,
  /const getBuiltinSignerChainContext =/,
);
assert.match(
  signerResolver,
  /ensureRuntimeSignerChainContext\(\s*chainId,\s*'popup native send signer',\s*ensureRuntimeExecutableSendFlowContext/s,
);

assert.match(cosmosSend, /createWalletDirectSigner/);
assert.match(cosmosSend, /SigningStargateClient\.connectWithSigner/);
assert.match(cosmosSend, /client\.signAndBroadcast/);
assert.match(cosmosSend, /ensureRuntimeExecutableSendFlowContext/);

assert.match(sendFlowFacade, /sendCosmosToken\(/);
assert.match(sendFlowFacade, /ensureRuntimeExecutableSendFlowContext/);

console.log('suggested chain native send execution upgrade verification passed');
