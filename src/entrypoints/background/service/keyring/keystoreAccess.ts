import { fromHex } from '@cosmjs/encoding';

type KeyringStoreState = Record<string, any> | undefined;

type DecryptSecret = (encrypted: string) => Promise<string>;
type DecryptSecretWithKey = (masterKey: Uint8Array, encrypted: string) => Promise<string>;

const PRIVATE_KEY_PATTERN = /^[0-9a-f]+$/i;

const getStoredRecord = (state: KeyringStoreState, key: string) => {
  const value = state && typeof state === 'object' ? state[key] : undefined;
  return value && typeof value === 'object' ? (value as Record<string, string>) : undefined;
};

const getStoredEncryptedValue = (state: KeyringStoreState, collectionKey: string, slotKey: string) => {
  return getStoredRecord(state, collectionKey)?.[slotKey];
};

const decodePrivateKeyHexOrThrow = (decoded: string) => {
  const normalized = decoded?.trim?.() || '';
  if (!PRIVATE_KEY_PATTERN.test(normalized) || normalized.length !== 64) {
    throw new Error('Invalid private key (expected 32-byte hex string)');
  }
  return fromHex(normalized);
};

export const decryptStoredSecretWithKey = async (masterKey: Uint8Array, encrypted: string, decryptWithKey: DecryptSecretWithKey) => {
  if (!encrypted) {
    throw new Error('Encrypted payload is required');
  }
  return decryptWithKey(masterKey, encrypted);
};

export const readPrimaryMnemonicWithKey = async (state: KeyringStoreState, masterKey: Uint8Array, decryptWithKey: DecryptSecretWithKey) => {
  const encryptedMnemonic = state?.mnemonic;
  if (!encryptedMnemonic) {
    throw new Error('Mnemonic not found');
  }
  return decryptStoredSecretWithKey(masterKey, encryptedMnemonic, decryptWithKey);
};

export const readAccountMnemonicOverride = async (state: KeyringStoreState, accountIndex: number, slotKey: string, cache: Map<number, string>, decryptSecret: DecryptSecret) => {
  if (cache.has(accountIndex)) {
    return cache.get(accountIndex)!;
  }
  const encrypted = getStoredEncryptedValue(state, 'accountMnemonics', slotKey);
  if (!encrypted) {
    return null;
  }
  const mnemonic = await decryptSecret(encrypted);
  cache.set(accountIndex, mnemonic);
  return mnemonic;
};

export const readAccountPrivateKeyOverride = async (state: KeyringStoreState, accountIndex: number, slotKey: string, cache: Map<number, Uint8Array>, decryptSecret: DecryptSecret) => {
  if (cache.has(accountIndex)) {
    return cache.get(accountIndex)!;
  }
  const encrypted = getStoredEncryptedValue(state, 'accountPrivateKeys', slotKey);
  if (!encrypted) {
    return null;
  }
  const decoded = (await decryptSecret(encrypted))?.trim?.() || '';
  if (!PRIVATE_KEY_PATTERN.test(decoded) || decoded.length !== 64) {
    return null;
  }
  const keyBytes = fromHex(decoded);
  if (keyBytes.length !== 32) {
    return null;
  }
  cache.set(accountIndex, keyBytes);
  return keyBytes;
};

export const readAccountMnemonicOverrideWithKey = async (state: KeyringStoreState, masterKey: Uint8Array, slotKey: string, decryptWithKey: DecryptSecretWithKey) => {
  const encrypted = getStoredEncryptedValue(state, 'accountMnemonics', slotKey);
  if (!encrypted) {
    return null;
  }
  return decryptStoredSecretWithKey(masterKey, encrypted, decryptWithKey);
};

export const readAccountPrivateKeyOverrideWithKey = async (state: KeyringStoreState, masterKey: Uint8Array, slotKey: string, decryptWithKey: DecryptSecretWithKey) => {
  const encrypted = getStoredEncryptedValue(state, 'accountPrivateKeys', slotKey);
  if (!encrypted) {
    return null;
  }
  return decodePrivateKeyHexOrThrow(await decryptStoredSecretWithKey(masterKey, encrypted, decryptWithKey));
};
