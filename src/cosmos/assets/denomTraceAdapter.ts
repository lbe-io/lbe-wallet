export type DenomTraceInfo = {
  denom: string;
  isIbc: boolean;
  source: 'native' | 'ibc' | 'unknown';
  traceHash: string;
  path?: string;
  baseDenom?: string;
};

export const toDenomTraceInfo = (denom?: string): DenomTraceInfo => {
  const normalizedDenom = (denom || '').trim();
  const uppercase = normalizedDenom.toUpperCase();

  if (!normalizedDenom) {
    return {
      denom: '',
      isIbc: false,
      source: 'unknown',
      traceHash: '',
    };
  }

  if (uppercase.startsWith('IBC/')) {
    return {
      denom: normalizedDenom,
      isIbc: true,
      source: 'ibc',
      traceHash: normalizedDenom.slice(4),
    };
  }

  return {
    denom: normalizedDenom,
    isIbc: false,
    source: 'native',
    traceHash: '',
    baseDenom: normalizedDenom,
  };
};
