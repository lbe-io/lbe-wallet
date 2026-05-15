import wallet from '../wallet';
import { rpcErrors } from '@/shared/rpc/errors';
import { buildProviderBroadcastTxRequest, normalizeTxBroadcastMode, type TxBytesLike } from '@/cosmos/tx/txContract';
import type { CosmosTxBroadcastResult } from '@/entrypoints/background/service/keyring/signingTypes';

import { ensureChainId, ensureEnabledChain, ensureProviderSendTxChain, ensureRequiredValue, getProviderParams } from './controllerShared';
import type { ProviderRequestContext } from './types';

export const sendTx = async (req: ProviderRequestContext): Promise<CosmosTxBroadcastResult> => {
  const { origin } = req.session;
  const { chainId, txBytes, mode } = getProviderParams(req);
  const normalizedChainId = ensureChainId(chainId);
  const normalizedTxBytes = ensureRequiredValue(txBytes, 'txBytes');
  await ensureProviderSendTxChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  const normalizedMode = normalizeTxBroadcastMode(mode, 'sync');
  if (!normalizedMode) {
    throw rpcErrors.rpc.invalidParams({
      message: `Unsupported broadcast mode: ${mode}`,
    });
  }
  const txRequest = buildProviderBroadcastTxRequest({
    chainId: normalizedChainId,
    txBytes: normalizedTxBytes as TxBytesLike,
    mode: normalizedMode,
    memo: '',
  });
  if (!txRequest) {
    throw rpcErrors.rpc.invalidParams({
      message: `Unsupported broadcast mode: ${mode}`,
    });
  }
  return wallet.sendCosmosProviderTx(txRequest.chainId, txRequest.txBytes, txRequest.mode);
};
