import type { AccountId, AccountSource } from '@/cosmos/storage';
import { resolveAccountSourceFromOverrideState } from '@/cosmos/storage/accountIdentity';

export type SignerMaterial = { type: 'mnemonic'; mnemonic: string; derivationIndex: number } | { type: 'privateKey'; key: Uint8Array };

export type SignerMaterialSource = 'primary_mnemonic' | 'imported_mnemonic' | 'imported_private_key';

export type ResolvedSignerMaterial = SignerMaterial & {
  source: SignerMaterialSource;
  accountId: AccountId;
  accountIndex: number;
  accountSource: AccountSource;
};

type SignerMaterialResolverDeps = {
  getAccountIndex: (accountIndex?: number | string) => number;
  getPrimaryMnemonic: () => Promise<string>;
  getAccountMnemonicOverride: (accountIndex: number) => Promise<string | null>;
  getAccountPrivateKeyOverride: (accountIndex: number) => Promise<Uint8Array | null>;
};

type SignerMaterialResolverWithKeyDeps = {
  getAccountIndex: (accountIndex?: number | string) => number;
  getPrimaryMnemonicWithKey: (masterKey: Uint8Array) => Promise<string>;
  getAccountMnemonicOverrideWithKey: (masterKey: Uint8Array, accountIndex: number) => Promise<string | null>;
  getAccountPrivateKeyOverrideWithKey: (masterKey: Uint8Array, accountIndex: number) => Promise<Uint8Array | null>;
};

const toSignerMaterialSource = (accountSource: AccountSource): SignerMaterialSource => {
  switch (accountSource.type) {
    case 'imported_mnemonic':
      return 'imported_mnemonic';
    case 'imported_private_key':
      return 'imported_private_key';
    default:
      return 'primary_mnemonic';
  }
};

const resolveMnemonicMaterial = async (index: number, getPrimaryMnemonic: () => Promise<string>, getAccountMnemonicOverride: (accountIndex: number) => Promise<string | null>): Promise<ResolvedSignerMaterial> => {
  const override = index === 0 ? null : await getAccountMnemonicOverride(index);
  const accountSource = resolveAccountSourceFromOverrideState({
    accountIndex: index,
    hasMnemonicOverride: !!override,
  });

  return {
    type: 'mnemonic',
    source: toSignerMaterialSource(accountSource),
    accountId: accountSource.accountId,
    accountIndex: accountSource.accountIndex,
    accountSource,
    mnemonic: accountSource.type === 'imported_mnemonic' ? (override as string) : await getPrimaryMnemonic(),
    derivationIndex: accountSource.type === 'primary_mnemonic_derived' ? accountSource.derivationIndex : 0,
  };
};

export const resolveSignerMaterial = async (deps: SignerMaterialResolverDeps, accountIndex?: number | string): Promise<ResolvedSignerMaterial> => {
  const index = deps.getAccountIndex(accountIndex);
  const privateKey = await deps.getAccountPrivateKeyOverride(index);
  if (privateKey) {
    const accountSource = resolveAccountSourceFromOverrideState({
      accountIndex: index,
      hasPrivateKeyOverride: true,
    });
    return {
      type: 'privateKey',
      source: toSignerMaterialSource(accountSource),
      accountId: accountSource.accountId,
      accountIndex: accountSource.accountIndex,
      accountSource,
      key: privateKey,
    };
  }

  return resolveMnemonicMaterial(index, deps.getPrimaryMnemonic, deps.getAccountMnemonicOverride);
};

export const resolveSignerMaterialWithKey = async (deps: SignerMaterialResolverWithKeyDeps, masterKey: Uint8Array, accountIndex?: number | string): Promise<ResolvedSignerMaterial> => {
  const index = deps.getAccountIndex(accountIndex);
  const privateKey = await deps.getAccountPrivateKeyOverrideWithKey(masterKey, index);
  if (privateKey) {
    const accountSource = resolveAccountSourceFromOverrideState({
      accountIndex: index,
      hasPrivateKeyOverride: true,
    });
    return {
      type: 'privateKey',
      source: toSignerMaterialSource(accountSource),
      accountId: accountSource.accountId,
      accountIndex: accountSource.accountIndex,
      accountSource,
      key: privateKey,
    };
  }

  return resolveMnemonicMaterial(
    index,
    () => deps.getPrimaryMnemonicWithKey(masterKey),
    (resolvedIndex) => deps.getAccountMnemonicOverrideWithKey(masterKey, resolvedIndex),
  );
};
