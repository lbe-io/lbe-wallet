export const formatAmountByDecimals = (amount: string, decimals: number) => {
  const raw = (amount || '').trim();
  if (!raw) return '0';
  if (!/^\d+$/.test(raw)) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return '0';
    return value.toString();
  }

  if (decimals <= 0) {
    return raw.replace(/^0+(?=\d)/, '') || '0';
  }

  const padded = raw.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, -decimals).replace(/^0+(?=\d)/, '') || '0';
  const fracPart = padded.slice(-decimals).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
};

export const toDisplayFromDecCoin = (amount: string, decimals: number) => {
  const value = Number(amount || '0');
  if (!Number.isFinite(value)) return '0';
  return (value / Math.pow(10, decimals)).toString();
};

const MINTSCAN_NETWORK_MAP: Record<string, string> = {
  'cosmoshub-4': 'cosmos',
  'osmosis-1': 'osmosis',
  'injective-1': 'injective',
  'juno-1': 'juno',
};

export const getMintscanTxLink = (chainId: string, txHash: string) => {
  const network = MINTSCAN_NETWORK_MAP[chainId];
  if (!network || !txHash) return '';
  return `https://www.mintscan.io/${network}/txs/${txHash}`;
};

export const parseTxTimestamp = (value: string | undefined) => {
  if (!value) return Math.floor(Date.now() / 1000);
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return Math.floor(Date.now() / 1000);
  return Math.floor(ts / 1000);
};

const COINGECKO_ASSET_MAP: Record<string, string> = {
  'cosmoshub-4': 'cosmos',
  'osmosis-1': 'osmosis',
  'injective-1': 'injective-protocol',
  'juno-1': 'juno-network',
};

export const getCoinGeckoId = (chainId: string) => {
  return COINGECKO_ASSET_MAP[chainId] || '';
};
