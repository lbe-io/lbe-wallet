import { fromBech32 } from '@cosmjs/encoding';
import { getAccountsByWalletId, getAddressByChainId, getAllWallets, getWalletAccountByAddress, type ChainToken } from '@/cosmos/storage';
import { getChainSourceByChainId, getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import {
  buildRuntimeUnsupportedEntryError,
  ensureRuntimeChainAddressContext,
  ensureRuntimeChainApprovalDisplayContext,
  ensureRuntimeChainNativeAssetContext,
  ensureRuntimeExecutableSendFlowContext,
  hasRuntimeChainCapability,
} from '@/cosmos/chains/runtimeChainAdapter';
import { buildPopupSendFeePolicy } from '@/cosmos/tx/feePreviewContract';
import type { PopupSendTxResult } from '@/cosmos/tx/txContract';
import eventBus from '@/shared/events';
import { EVENTS } from '@/shared/constants';
import { refreshCosmosAccountAssets } from '@/popup/utils/refreshCosmosAssets';
import { sendCosmosToken } from '@/popup/utils/cosmosSend';
import type {
  PopupWalletAccountMatch,
  SelectAddressCollapseGroup,
  SendFlowAmountInputState,
  SendFlowAmountStep,
  SendFlowSelectedAccountLike,
  SendFlowSubmitInput,
  SendFlowTarget,
  SendInfoContextInput,
  SendInfoContextData,
} from '@/popup/types/popupUi';

const buildRuntimeUnsupportedChainError = async (chainId: string, message: string) => {
  const chainSource = await getChainSourceByChainId(chainId);
  return buildRuntimeUnsupportedEntryError({
    message,
    source: chainSource?.source,
    persisted: chainSource?.persisted,
  });
};

export const loadSelectAddressGroups = async ({ token, selectedAccount }: { token: ChainToken | null; selectedAccount?: SendFlowSelectedAccountLike | null }): Promise<SelectAddressCollapseGroup[]> => {
  const targetChainId = token?.chainId || '';
  const runtimeChain = targetChainId ? await getRuntimeChainInterpretationByChainId(targetChainId) : undefined;
  const supportsAddressDerivation = hasRuntimeChainCapability(runtimeChain, 'addressDerivation');
  const wallets = await getAllWallets();
  const collapses = await Promise.all(
    wallets.map(async (item) => {
      const accounts = (await getAccountsByWalletId(item.id)).filter((account) => !(account.wid === selectedAccount?.wid && account.index === selectedAccount?.index));
      const addresses = await Promise.all(
        accounts.map(async (account) => {
          const address = targetChainId && supportsAddressDerivation ? await getAddressByChainId(account.wid, account.index, targetChainId) : undefined;
          return address?.address || '';
        }),
      );
      return { key: item.id, name: item.name, balance: 0, accounts: addresses.filter(Boolean), wallet: item };
    }),
  );
  return collapses.filter((item) => item.accounts.length > 0);
};

export const validateSendAddressForChain = async (value: string, chainId: string) => {
  if (!value) return;
  const chain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw await buildRuntimeUnsupportedChainError(chainId, 'Unsupported chain');
  }
  ensureRuntimeExecutableSendFlowContext(chain, 'send address validation');
  const addressContext = ensureRuntimeChainAddressContext(chain, 'send address validation');
  try {
    const decoded = fromBech32(value.trim());
    if (decoded.prefix !== addressContext.bech32Prefix) {
      throw new Error(`Address prefix mismatch, expected "${addressContext.bech32Prefix}"`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Address prefix mismatch')) {
      throw error;
    }
    throw new Error('Invalid bech32 address');
  }
};

export const resolveSendTokenDecimals = (token: ChainToken | null) => {
  const decimals = typeof token?.decimals === 'string' ? Number(token.decimals) : Number(token?.decimals ?? token?.chainInfo?.coinDecimals ?? 6);
  if (!Number.isFinite(decimals) || decimals < 0) {
    return 6;
  }
  return Math.min(decimals, 18);
};

export const buildSendAmountPattern = (tokenDecimals: number) => new RegExp(`^\\d*(?:\\.\\d{0,${tokenDecimals}})?$`);

export const resolveSendAmountInputState = ({ rawValue, tokenDecimals }: { rawValue: string; tokenDecimals: number }): SendFlowAmountInputState | null => {
  let value = String(rawValue ?? '').replace(/[^\d.]/g, '');
  if (value.startsWith('.')) {
    value = `0${value}`;
  }
  const [integerPart, fractionalPart] = value.split('.');
  if (integerPart) {
    const normalizedIntegerPart = integerPart.replace(/^0+(?=\d)/, '');
    value = value.includes('.') ? `${normalizedIntegerPart}.${fractionalPart ?? ''}` : normalizedIntegerPart;
  }
  if (!value) {
    return {
      amount: '',
      fontSize: 56,
    };
  }
  const decimalPattern = buildSendAmountPattern(tokenDecimals);
  if (!decimalPattern.test(value)) {
    return null;
  }
  const compact = value.replace('.', '');
  return {
    amount: value,
    fontSize: Math.max(12, 56 - compact.length * 2),
  };
};

export const buildSendFlowTarget = ({ token, toAddress }: SendFlowTarget): SendFlowTarget => ({
  token,
  toAddress,
});

export const buildSendFlowAmountStep = ({ token, toAddress, amount }: SendFlowAmountStep): SendFlowAmountStep => ({
  token,
  toAddress,
  amount,
});

export const loadSendInfoContext = async ({ token, toAddress }: SendInfoContextInput): Promise<SendInfoContextData> => {
  const [runtimeChain, toAddressIsMine, fromAddressIsMine] = await Promise.all([
    token?.chainId ? getRuntimeChainInterpretationByChainId(token.chainId) : Promise.resolve(undefined),
    toAddress ? getWalletAccountByAddress(toAddress) : Promise.resolve(null),
    token?.accountAddress ? getWalletAccountByAddress(token.accountAddress) : Promise.resolve(null),
  ]);

  return {
    chainName: runtimeChain ? ensureRuntimeChainApprovalDisplayContext(runtimeChain, 'send info display').chainName : '',
    fromAddressIsMine: (fromAddressIsMine as PopupWalletAccountMatch | null) || null,
    toAddressIsMine: (toAddressIsMine as PopupWalletAccountMatch | null) || null,
  };
};

export const submitSendFlow = async ({ walletController, token, amount, toAddress, selectedAccount, selectedFee }: SendFlowSubmitInput): Promise<PopupSendTxResult> => {
  const runtimeChain = await getRuntimeChainInterpretationByChainId(token.chainId);
  if (!runtimeChain) {
    throw await buildRuntimeUnsupportedChainError(token.chainId, `Unsupported chain: ${token.chainId}`);
  }
  ensureRuntimeExecutableSendFlowContext(runtimeChain, 'send fee preview');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(runtimeChain, 'send fee preview');
  const feePolicy = buildPopupSendFeePolicy({
    memo: '',
    mode: 'block',
    gasLimit: selectedFee?.gasLimit,
    gasPrice: selectedFee?.gasPrice,
    gasDenom: nativeAssetContext.minimalDenom,
  });
  const accountIndex = selectedAccount?.index;
  const result = await sendCosmosToken({
    walletController,
    token,
    amount,
    toAddress,
    accountIndex,
    gasPrice: selectedFee?.gasPrice,
    gasLimit: feePolicy.gasLimit ? Number(feePolicy.gasLimit) : undefined,
    memo: feePolicy.memo,
  });

  await refreshCosmosAccountAssets({
    walletController,
    chainId: token.chainId,
    wid: selectedAccount?.wid,
    accountIndex,
  }).catch(() => null);
  eventBus.emit(EVENTS.COSMOS_ASSET_REFRESH, {
    chainId: token.chainId,
    wid: selectedAccount?.wid,
    accountIndex,
  });

  return result;
};
