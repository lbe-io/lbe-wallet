import { fromHex } from '@cosmjs/encoding';

type KeyringStoreState = Record<string, any> | undefined;
type EncryptSecret = (value: string) => Promise<string>;

const getStoredCollection = (state: KeyringStoreState, key: string): Record<string, string> => {
  const value = state && typeof state === 'object' ? state[key] : undefined;
  return value && typeof value === 'object' ? { ...(value as Record<string, string>) } : {};
};

export const buildPrimaryMnemonicWrite = async (pendingMnemonic: string, encryptSecret: EncryptSecret) => {
  return {
    mnemonic: await encryptSecret(pendingMnemonic),
    cachedMnemonic: pendingMnemonic,
  };
};

export const buildAccountMnemonicOverrideWrite = async (state: KeyringStoreState, slotKey: string, mnemonic: string, encryptSecret: EncryptSecret) => {
  const existing = getStoredCollection(state, 'accountMnemonics');
  return {
    nextState: {
      accountMnemonics: {
        ...existing,
        [slotKey]: await encryptSecret(mnemonic),
      },
    },
    cachedMnemonic: mnemonic,
  };
};

export const buildAccountPrivateKeyOverrideWrite = async (state: KeyringStoreState, slotKey: string, normalizedKey: string, encryptSecret: EncryptSecret) => {
  const existing = getStoredCollection(state, 'accountPrivateKeys');
  return {
    nextState: {
      accountPrivateKeys: {
        ...existing,
        [slotKey]: await encryptSecret(normalizedKey),
      },
    },
    cachedPrivateKey: fromHex(normalizedKey),
  };
};

export const buildClearedWalletState = () => ({
  booted: '',
  masterKey: '',
  vault: '',
  mnemonic: '',
  rsaPublicKey: '',
  rsaPrivateKey: '',
  deviceId: '',
  signMessage: '',
  accountMnemonics: {},
});
