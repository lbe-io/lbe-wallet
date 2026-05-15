import { rpcErrors } from '@/shared/rpc/errors';
import { isSupportedCosmosChain } from '@/cosmos/chains/chain-registry';
import { getChainSourceByChainId, getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import {
  buildRuntimeUnsupportedEntryDetails,
  ensureRuntimeProviderAccountReadContext,
  ensureRuntimeProviderSignAminoContext,
  ensureRuntimeProviderSignArbitraryContext,
  ensureRuntimeProviderSendTxContext,
  ensureRuntimeProviderSignDirectContext,
  getRuntimeUnsupportedErrorData,
} from '@/cosmos/chains/runtimeChainAdapter';

import { ensureEnabledChainForOrigin, parseProviderAccountIndex, resolveAuthorizedAccountIndex } from './guards';
import type { ProviderRequestContext } from './types';

export const getProviderParams = (req: ProviderRequestContext): Record<string, unknown> => {
  const { params } = req.data;
  if (params && typeof params === 'object') {
    return params;
  }
  return {};
};

export const normalizeChainIds = (chainIds: unknown) => {
  const values = typeof chainIds === 'string' ? [chainIds] : Array.isArray(chainIds) ? chainIds : [];
  return Array.from(
    new Set(
      values
        .map((item) => (typeof item === 'string' ? item : ''))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

export const parseAccountIndex = (accountIndex: unknown): number | string | undefined => {
  return parseProviderAccountIndex(accountIndex);
};

export const resolveAccountIndex = (origin: string, accountIndex: unknown): number | string | undefined => {
  return resolveAuthorizedAccountIndex(origin, accountIndex);
};

export const ensureChainId = (chainId: unknown): string => {
  if (typeof chainId !== 'string' || !chainId.trim()) {
    throw rpcErrors.rpc.invalidParams({
      message: 'chainId is required',
    });
  }
  return chainId.trim();
};

export const ensureSupportedChain = (chainId: string) => {
  if (!isSupportedCosmosChain(chainId)) {
    throw rpcErrors.rpc.invalidParams({
      message: `Unsupported chainId: ${chainId}`,
    });
  }
};

const buildRuntimeUnsupportedProviderErrorInput = async (chainId: string, error: unknown) => {
  const normalizedData = getRuntimeUnsupportedErrorData(error);
  if (normalizedData) {
    return {
      message: error instanceof Error ? error.message : `Unsupported chainId: ${chainId}`,
      data: normalizedData,
    };
  }

  const chainSource = await getChainSourceByChainId(chainId);
  return {
    message: error instanceof Error ? error.message : `Unsupported chainId: ${chainId}`,
    data: buildRuntimeUnsupportedEntryDetails({
      source: chainSource?.source,
      persisted: chainSource?.persisted,
    }),
  };
};

export const ensureProviderAccountReadableChain = async (chainId: string) => {
  if (isSupportedCosmosChain(chainId)) {
    return;
  }

  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, undefined));
  }

  try {
    ensureRuntimeProviderAccountReadContext(runtimeChain, 'provider account read');
  } catch (error) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, error));
  }
};

export const ensureProviderSignDirectChain = async (chainId: string) => {
  if (isSupportedCosmosChain(chainId)) {
    return;
  }

  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, undefined));
  }

  try {
    ensureRuntimeProviderSignDirectContext(runtimeChain, 'provider signDirect');
  } catch (error) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, error));
  }
};

export const ensureProviderSignAminoChain = async (chainId: string) => {
  if (isSupportedCosmosChain(chainId)) {
    return;
  }

  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, undefined));
  }

  try {
    ensureRuntimeProviderSignAminoContext(runtimeChain, 'provider signAmino');
  } catch (error) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, error));
  }
};

export const ensureProviderSignArbitraryChain = async (chainId: string) => {
  if (isSupportedCosmosChain(chainId)) {
    return;
  }

  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, undefined));
  }

  try {
    ensureRuntimeProviderSignArbitraryContext(runtimeChain, 'provider signArbitrary');
  } catch (error) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, error));
  }
};

export const ensureProviderSendTxChain = async (chainId: string) => {
  if (isSupportedCosmosChain(chainId)) {
    return;
  }

  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, undefined));
  }

  try {
    ensureRuntimeProviderSendTxContext(runtimeChain, 'provider sendTx');
  } catch (error) {
    throw rpcErrors.rpc.invalidParams(await buildRuntimeUnsupportedProviderErrorInput(chainId, error));
  }
};

export const ensureEnabledChain = (origin: string, chainId: string) => {
  ensureEnabledChainForOrigin(origin, chainId);
};

export const ensureRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw rpcErrors.rpc.invalidParams({
      message: `${field} is required`,
    });
  }
  return value.trim();
};

export const ensureRequiredObject = <T extends object>(value: unknown, field: string): T => {
  if (!value || typeof value !== 'object') {
    throw rpcErrors.rpc.invalidParams({
      message: `${field} is required`,
    });
  }
  return value as T;
};

export const ensureRequiredValue = <T>(value: T | null | undefined, field: string): T => {
  if (value === undefined || value === null) {
    throw rpcErrors.rpc.invalidParams({
      message: `${field} is required`,
    });
  }
  return value;
};
