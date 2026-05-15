import { useState, useEffect } from 'react';

const normalizeRpcBase = (rpcUrl: string) => rpcUrl.replace(/\/+$/, '');

const fetchCosmosChainId = async (rpcUrl: string): Promise<string | null> => {
  const base = normalizeRpcBase(rpcUrl);
  const statusUrl = `${base}/status`;
  const response = await fetch(statusUrl, { method: 'GET' });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const chainId = data?.result?.node_info?.network;
  if (typeof chainId === 'string' && chainId.trim()) {
    return chainId.trim();
  }
  return null;
};

const useChainIdByRpcUrl = (rpcUrl: string) => {
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChainId = async () => {
      try {
        const cosmosChainId = await fetchCosmosChainId(rpcUrl).catch(() => null);
        if (cosmosChainId) {
          setChainId(cosmosChainId);
          setError(null);
          return;
        }
        throw new Error('Unable to resolve Cosmos chain ID from RPC');
      } catch {
        setError('Failed to fetch chain ID');
        setChainId(null);
      }
    };
    if (rpcUrl) {
      fetchChainId();
    }
  }, [rpcUrl]);

  return { chainId, error };
};

export default useChainIdByRpcUrl;
