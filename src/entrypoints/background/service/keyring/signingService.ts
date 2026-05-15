import type { CosmosAminoSignResult, CosmosArbitrarySignatureResult, CosmosDirectSignResult, CosmosKeyResult, CosmosOfflineSignerAccountsResult } from './signingTypes';

type SigningDeps = {
  getAccountIndex: (accountIndex?: number | string) => number;
  getDirectWalletForChain: (chainId: string, accountIndex?: number | string) => Promise<any>;
  getAminoWalletForChain: (chainId: string, accountIndex?: number | string) => Promise<any>;
  normalizeAminoSignDoc: (signDoc: Record<string, any>, expectedChainId: string) => any;
  normalizeDirectSignDoc: (signDoc: Record<string, any>, expectedChainId: string) => any;
  normalizeArbitraryData: (data: string | Uint8Array | number[]) => Uint8Array;
  buildAdr36SignDoc: (signerAddress: string, dataBytes: Uint8Array) => any;
  serializeBigInt: <T>(value: T) => T;
};

const assertSignerAddressMatches = async (wallet: any, signerAddress: string) => {
  const [account] = await wallet.getAccounts();
  if (account.address !== signerAddress) {
    throw new Error('Signer address mismatch');
  }
  return account;
};

export const getCosmosKeyWithSigningDeps = async (deps: Pick<SigningDeps, 'getAccountIndex' | 'getDirectWalletForChain'>, chainId: string, accountIndex?: number | string): Promise<CosmosKeyResult> => {
  const wallet = await deps.getDirectWalletForChain(chainId, accountIndex);
  const [account] = await wallet.getAccounts();
  const resolvedIndex = deps.getAccountIndex(accountIndex);
  return {
    name: `Account ${resolvedIndex + 1}`,
    algo: account.algo,
    pubKey: account.pubkey,
    address: account.address,
    bech32Address: account.address,
    isNanoLedger: false,
  };
};

export const getOfflineSignerAccountsWithSigningDeps = async (deps: Pick<SigningDeps, 'getDirectWalletForChain'>, chainId: string, accountIndex?: number | string): Promise<CosmosOfflineSignerAccountsResult> => {
  const wallet = await deps.getDirectWalletForChain(chainId, accountIndex);
  const [account] = await wallet.getAccounts();
  return [
    {
      address: account.address,
      algo: account.algo,
      pubkey: account.pubkey,
    },
  ];
};

export const signCosmosAminoWithSigningDeps = async (
  deps: Pick<SigningDeps, 'getAminoWalletForChain' | 'normalizeAminoSignDoc'>,
  chainId: string,
  signerAddress: string,
  signDoc: Record<string, any>,
  accountIndex?: number | string,
): Promise<CosmosAminoSignResult> => {
  const wallet = await deps.getAminoWalletForChain(chainId, accountIndex);
  await assertSignerAddressMatches(wallet, signerAddress);
  return wallet.signAmino(signerAddress, deps.normalizeAminoSignDoc(signDoc, chainId) as any);
};

export const signCosmosDirectWithSigningDeps = async (
  deps: Pick<SigningDeps, 'getDirectWalletForChain' | 'normalizeDirectSignDoc' | 'serializeBigInt'>,
  chainId: string,
  signerAddress: string,
  signDoc: Record<string, any>,
  accountIndex?: number | string,
): Promise<CosmosDirectSignResult> => {
  const wallet = await deps.getDirectWalletForChain(chainId, accountIndex);
  await assertSignerAddressMatches(wallet, signerAddress);
  const normalizedSignDoc = deps.normalizeDirectSignDoc(signDoc, chainId);
  const result = await wallet.signDirect(signerAddress, normalizedSignDoc as any);
  return deps.serializeBigInt(result);
};

export const signCosmosArbitraryWithSigningDeps = async (
  deps: Pick<SigningDeps, 'getAminoWalletForChain' | 'normalizeArbitraryData' | 'buildAdr36SignDoc'>,
  chainId: string,
  signerAddress: string,
  data: string | Uint8Array | number[],
  accountIndex?: number | string,
): Promise<CosmosArbitrarySignatureResult> => {
  const wallet = await deps.getAminoWalletForChain(chainId, accountIndex);
  await assertSignerAddressMatches(wallet, signerAddress);

  const dataBytes = deps.normalizeArbitraryData(data);
  const adr36SignDoc = deps.buildAdr36SignDoc(signerAddress, dataBytes);
  const signed = await wallet.signAmino(signerAddress, adr36SignDoc as any);
  return signed.signature;
};
