import type { RuntimeChainInterpretation } from '@/cosmos/chains/runtimeChainAdapter';
import { ensureRuntimeChainNativeAssetContext, ensureRuntimeExecutableQueryContext, ensureRuntimeChainRestContext } from '@/cosmos/chains/runtimeChainAdapter';
import { getMintscanTxLink, parseTxTimestamp } from './cosmosUtils';
import type { CosmosTxHistoryItem } from './types';

type TxHistoryResponse = {
  tx_responses?: any[];
};

export type TxHistoryQueryServiceDeps = {
  getRuntimeChainInterpretationByChainId(chainId: string): Promise<RuntimeChainInterpretation | undefined>;
  normalizeRestEndpoint(rest: string): string;
  fetchJson(url: string): Promise<TxHistoryResponse>;
};

export const getCosmosTxHistoryWithDeps = async (deps: TxHistoryQueryServiceDeps, chainId: string, address: string, limit = 30): Promise<CosmosTxHistoryItem[]> => {
  const chain = await deps.getRuntimeChainInterpretationByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const supportedChain = ensureRuntimeExecutableQueryContext(chain, 'tx history query');
  const nativeAssetContext = ensureRuntimeChainNativeAssetContext(supportedChain, 'tx history query');
  if (!address) {
    throw new Error('Address is required');
  }

  const rest = deps.normalizeRestEndpoint(ensureRuntimeChainRestContext(supportedChain, 'tx history query'));
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const senderEvent = encodeURIComponent(`transfer.sender='${address}'`);
  const receiverEvent = encodeURIComponent(`transfer.recipient='${address}'`);
  const base = `${rest}/cosmos/tx/v1beta1/txs?pagination.limit=${safeLimit}&order_by=ORDER_BY_DESC`;

  const [senderRes, receiverRes] = await Promise.all([deps.fetchJson(`${base}&events=${senderEvent}`).catch(() => ({ tx_responses: [] })), deps.fetchJson(`${base}&events=${receiverEvent}`).catch(() => ({ tx_responses: [] }))]);

  const txResponses = [...(senderRes?.tx_responses || []), ...(receiverRes?.tx_responses || [])];
  const txMap = new Map<string, any>();
  txResponses.forEach((item: any) => {
    const hash = String(item?.txhash || '');
    if (hash) {
      txMap.set(hash, item);
    }
  });

  const items: CosmosTxHistoryItem[] = [];
  txMap.forEach((tx: any, hash: string) => {
    const timestamp = parseTxTimestamp(tx?.timestamp);
    const messages = Array.isArray(tx?.tx?.body?.messages) ? tx.tx.body.messages : [];
    messages.forEach((msg: any) => {
      if (msg?.['@type'] !== '/cosmos.bank.v1beta1.MsgSend') {
        return;
      }
      const from = String(msg?.fromAddress || msg?.from_address || '');
      const to = String(msg?.toAddress || msg?.to_address || '');
      const amounts = Array.isArray(msg?.amount) ? msg.amount : [];
      const amountCoin = amounts.find((coin: any) => coin?.denom === nativeAssetContext.minimalDenom) || amounts[0] || { amount: '0', denom: nativeAssetContext.minimalDenom };
      if (from !== address && to !== address) {
        return;
      }
      items.push({
        chainId,
        hash,
        time: timestamp,
        type: from === address ? '3' : '2',
        famt: String(amountCoin?.amount || '0'),
        fdecimals: nativeAssetContext.decimals,
        fname: nativeAssetContext.symbol,
        from,
        to,
        link: getMintscanTxLink(chainId, hash),
        ficon: '',
      });
    });
  });

  return items.sort((a, b) => b.time - a.time).slice(0, safeLimit);
};
