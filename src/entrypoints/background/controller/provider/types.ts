import type { RequestCorrelation } from '@/shared/messaging/requestCorrelationService';
export type JsonRecord = Record<string, unknown>;

export type ProviderSessionInfo = {
  origin: string;
  name: string;
  icon: string;
};

export type ProviderSessionState = ProviderSessionInfo & {
  setProp: (data: Partial<ProviderSessionInfo>) => void;
  pushMessage?: (event: string, payload?: unknown) => void;
};

export type ProviderRequestData = {
  method: string;
  params?: JsonRecord;
  session?: Partial<ProviderSessionInfo>;
};

export type ProviderRequestContext = {
  data: ProviderRequestData;
  session: ProviderSessionState;
  requestedApproval?: boolean;
  requestCorrelation?: RequestCorrelation;
};

export type ProviderFlowContext = {
  request: ProviderRequestContext;
  mapMethod?: string;
  methodMeta?: import('./providerMethodMeta').ProviderMethodMeta;
  approvalRes?: unknown;
};
