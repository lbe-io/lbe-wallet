import { type ApprovalSession, buildConnectApprovalParams, buildCosmosSendTxApprovalParams, buildCosmosSignApprovalParams } from './approvalPreview';

export type ApprovalComponent = 'Connect' | 'CosmosSign' | 'CosmosSendTx';

export type ConnectApprovalPayload = {
  approvalComponent: 'Connect';
  params: ReturnType<typeof buildConnectApprovalParams>;
};

export type SignOrTxApprovalPayload = {
  approvalComponent: Exclude<ApprovalComponent, 'Connect'>;
  params: ReturnType<typeof buildCosmosSignApprovalParams> | ReturnType<typeof buildCosmosSendTxApprovalParams>;
  origin: string;
};

export type LockApprovalPayload = {
  lock: true;
};

export type RuntimeApprovalPayload = ConnectApprovalPayload | SignOrTxApprovalPayload | LockApprovalPayload;

export const APPROVAL_WINDOW_HEIGHT = 600;

export const buildConnectApprovalRequest = (requestMethod: string, params: unknown, session: ApprovalSession): ConnectApprovalPayload => ({
  approvalComponent: 'Connect',
  params: buildConnectApprovalParams(requestMethod, params, session),
});

export const buildApprovalRequest = (approvalComponent: Exclude<ApprovalComponent, 'Connect'>, method: string, params: unknown, session: ApprovalSession): SignOrTxApprovalPayload => ({
  approvalComponent,
  params: approvalComponent === 'CosmosSendTx' ? buildCosmosSendTxApprovalParams(method, params, session) : buildCosmosSignApprovalParams(method, params, session),
  origin: session.origin,
});

export const isSignApprovalComponent = (type: string) => {
  const signApprovals: Array<Exclude<ApprovalComponent, 'Connect'>> = ['CosmosSign', 'CosmosSendTx'];
  return signApprovals.includes(type as Exclude<ApprovalComponent, 'Connect'>);
};
