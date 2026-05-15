import { rpcErrors } from '@/shared/rpc/errors';
import 'reflect-metadata';

import { keyringService } from '@/entrypoints/background/service';
import { autoLockService } from '@/entrypoints/background/service/autoLock';
import { PromiseFlow } from '@/entrypoints/background/utils';

import { finalizeApprovalFlow, requestConnectionApprovalIfNeeded, requestMethodApprovalIfNeeded, requestUnlockApprovalIfNeeded } from './approvalOrchestrator';
import { executeProviderRequestGuards } from './flowGuards';
import { resolveProviderMethodMeta } from './providerMethodMeta';
import { ProviderFlowContext, ProviderRequestContext } from './types';

const flow = new PromiseFlow();
const flowContext = flow
  .use(async (ctx: ProviderFlowContext, next: () => Promise<unknown>) => {
    const {
      data: { method },
    } = ctx.request;
    ctx.methodMeta = resolveProviderMethodMeta(method);
    ctx.mapMethod = ctx.methodMeta.mapMethod;

    if (keyringService.memStore.getState().isUnlocked) {
      autoLockService.setLastActiveTime();
      await keyringService.touchUnlockSession().catch(() => {});
    }

    return next();
  })
  .use(async (ctx: ProviderFlowContext, next: () => Promise<unknown>) => {
    await requestUnlockApprovalIfNeeded(ctx, ctx.methodMeta);
    return next();
  })
  .use(async (ctx: ProviderFlowContext, next: () => Promise<unknown>) => {
    await requestConnectionApprovalIfNeeded(ctx, ctx.methodMeta);
    return next();
  })
  .use(async (ctx: ProviderFlowContext, next: () => Promise<unknown>) => {
    executeProviderRequestGuards(ctx.request, ctx.methodMeta);
    return next();
  })
  .use(async (ctx: ProviderFlowContext, next: () => Promise<unknown>) => {
    await requestMethodApprovalIfNeeded(ctx, ctx.methodMeta);
    return next();
  })
  .use(async (ctx: ProviderFlowContext) => {
    const { approvalRes, methodMeta, request } = ctx;
    if (!methodMeta) {
      throw rpcErrors.rpc.methodNotFound();
    }
    const requestDefer = Promise.resolve(
      methodMeta.handler({
        ...request,
        approvalRes,
      }),
    );

    return requestDefer;
  })
  .callback();

export default (request: ProviderRequestContext) => {
  const ctx: ProviderFlowContext = {
    request: { ...request, requestedApproval: false } as ProviderRequestContext,
  };
  return flowContext(ctx).finally(() => finalizeApprovalFlow(ctx.request, flow));
};
