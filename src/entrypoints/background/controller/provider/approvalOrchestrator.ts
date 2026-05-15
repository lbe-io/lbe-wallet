import { rpcErrors } from '@/shared/rpc/errors';

import { authorityWriteService, keyringService, notificationService, permissionService } from '@/entrypoints/background/service';

import { type LockApprovalPayload, type RuntimeApprovalPayload, APPROVAL_WINDOW_HEIGHT, buildApprovalRequest, buildConnectApprovalRequest, isSignApprovalComponent } from './approvalRequest';
import type { ProviderFlowContext, ProviderRequestContext } from './types';
import type { ProviderMethodMeta } from './providerMethodMeta';

type ConnectApprovalResult = {
  accountId?: string;
  walletId?: string;
  accountIndex?: number | string;
  accountAddress?: string;
};

export const requestUnlockApprovalIfNeeded = async (ctx: ProviderFlowContext, methodMeta?: ProviderMethodMeta) => {
  if (!methodMeta) {
    throw rpcErrors.rpc.methodNotFound();
  }
  if (methodMeta.requiresUnlock) {
    const isUnlock = keyringService.memStore.getState().isUnlocked;

    if (!isUnlock) {
      ctx.request.requestedApproval = true;
      await notificationService.requestApproval({ lock: true } satisfies LockApprovalPayload, undefined, ctx.request.requestCorrelation || null);
    }
  }
};

export const requestConnectionApprovalIfNeeded = async (ctx: ProviderFlowContext, methodMeta?: ProviderMethodMeta) => {
  const {
    request: {
      data: { method, params },
      session: { origin, name, icon },
    },
  } = ctx;

  if (!methodMeta) {
    throw rpcErrors.rpc.methodNotFound();
  }
  if (methodMeta.requiresConnection) {
    if (!permissionService.hasPermission(origin)) {
      ctx.request.requestedApproval = true;
      const approvalPayload: RuntimeApprovalPayload = buildConnectApprovalRequest(method, params, { origin, name, icon });
      const approvalRes = await notificationService.requestApproval(approvalPayload, { height: APPROVAL_WINDOW_HEIGHT }, ctx.request.requestCorrelation || null);
      ctx.approvalRes = approvalRes;
      const connectApproval = (approvalRes && typeof approvalRes === 'object' ? approvalRes : {}) as ConnectApprovalResult;
      authorityWriteService.connectOriginSite(origin, name, icon, {
        accountId: connectApproval.accountId,
        walletId: connectApproval.walletId,
        accountIndex: connectApproval.accountIndex,
        accountAddress: connectApproval.accountAddress,
      });
    }
  }
};

export const requestMethodApprovalIfNeeded = async (ctx: ProviderFlowContext, methodMeta?: ProviderMethodMeta) => {
  const {
    request: {
      data: { params, method },
      session: { origin, name, icon },
    },
  } = ctx;

  if (!methodMeta) {
    throw rpcErrors.rpc.methodNotFound();
  }
  const approvalType = methodMeta.approvalComponent;
  const condition = methodMeta.approvalCondition;

  if (approvalType && (!condition || !condition(ctx.request))) {
    ctx.request.requestedApproval = true;
    const approvalPayload: RuntimeApprovalPayload = approvalType === 'Connect' ? buildConnectApprovalRequest(method, params, { origin, name, icon }) : buildApprovalRequest(approvalType, method, params, { origin, name, icon });
    ctx.approvalRes = await notificationService.requestApproval(approvalPayload, { height: APPROVAL_WINDOW_HEIGHT }, ctx.request.requestCorrelation || null);
    if (methodMeta.isSignApproval || isSignApprovalComponent(approvalType)) {
      authorityWriteService.markOriginSigned(origin);
    } else {
      permissionService.touchConnectedSite(origin);
    }
  }
};

export const finalizeApprovalFlow = async (request: ProviderRequestContext, flow: { requestedApproval?: boolean }) => {
  if (request.requestedApproval) {
    flow.requestedApproval = false;
    notificationService.unLock();
  }
};
