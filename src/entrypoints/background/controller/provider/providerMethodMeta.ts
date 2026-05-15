import 'reflect-metadata';

import { rpcErrors } from '@/shared/rpc/errors';
import { underline2Camelcase } from '@/entrypoints/background/utils';

import providerController from './controller';
import type { ApprovalComponent } from './approvalRequest';
import type { ProviderRequestContext } from './types';

export type ProviderControllerMethod = (req: ProviderRequestContext & { approvalRes?: unknown }) => unknown | Promise<unknown>;

export type ProviderMethodMeta = {
  requestMethod: string;
  mapMethod: string;
  handler: ProviderControllerMethod;
  isSafe: boolean;
  requiresUnlock: boolean;
  requiresConnection: boolean;
  approvalComponent?: ApprovalComponent;
  approvalCondition?: (request: ProviderRequestContext) => boolean;
  isSignApproval: boolean;
};

export const resolveProviderMethodMeta = (requestMethod: string): ProviderMethodMeta => {
  const mapMethod = underline2Camelcase(requestMethod);
  const handler = mapMethod ? providerController[mapMethod] : undefined;

  if (!mapMethod || !handler) {
    throw rpcErrors.rpc.methodNotFound({
      message: `method [${requestMethod}] doesn't has corresponding handler`,
      data: { method: requestMethod },
    });
  }

  const isSafe = !!Reflect.getMetadata('SAFE', providerController, mapMethod);
  const [approvalComponent, approvalCondition] = (Reflect.getMetadata('APPROVAL', providerController, mapMethod) || []) as [ApprovalComponent | undefined, ((request: ProviderRequestContext) => boolean) | undefined];

  return {
    requestMethod,
    mapMethod,
    handler,
    isSafe,
    requiresUnlock: !isSafe,
    requiresConnection: !isSafe,
    approvalComponent,
    approvalCondition,
    isSignApproval: approvalComponent === 'CosmosSign' || approvalComponent === 'CosmosSendTx',
  };
};
