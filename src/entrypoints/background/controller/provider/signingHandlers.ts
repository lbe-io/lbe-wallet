import wallet from '../wallet';
import type { CosmosAminoSignResult, CosmosArbitrarySignatureResult, CosmosDirectSignResult } from '@/entrypoints/background/service/keyring/signingTypes';

import {
  ensureChainId,
  ensureEnabledChain,
  ensureProviderSignAminoChain,
  ensureProviderSignArbitraryChain,
  ensureProviderSignDirectChain,
  ensureRequiredObject,
  ensureRequiredString,
  ensureRequiredValue,
  ensureSupportedChain,
  getProviderParams,
  resolveAccountIndex,
} from './controllerShared';
import type { ProviderRequestContext } from './types';

export const signAmino = async (req: ProviderRequestContext): Promise<CosmosAminoSignResult> => {
  const { origin } = req.session;
  const { chainId, signer, signDoc, accountIndex } = getProviderParams(req);
  const normalizedChainId = ensureChainId(chainId);
  const resolvedAccountIndex = resolveAccountIndex(origin, accountIndex);
  const normalizedSigner = ensureRequiredString(signer, 'signer');
  const normalizedSignDoc = ensureRequiredObject<Record<string, any>>(signDoc, 'signDoc');
  await ensureProviderSignAminoChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  return wallet.signCosmosProviderAmino(normalizedChainId, normalizedSigner, normalizedSignDoc, resolvedAccountIndex);
};

export const signDirect = async (req: ProviderRequestContext): Promise<CosmosDirectSignResult> => {
  const { origin } = req.session;
  const { chainId, signer, signDoc, accountIndex } = getProviderParams(req);
  const normalizedChainId = ensureChainId(chainId);
  const resolvedAccountIndex = resolveAccountIndex(origin, accountIndex);
  const normalizedSigner = ensureRequiredString(signer, 'signer');
  const normalizedSignDoc = ensureRequiredObject<Record<string, any>>(signDoc, 'signDoc');
  await ensureProviderSignDirectChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  return wallet.signCosmosProviderDirect(normalizedChainId, normalizedSigner, normalizedSignDoc, resolvedAccountIndex);
};

export const signArbitrary = async (req: ProviderRequestContext): Promise<CosmosArbitrarySignatureResult> => {
  const { origin } = req.session;
  const params = getProviderParams(req);
  const { chainId, signer, accountIndex } = params;
  const arbitraryData = params.data;
  const normalizedChainId = ensureChainId(chainId);
  const resolvedAccountIndex = resolveAccountIndex(origin, accountIndex);
  const normalizedSigner = ensureRequiredString(signer, 'signer');
  const normalizedData = ensureRequiredValue(arbitraryData, 'data');
  await ensureProviderSignArbitraryChain(normalizedChainId);
  ensureEnabledChain(origin, normalizedChainId);
  return wallet.signCosmosProviderArbitrary(normalizedChainId, normalizedSigner, normalizedData, resolvedAccountIndex);
};

export const verifyArbitrary = async (req: ProviderRequestContext) => {
  const params = getProviderParams(req);
  const { chainId, signer, signature } = params;
  const arbitraryData = params.data;
  const normalizedChainId = ensureChainId(chainId);
  const normalizedSigner = ensureRequiredString(signer, 'signer');
  const normalizedData = ensureRequiredValue(arbitraryData, 'data');
  const normalizedSignature = ensureRequiredValue(signature, 'signature');
  ensureSupportedChain(normalizedChainId);
  return wallet.verifyCosmosArbitrary(normalizedChainId, normalizedSigner, normalizedData, normalizedSignature);
};
