import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const facade = await read('../src/popup/utils/sendFlowFacade.ts');
const selectAddress = await read('../src/popup/app/modal/selectAddress/index.tsx');
const sendAmount = await read('../src/popup/app/modal/sendAmount/index.tsx');
const sendInfo = await read('../src/popup/app/modal/sendInfo/index.tsx');

assert.match(facade, /export const loadSelectAddressGroups = async/);
assert.match(facade, /export const validateSendAddressForChain = async/);
assert.match(facade, /export const resolveSendAmountInputState =/);
assert.match(facade, /export const loadSendInfoContext = async/);
assert.match(facade, /export const submitSendFlow = async/);
assert.match(facade, /buildPopupSendFeePolicy/);
assert.match(facade, /ensureRuntimeExecutableSendFlowContext/);
assert.match(facade, /ensureRuntimeChainApprovalDisplayContext/);

assert.ok(
  /loadSelectAddressGroups/.test(selectAddress) || /useSelectAddressViewModel/.test(selectAddress),
  'SelectAddress should use the send flow facade directly or through the view model.',
);
assert.ok(
  /validateSendAddressForChain/.test(selectAddress) || /useSelectAddressViewModel/.test(selectAddress),
  'SelectAddress should use the send address validation directly or through the view model.',
);
assert.ok(
  /buildSendFlowTarget/.test(selectAddress) || /sendAmountStep/.test(selectAddress),
  'SelectAddress should prepare the send amount step payload directly or through the view model.',
);

assert.ok(
  /resolveSendAmountInputState/.test(sendAmount) || /useSendAmountViewModel/.test(sendAmount),
  'SendAmount should use send amount input resolution directly or through the view model.',
);
assert.ok(
  /buildSendFlowAmountStep/.test(sendAmount) || /sendInfoStep/.test(sendAmount),
  'SendAmount should prepare the send info step payload directly or through the view model.',
);

assert.ok(
  /loadSendInfoContext/.test(sendInfo) || /useSendInfoViewModel/.test(sendInfo),
  'SendInfo should use send context loading directly or through the view model.',
);
assert.ok(
  /submitSendFlow/.test(sendInfo) || /useSendInfoViewModel/.test(sendInfo),
  'SendInfo should use send submission directly or through the view model.',
);

console.log('send flow facade verification passed');
