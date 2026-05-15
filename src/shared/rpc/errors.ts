type ErrorInput =
  | string
  | {
      message?: string;
      data?: unknown;
    }
  | undefined;

export class ProviderRpcError<T = unknown> extends Error {
  code: number;
  data?: T;

  constructor(code: number, message: string, data?: T) {
    super(message);
    this.name = 'ProviderRpcError';
    this.code = code;
    this.data = data;
  }
}

const normalizeErrorInput = (input: ErrorInput, fallbackMessage: string) => {
  if (typeof input === 'string') {
    return { message: input, data: undefined };
  }
  if (!input) {
    return { message: fallbackMessage, data: undefined };
  }
  return {
    message: input.message || fallbackMessage,
    data: input.data,
  };
};

const createErrorFactory = (code: number, fallbackMessage: string) => {
  return (input?: ErrorInput) => {
    const normalized = normalizeErrorInput(input, fallbackMessage);
    return new ProviderRpcError(code, normalized.message, normalized.data);
  };
};

export const rpcErrors = {
  rpc: {
    invalidParams: createErrorFactory(-32602, 'Invalid params'),
    methodNotFound: createErrorFactory(-32601, 'Method not found'),
    internal: createErrorFactory(-32603, 'Internal error'),
    limitExceeded: createErrorFactory(-32005, 'Request limit exceeded'),
  },
  provider: {
    userRejectedRequest: createErrorFactory(4001, 'User rejected the request'),
    unauthorized: createErrorFactory(4100, 'Unauthorized'),
    disabled: createErrorFactory(4900, 'Provider disabled'),
  },
};
