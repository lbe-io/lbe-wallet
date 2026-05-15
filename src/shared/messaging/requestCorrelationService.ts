export type RequestCorrelationScope = 'provider_request';

export type RequestCorrelation = {
  id: string;
  scope: RequestCorrelationScope;
  sessionKey: string;
  portName: string;
  origin: string;
  method: string;
  createdAt: number;
};

export type RequestCorrelationInput = {
  scope?: RequestCorrelationScope;
  sessionKey: string;
  portName?: string;
  origin?: string;
  method: string;
  createdAt?: number;
};

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeCreatedAt = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

export const buildRequestCorrelationId = ({ scope = 'provider_request', sessionKey, portName = 'provider', origin = '', method, createdAt = Date.now() }: RequestCorrelationInput) =>
  `${scope}:${normalizeString(sessionKey)}:${normalizeString(portName)}:${normalizeString(origin)}:${normalizeString(method)}:${createdAt}`;

export const createRequestCorrelation = ({ scope = 'provider_request', sessionKey, portName = 'provider', origin = '', method, createdAt = Date.now() }: RequestCorrelationInput): RequestCorrelation => ({
  id: buildRequestCorrelationId({ scope, sessionKey, portName, origin, method, createdAt }),
  scope,
  sessionKey: normalizeString(sessionKey),
  portName: normalizeString(portName) || 'provider',
  origin: normalizeString(origin),
  method: normalizeString(method),
  createdAt,
});

export const isRequestCorrelation = (value: unknown): value is RequestCorrelation => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const correlation = value as Record<string, unknown>;
  return (
    correlation.scope === 'provider_request' &&
    typeof correlation.id === 'string' &&
    typeof correlation.sessionKey === 'string' &&
    typeof correlation.portName === 'string' &&
    typeof correlation.origin === 'string' &&
    typeof correlation.method === 'string' &&
    normalizeCreatedAt(correlation.createdAt) >= 0
  );
};
