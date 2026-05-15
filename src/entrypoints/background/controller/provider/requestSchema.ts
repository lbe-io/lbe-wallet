import { rpcErrors } from '@/shared/rpc/errors';

type ProviderRequestPayload = {
  method: string;
  params?: unknown;
};

type ParamsValidator = (params: unknown) => void;

const isObjectRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0;

const hasRequiredField = <T extends Record<string, unknown>>(params: T, field: string) => Object.prototype.hasOwnProperty.call(params, field) && params[field] !== undefined && params[field] !== null;

const asObjectOrThrow = (params: unknown, message: string) => {
  if (!isObjectRecord(params)) {
    throw rpcErrors.rpc.invalidParams({ message });
  }
  return params;
};

const ensureOptionalObject = (params: unknown, message: string) => {
  if (params === undefined || params === null) {
    return;
  }
  if (!isObjectRecord(params)) {
    throw rpcErrors.rpc.invalidParams({ message });
  }
};

const ensureChainIdField = (params: unknown, method: string) => {
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!isNonEmptyString(payload.chainId)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainId is required` });
  }
};

const ensureChainIdsField = (params: unknown, method: string) => {
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  const chainIds = payload.chainIds;

  if (isNonEmptyString(chainIds)) {
    return;
  }

  if (Array.isArray(chainIds) && chainIds.length > 0 && chainIds.every((value) => isNonEmptyString(value))) {
    return;
  }

  throw rpcErrors.rpc.invalidParams({ message: `${method}: chainIds is required` });
};

const ensureSignParams = (params: unknown, method: string) => {
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!isNonEmptyString(payload.chainId)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainId is required` });
  }
  if (!isNonEmptyString(payload.signer)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: signer is required` });
  }
  if (!hasRequiredField(payload, 'signDoc') || !isObjectRecord(payload.signDoc)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: signDoc is required` });
  }
};

const ensureSignArbitraryParams = (params: unknown) => {
  const method = 'signArbitrary';
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!isNonEmptyString(payload.chainId)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainId is required` });
  }
  if (!isNonEmptyString(payload.signer)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: signer is required` });
  }
  if (!hasRequiredField(payload, 'data')) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: data is required` });
  }
};

const ensureVerifyArbitraryParams = (params: unknown) => {
  const method = 'verifyArbitrary';
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!isNonEmptyString(payload.chainId)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainId is required` });
  }
  if (!isNonEmptyString(payload.signer)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: signer is required` });
  }
  if (!hasRequiredField(payload, 'data')) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: data is required` });
  }
  if (!hasRequiredField(payload, 'signature')) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: signature is required` });
  }
};

const ensureTxBytes = (value: unknown) => {
  if (value instanceof Uint8Array) {
    return true;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (isString(value) && value.length > 0) {
    return true;
  }
  return false;
};

const ensureSendTxParams = (params: unknown) => {
  const method = 'sendTx';
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!isNonEmptyString(payload.chainId)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainId is required` });
  }
  if (!hasRequiredField(payload, 'txBytes') || !ensureTxBytes(payload.txBytes)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: txBytes is required` });
  }
};

const ensureSuggestChainParams = (params: unknown) => {
  const method = 'suggestChain';
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  if (!hasRequiredField(payload, 'chainInfo') || !isObjectRecord(payload.chainInfo)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: chainInfo is required` });
  }
};

const ensureTabCheckinParams = (params: unknown) => {
  const method = 'tabCheckin';
  const payload = asObjectOrThrow(params, `${method}: params must be an object`);
  const { origin, name, icon } = payload;
  if (origin !== undefined && !isString(origin)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: origin must be a string` });
  }
  if (name !== undefined && !isString(name)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: name must be a string` });
  }
  if (icon !== undefined && !isString(icon)) {
    throw rpcErrors.rpc.invalidParams({ message: `${method}: icon must be a string` });
  }
};

const PROVIDER_METHOD_SCHEMAS: Record<string, ParamsValidator> = {
  enable: (params) => ensureChainIdsField(params, 'enable'),
  disable: (params) => {
    if (params === undefined || params === null) return;
    const payload = asObjectOrThrow(params, 'disable: params must be an object');
    if (payload.chainIds === undefined || payload.chainIds === null) return;
    ensureChainIdsField(params, 'disable');
  },
  getKey: (params) => ensureChainIdField(params, 'getKey'),
  getOfflineSignerAccounts: (params) => ensureChainIdField(params, 'getOfflineSignerAccounts'),
  signAmino: (params) => ensureSignParams(params, 'signAmino'),
  signDirect: (params) => ensureSignParams(params, 'signDirect'),
  signArbitrary: ensureSignArbitraryParams,
  verifyArbitrary: ensureVerifyArbitraryParams,
  sendTx: ensureSendTxParams,
  suggestChain: ensureSuggestChainParams,
  getChainInfos: (params) => ensureOptionalObject(params, 'getChainInfos: params must be an object'),
  tabCheckin: ensureTabCheckinParams,
  keepAlive: (params) => ensureOptionalObject(params, 'keepAlive: params must be an object'),
  getProviderState: (params) => ensureOptionalObject(params, 'getProviderState: params must be an object'),
};

export const ensureProviderRequestSchema = (payload: unknown) => {
  if (!isObjectRecord(payload)) {
    throw rpcErrors.rpc.invalidParams({ message: 'Invalid params: request payload must be an object' });
  }

  if (!isNonEmptyString(payload.method)) {
    throw rpcErrors.rpc.invalidParams({ message: 'Invalid params: method is required' });
  }

  const validator = PROVIDER_METHOD_SCHEMAS[payload.method];
  if (!validator) {
    // Keep method fail-closed behavior in provider method resolution layer.
    return;
  }

  try {
    validator(payload.params);
  } catch (error) {
    if (isObjectRecord(error) && typeof error.code === 'number') {
      throw error;
    }
    throw rpcErrors.rpc.invalidParams({ message: `Invalid params for method: ${payload.method}` });
  }
};

export type { ProviderRequestPayload };
