import { Tendermint34Client, broadcastTxCommitSuccess, broadcastTxSyncSuccess } from '@cosmjs/tendermint-rpc';

import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';
import { normalizeTxBroadcastMode, toLegacyProviderBroadcastResult, toProviderBroadcastTxResult } from '@/cosmos/tx/txContract';

import type { CosmosSignMode } from './types';
import type { CosmosTxBroadcastResult } from './signingTypes';

type TxBroadcastDeps = {
  normalizeTxBytes: (txBytes: Uint8Array | string | number[]) => Uint8Array;
  getRpcEndpointForChain?: (chainId: string) => Promise<string>;
};

const getBuiltinBroadcastRpcEndpointOrThrow = (chainId: string) => {
  const chain = getCosmosChainConfig(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return chain.rpc;
};

export const sendCosmosTxWithDeps = async (deps: TxBroadcastDeps, chainId: string, txBytes: Uint8Array | string | number[], mode: CosmosSignMode = 'sync'): Promise<CosmosTxBroadcastResult> => {
  const normalizedMode = normalizeTxBroadcastMode(mode, 'sync');
  if (!normalizedMode) {
    throw new Error(`Unsupported broadcast mode: ${mode}`);
  }

  const rpcEndpoint = deps.getRpcEndpointForChain ? await deps.getRpcEndpointForChain(chainId) : getBuiltinBroadcastRpcEndpointOrThrow(chainId);

  const bytes = deps.normalizeTxBytes(txBytes);
  const client = await Tendermint34Client.connect(rpcEndpoint);

  try {
    if (normalizedMode === 'async') {
      const response = await client.broadcastTxAsync({ tx: bytes });
      return toLegacyProviderBroadcastResult(toProviderBroadcastTxResult(response.hash, normalizedMode));
    }

    if (normalizedMode === 'block') {
      const response = await client.broadcastTxCommit({ tx: bytes });
      if (!broadcastTxCommitSuccess(response)) {
        throw new Error(`Broadcast tx commit failed (checkTx=${response.checkTx.code}, deliverTx=${response.deliverTx?.code ?? -1})`);
      }
      return toLegacyProviderBroadcastResult(toProviderBroadcastTxResult(response.hash, normalizedMode));
    }

    const response = await client.broadcastTxSync({ tx: bytes });
    if (!broadcastTxSyncSuccess(response)) {
      throw new Error(`Broadcast tx sync failed (code=${response.code})`);
    }
    return toLegacyProviderBroadcastResult(toProviderBroadcastTxResult(response.hash, normalizedMode));
  } finally {
    client.disconnect();
  }
};
