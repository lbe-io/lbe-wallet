import type { AccountId, AccountSource, AddressProjection } from './types';

export type IndexedAccountIdentity = {
  accountId: AccountId;
  accountIndex: number;
  slotKey: string;
};

export const normalizeAccountIndex = (accountIndex?: number | string) => {
  if (typeof accountIndex === 'number') {
    return accountIndex;
  }
  if (typeof accountIndex === 'string' && accountIndex !== '') {
    const parsed = Number(accountIndex);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

export const resolveAccountId = (accountIndex: number, accountId?: string): AccountId => {
  return (accountId || `account:${accountIndex}`) as AccountId;
};

export const toIndexedAccountIdentity = (accountIndex?: number | string, accountId?: string): IndexedAccountIdentity => {
  const normalizedIndex = normalizeAccountIndex(accountIndex);
  return {
    accountId: resolveAccountId(normalizedIndex, accountId),
    accountIndex: normalizedIndex,
    slotKey: normalizedIndex.toString(),
  };
};

export const createPrimaryMnemonicDerivedAccountSource = (accountIndex?: number | string, accountId?: string): AccountSource => {
  const identity = toIndexedAccountIdentity(accountIndex, accountId);
  return {
    type: 'primary_mnemonic_derived',
    accountId: identity.accountId,
    accountIndex: identity.accountIndex,
    derivationIndex: identity.accountIndex,
    slotKey: identity.slotKey,
  };
};

export const createImportedMnemonicAccountSource = (accountIndex?: number | string, accountId?: string): AccountSource => {
  const identity = toIndexedAccountIdentity(accountIndex, accountId);
  return {
    type: 'imported_mnemonic',
    accountId: identity.accountId,
    accountIndex: identity.accountIndex,
    derivationIndex: 0,
    slotKey: identity.slotKey,
  };
};

export const createImportedPrivateKeyAccountSource = (accountIndex?: number | string, accountId?: string): AccountSource => {
  const identity = toIndexedAccountIdentity(accountIndex, accountId);
  return {
    type: 'imported_private_key',
    accountId: identity.accountId,
    accountIndex: identity.accountIndex,
    slotKey: identity.slotKey,
  };
};

export const resolveAccountSourceFromOverrideState = ({
  accountIndex,
  accountId,
  hasMnemonicOverride = false,
  hasPrivateKeyOverride = false,
}: {
  accountIndex?: number | string;
  accountId?: string;
  hasMnemonicOverride?: boolean;
  hasPrivateKeyOverride?: boolean;
}): AccountSource => {
  if (hasPrivateKeyOverride) {
    return createImportedPrivateKeyAccountSource(accountIndex, accountId);
  }
  const normalizedIndex = normalizeAccountIndex(accountIndex);
  if (normalizedIndex === 0) {
    return createPrimaryMnemonicDerivedAccountSource(normalizedIndex, accountId);
  }
  if (hasMnemonicOverride) {
    return createImportedMnemonicAccountSource(normalizedIndex, accountId);
  }
  return createPrimaryMnemonicDerivedAccountSource(normalizedIndex, accountId);
};

export const toAddressProjection = ({ accountSource, chainId, address, derivationPath }: { accountSource: AccountSource; chainId: string; address: string; derivationPath?: string }): AddressProjection => {
  return {
    accountId: accountSource.accountId,
    accountIndex: accountSource.accountIndex,
    chainId,
    address,
    addressLow: address.toLowerCase(),
    derivationPath,
    source: accountSource,
  };
};
