import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { Secp256k1HdWallet, Secp256k1Wallet } from '@cosmjs/amino';

import { getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';
import {
  ensureRuntimeChainAddressContext,
  ensureRuntimeProviderAccountReadContext,
  ensureRuntimeProviderSignAminoContext,
  ensureRuntimeProviderSignArbitraryContext,
  ensureRuntimeProviderSignDirectContext,
  ensureRuntimeExecutableSendFlowContext,
} from '@/cosmos/chains/runtimeChainAdapter';
import type { SignerMaterial } from './signerMaterialResolver';

type SignerResolverDeps = {
  getSignerMaterial: (accountIndex?: number | string) => Promise<SignerMaterial>;
  buildDerivationPath: (coinType: number, derivationIndex: number) => any;
};

type SignerChainContext = {
  bech32Prefix: string;
  coinType: number;
};

type RuntimeChainInterpretation = NonNullable<Awaited<ReturnType<typeof getRuntimeChainInterpretationByChainId>>>;
type RuntimeAddressReadyChain = Parameters<typeof ensureRuntimeChainAddressContext>[0];
type RuntimeSignerGuard = (runtimeChain: RuntimeChainInterpretation, usage: string) => RuntimeAddressReadyChain;

const toSignerChainContext = (bech32Prefix: string, coinType: number): SignerChainContext => ({
  bech32Prefix,
  coinType,
});

const getBuiltinSignerChainContext = (chainId: string): SignerChainContext | null => {
  const builtinChain = getCosmosChainConfig(chainId);
  if (!builtinChain) {
    return null;
  }
  return {
    bech32Prefix: builtinChain.bech32Prefix,
    coinType: builtinChain.coinType,
  };
};

const ensureRuntimeSignerChainContext = async (chainId: string, usage: string, guard: RuntimeSignerGuard): Promise<SignerChainContext> => {
  const runtimeChain = await getRuntimeChainInterpretationByChainId(chainId);
  if (!runtimeChain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const addressContext = ensureRuntimeChainAddressContext(guard(runtimeChain, usage), usage);
  return toSignerChainContext(addressContext.bech32Prefix, addressContext.coinType);
};

const resolveSignerChainContext = async (chainId: string) => {
  const builtinChain = getBuiltinSignerChainContext(chainId);
  if (builtinChain) {
    return builtinChain;
  }
  return ensureRuntimeSignerChainContext(chainId, 'popup native send signer', ensureRuntimeExecutableSendFlowContext);
};

const resolveAccountReadSignerChainContext = async (chainId: string) => {
  const builtinChain = getBuiltinSignerChainContext(chainId);
  if (builtinChain) {
    return builtinChain;
  }
  return ensureRuntimeSignerChainContext(chainId, 'provider account read signer', ensureRuntimeProviderAccountReadContext);
};

const resolveProviderSignDirectSignerChainContext = async (chainId: string) => {
  const builtinChain = getBuiltinSignerChainContext(chainId);
  if (builtinChain) {
    return builtinChain;
  }
  return ensureRuntimeSignerChainContext(chainId, 'provider signDirect signer', ensureRuntimeProviderSignDirectContext);
};

const resolveProviderSignAminoSignerChainContext = async (chainId: string) => {
  const builtinChain = getBuiltinSignerChainContext(chainId);
  if (builtinChain) {
    return builtinChain;
  }
  return ensureRuntimeSignerChainContext(chainId, 'provider signAmino signer', ensureRuntimeProviderSignAminoContext);
};

const resolveProviderSignArbitrarySignerChainContext = async (chainId: string) => {
  const builtinChain = getBuiltinSignerChainContext(chainId);
  if (builtinChain) {
    return builtinChain;
  }
  return ensureRuntimeSignerChainContext(chainId, 'provider signArbitrary signer', ensureRuntimeProviderSignArbitraryContext);
};

export const getDirectWalletForChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveSignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return DirectSecp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return DirectSecp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};

export const getDirectWalletForAccountReadChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveAccountReadSignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return DirectSecp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return DirectSecp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};

export const getDirectWalletForProviderSignDirectChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveProviderSignDirectSignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return DirectSecp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return DirectSecp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};

export const getAminoWalletForChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveSignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return Secp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return Secp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};

export const getAminoWalletForProviderSignAminoChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveProviderSignAminoSignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return Secp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return Secp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};

export const getAminoWalletForProviderSignArbitraryChain = async (deps: SignerResolverDeps, chainId: string, accountIndex?: number | string) => {
  const chain = await resolveProviderSignArbitrarySignerChainContext(chainId);

  const material = await deps.getSignerMaterial(accountIndex);
  if (material.type === 'privateKey') {
    return Secp256k1Wallet.fromKey(material.key, chain.bech32Prefix);
  }

  const hdPath = deps.buildDerivationPath(chain.coinType, material.derivationIndex);
  return Secp256k1HdWallet.fromMnemonic(material.mnemonic, {
    prefix: chain.bech32Prefix,
    hdPaths: [hdPath],
  });
};
