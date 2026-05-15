import { SigningStargateClient, coins, GasPrice, calculateFee, isDeliverTxFailure } from '@cosmjs/stargate';
import type { DeliverTxResponse } from '@cosmjs/stargate';
import { createWalletDirectSigner } from '@/app/contexts';
import type { WalletController } from '@/app/contexts';
import { getChainSourceByChainId, getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { buildRuntimeUnsupportedEntryError, ensureRuntimeChainAddressContext, ensureRuntimeChainNativeAssetContext, ensureRuntimeChainRpcContext, ensureRuntimeExecutableSendFlowContext } from '@/cosmos/chains/runtimeChainAdapter';
import { buildPopupSendTxPreview } from '@/cosmos/tx/txPreviewAdapter';
import { buildPopupSendTxRequest, toPopupSendTxResult, type PopupSendTxResult } from '@/cosmos/tx/txContract';
import type { ChainToken } from '@/cosmos/storage';
import { toSubunitAmount } from '@/shared/common/amount';

type SendTokenParams = {
  walletController: WalletController;
  token: ChainToken;
  amount: string;
  toAddress: string;
  accountIndex?: number | string;
  gasPrice?: number;
  gasLimit?: number;
  memo?: string;
};

export type CosmosSendResult = PopupSendTxResult;

const buildRuntimeUnsupportedChainError = async (chainId: string, message: string) => {
  const chainSource = await getChainSourceByChainId(chainId);
  return buildRuntimeUnsupportedEntryError({
    message,
    source: chainSource?.source,
    persisted: chainSource?.persisted,
  });
};

const resolveDecimals = (token: ChainToken, chainDecimals?: number) => {
  const decimals = typeof token.decimals === 'string' ? Number(token.decimals) : Number(token.decimals ?? chainDecimals ?? 6);
  if (!Number.isFinite(decimals) || decimals < 0) {
    return chainDecimals ?? 6;
  }
  return decimals;
};

const formatTxErrorMessage = (result: DeliverTxResponse) => {
  if (result.rawLog) {
    try {
      const parsed = JSON.parse(result.rawLog);
      if (Array.isArray(parsed)) {
        const logs = parsed
          .map((entry) => {
            if (entry && typeof entry === 'object') {
              return (entry as { log?: string }).log ?? (entry as { message?: string }).message;
            }
            return undefined;
          })
          .filter((log): log is string => typeof log === 'string' && log.trim().length > 0);
        if (logs.length) {
          return logs.join('\n');
        }
      }
      if (typeof parsed === 'string' && parsed.trim().length) {
        return parsed;
      }
    } catch {
      return result.rawLog;
    }
    return result.rawLog;
  }
  return `Tx failed with code ${result.code}`;
};

const resolveSenderAddress = async (walletController: WalletController, chainId: string, accountIndex: number | string | undefined, fallbackAddress?: string | null) => {
  const normalized = (fallbackAddress || '').trim();
  if (normalized) {
    return normalized;
  }
  const key = await walletController.getCosmosKey(chainId, accountIndex);
  if (!key?.address) {
    throw new Error('Sender address unavailable');
  }
  return key.address;
};

export const sendCosmosToken = async ({ walletController, token, amount, toAddress, accountIndex, gasPrice, gasLimit, memo }: SendTokenParams): Promise<CosmosSendResult> => {
  if (!token?.chainId) {
    throw new Error('Token chain information is missing');
  }

  const chain = await getRuntimeChainInterpretationByChainId(token.chainId);
  if (!chain) {
    throw await buildRuntimeUnsupportedChainError(token.chainId, `Unsupported chain: ${token.chainId}`);
  }
  ensureRuntimeExecutableSendFlowContext(chain, 'popup send');
  ensureRuntimeChainAddressContext(chain, 'popup send');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(chain, 'popup send');
  const rpcEndpoint = ensureRuntimeChainRpcContext(chain, 'popup send');

  const fromAddress = await resolveSenderAddress(walletController, chain.chainId, accountIndex, token.accountAddress);
  const normalizedTo = (toAddress || '').trim();
  if (!normalizedTo) {
    throw new Error('Sender address unavailable');
  }
  if (normalizedTo === fromAddress) {
    throw new Error('Recipient address must be different from sender');
  }

  const decimals = resolveDecimals(token, nativeAssetContext.decimals);
  const denom = token.address || token.addressLow || nativeAssetContext.minimalDenom;
  if (!denom) {
    throw new Error('Token denom is missing');
  }

  const atomicAmount = toSubunitAmount(amount, decimals);
  if (BigInt(atomicAmount) <= 0n) {
    throw new Error('Transfer amount must be greater than zero');
  }

  const availableAtomic = (() => {
    try {
      return toSubunitAmount(String(token.amount ?? '0'), decimals);
    } catch {
      return '0';
    }
  })();

  if (BigInt(atomicAmount) > BigInt(availableAtomic)) {
    throw new Error('Insufficient balance');
  }

  const resolvedGasPrice = gasPrice && gasPrice > 0 ? gasPrice : chain.chainInfo?.feeCurrencies?.[0]?.gasPriceStep?.average || 0.025;
  const gasPriceObject = GasPrice.fromString(`${resolvedGasPrice}${nativeAssetContext.minimalDenom}`);
  const txRequest = buildPopupSendTxRequest({
    chainId: chain.chainId,
    token,
    amountAtomic: atomicAmount,
    denom,
    fromAddress,
    toAddress: normalizedTo,
    accountIndex,
    gasPrice: resolvedGasPrice,
    gasLimit,
    memo,
  });
  const txPreview = buildPopupSendTxPreview({
    chainId: txRequest.chainId,
    fromAddress: txRequest.fromAddress,
    toAddress: txRequest.toAddress,
    denom: txRequest.denom,
    amountAtomic: txRequest.amountAtomic,
    memo: txRequest.memo,
    gasLimit: txRequest.gasLimit,
    gasPrice: txRequest.gasPrice,
    gasDenom: nativeAssetContext.minimalDenom,
    mode: 'block',
  });

  const signer = createWalletDirectSigner(walletController, chain.chainId, accountIndex);

  let client: SigningStargateClient | null = null;
  try {
    client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, { gasPrice: gasPriceObject });

    const msg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress,
        toAddress: txRequest.toAddress,
        amount: coins(atomicAmount, denom),
      },
    };

    let fee: 'auto' | ReturnType<typeof calculateFee> = 'auto';
    if (txPreview.feePolicy.gasLimit) {
      fee = calculateFee(Math.max(1, Math.floor(Number(txPreview.feePolicy.gasLimit))), gasPriceObject);
    }

    const result = await client.signAndBroadcast(fromAddress, [msg], fee, txPreview.feePolicy.memo);
    if (isDeliverTxFailure(result)) {
      throw new Error(formatTxErrorMessage(result));
    }

    return toPopupSendTxResult({
      hash: result.transactionHash,
      height: result.height,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
      denom: txRequest.denom,
      amount: txRequest.amountAtomic,
    });
  } finally {
    client?.disconnect();
  }
};
