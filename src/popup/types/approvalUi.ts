import type { ConnectApprovalPreview } from '@/entrypoints/background/controller/provider/approvalPreview';
import type { ApprovalComponent, ConnectApprovalPayload, LockApprovalPayload, SignOrTxApprovalPayload } from '@/entrypoints/background/controller/provider/approvalRequest';
import type { SendTxApprovalPreview, SignApprovalPreview } from '@/shared/utils/approvalPreviewShared';

export type ApprovalPageSession = {
  origin?: string;
  icon?: string;
  name?: string;
};

export type ApprovalPageParams<TData = Record<string, any>, TPreview = unknown> = {
  method?: string;
  requestMethod?: string;
  requestedChainId?: string;
  data?: TData;
  session?: ApprovalPageSession;
  preview?: TPreview;
};

export type ApprovalConnectData = {
  chainId?: string;
  chainIds?: string | string[];
};

export type ApprovalSignData = {
  chainId?: string;
  signer?: string;
  signDoc?: Record<string, any>;
  data?: string | Uint8Array | number[];
};

export type ApprovalSendTxData = {
  chainId?: string;
  txBytes?: Uint8Array | string | number[];
  mode?: 'sync' | 'async' | 'block';
};

export type ConnectApprovalPageParams = ApprovalPageParams<ApprovalConnectData, ConnectApprovalPreview> & {
  session: Required<ApprovalPageSession>;
};

export type CosmosSignApprovalPageParams = ApprovalPageParams<ApprovalSignData, SignApprovalPreview>;

export type CosmosSendTxApprovalPageParams = ApprovalPageParams<ApprovalSendTxData, SendTxApprovalPreview>;

export type CosmosSignApprovalPageParamsWithPreview = CosmosSignApprovalPageParams & {
  preview: SignApprovalPreview;
};

export type CosmosSendTxApprovalPageParamsWithPreview = CosmosSendTxApprovalPageParams & {
  preview: SendTxApprovalPreview;
};

export type ApprovalPageParamsByComponent = {
  Connect: ConnectApprovalPageParams;
  CosmosSign: CosmosSignApprovalPageParams;
  CosmosSendTx: CosmosSendTxApprovalPageParams;
};

export type ApprovalTaskByComponent = {
  [K in keyof ApprovalPageParamsByComponent]: {
    approvalComponent: K;
    params: ApprovalPageParamsByComponent[K];
    origin?: string;
    requestDefer?: Promise<unknown>;
  };
};

export type ApprovalTask = ApprovalTaskByComponent[keyof ApprovalTaskByComponent];

export type ApprovalRootComponentName = Extract<ApprovalComponent, keyof ApprovalPageParamsByComponent>;

export type ApprovalRoutePayload = ConnectApprovalPayload | SignOrTxApprovalPayload;

export const isApprovalRoutePayload = (value: ApprovalRoutePayload | LockApprovalPayload | null | undefined): value is ApprovalRoutePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'approvalComponent' in value && typeof value.approvalComponent === 'string' && 'params' in value;
};

export const toApprovalTask = (value: ApprovalRoutePayload): ApprovalTask => {
  if (value.approvalComponent === 'Connect') {
    return {
      ...value,
      approvalComponent: 'Connect',
      params: value.params as ConnectApprovalPageParams,
    };
  }

  if (value.approvalComponent === 'CosmosSign') {
    return {
      ...value,
      approvalComponent: 'CosmosSign',
      params: value.params as CosmosSignApprovalPageParams,
    };
  }

  return {
    ...value,
    approvalComponent: 'CosmosSendTx',
    params: value.params as CosmosSendTxApprovalPageParams,
  };
};

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
const isObjectRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isTxFeePolicy = (value: unknown) => {
  if (!isObjectRecord(value)) {
    return false;
  }
  return (
    (value.mode === 'sync' || value.mode === 'async' || value.mode === 'block') &&
    typeof value.memo === 'string' &&
    typeof value.gasLimit === 'string' &&
    isStringArray(value.feeCoins) &&
    typeof value.gasPrice === 'string' &&
    typeof value.source === 'string'
  );
};

export const isSignApprovalPreview = (value: unknown): value is SignApprovalPreview => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const preview = value as Record<string, unknown>;
  return (preview.mode === 'amino' || preview.mode === 'direct' || preview.mode === 'unknown') && typeof preview.chainId === 'string' && isStringArray(preview.messageTypes) && isStringArray(preview.feeCoins);
};

export const isSendTxApprovalPreview = (value: unknown): value is SendTxApprovalPreview => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const preview = value as Record<string, unknown>;
  return (
    typeof preview.txSize === 'number' &&
    isStringArray(preview.messageTypes) &&
    typeof preview.memo === 'string' &&
    typeof preview.signerCount === 'number' &&
    typeof preview.signatureCount === 'number' &&
    isStringArray(preview.feeCoins) &&
    typeof preview.gasLimit === 'string' &&
    (preview.feePolicy === undefined || isTxFeePolicy(preview.feePolicy))
  );
};

export const hasCosmosSignApprovalPreview = (params: CosmosSignApprovalPageParams): params is CosmosSignApprovalPageParamsWithPreview => isSignApprovalPreview(params.preview);

export const hasCosmosSendTxApprovalPreview = (params: CosmosSendTxApprovalPageParams): params is CosmosSendTxApprovalPageParamsWithPreview => isSendTxApprovalPreview(params.preview);
