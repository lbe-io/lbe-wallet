import { scryptAsync } from '@noble/hashes/scrypt';

const SECURE_VAULT_VERSION = 3 as const;
const SECURE_VAULT_ALG = 'A256GCM' as const;
const SECURE_VAULT_KDF = 'SCRYPT-SHA256' as const;
const SECURE_VAULT_CONTEXT = 'lbe-vault' as const;
const MASTER_KEY_WRAP_CONTEXT = 'lbe-master-key-wrap' as const;
const MASTER_KEY_SECRET_CONTEXT = 'lbe-master-key-secret' as const;
const MASTER_KEY_SESSION_CONTEXT = 'lbe-master-key-session' as const;
const SECURE_VAULT_DEFAULT_N = 65_536;
const SECURE_VAULT_DEFAULT_R = 8;
const SECURE_VAULT_DEFAULT_P = 1;
const SECURE_VAULT_MIN_N = 16_384;
const SECURE_VAULT_MAX_N = 262_144;
const SECURE_VAULT_MIN_R = 8;
const SECURE_VAULT_MAX_R = 16;
const SECURE_VAULT_MIN_P = 1;
const SECURE_VAULT_MAX_P = 4;
const SECURE_VAULT_SALT_BYTES = 16;
const SECURE_VAULT_IV_BYTES = 12;
const SECURE_VAULT_MASTER_KEY_BYTES = 32;
const SECURE_PASSWORD_MIN_LENGTH = 8;

type SecureVaultPayloadV3 = {
  v: typeof SECURE_VAULT_VERSION;
  alg: typeof SECURE_VAULT_ALG;
  kdf: typeof SECURE_VAULT_KDF;
  n: number;
  r: number;
  p: number;
  ctx: typeof SECURE_VAULT_CONTEXT | typeof MASTER_KEY_WRAP_CONTEXT | typeof MASTER_KEY_SECRET_CONTEXT;
  salt: string;
  iv: string;
  ct: string;
};

type SecretPayloadV1 = {
  v: 1;
  alg: typeof SECURE_VAULT_ALG;
  ctx: typeof MASTER_KEY_SECRET_CONTEXT;
  iv: string;
  ct: string;
};

type SessionMasterKeyPayloadV1 = {
  v: 1;
  alg: typeof SECURE_VAULT_ALG;
  ctx: typeof MASTER_KEY_SESSION_CONTEXT;
  iv: string;
  key: string;
  ct: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
type CryptoUsage = 'encrypt' | 'decrypt';

const ensureWebCrypto = () => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle API is unavailable');
  }
  return subtle;
};

const randomBytes = (size: number) => {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const normalizePassword = (password: string) => password.normalize('NFKC');

export const validatePasswordStrength = (password: string) => {
  const normalized = normalizePassword(password);
  if (normalized.length < SECURE_PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${SECURE_PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Za-z]/.test(normalized) || !/[0-9]/.test(normalized)) {
    throw new Error('Password must include both letters and numbers');
  }
  return normalized;
};

const ensureScryptParamInRange = (n: number, r: number, p: number) => {
  if (n < SECURE_VAULT_MIN_N || n > SECURE_VAULT_MAX_N || (n & (n - 1)) !== 0) {
    throw new Error('Unsupported scrypt N parameter');
  }
  if (r < SECURE_VAULT_MIN_R || r > SECURE_VAULT_MAX_R) {
    throw new Error('Unsupported scrypt r parameter');
  }
  if (p < SECURE_VAULT_MIN_P || p > SECURE_VAULT_MAX_P) {
    throw new Error('Unsupported scrypt p parameter');
  }
};

const deriveKeyMaterial = async (password: string, salt: Uint8Array, n: number, r: number, p: number) => {
  ensureScryptParamInRange(n, r, p);
  const normalized = validatePasswordStrength(password);
  return scryptAsync(encoder.encode(normalized), salt, {
    N: n,
    r,
    p,
    dkLen: 32,
    maxmem: 512 * 1024 * 1024,
  });
};

const importAesKey = async (rawKey: Uint8Array, usage: CryptoUsage[]) => {
  const subtle = ensureWebCrypto();
  return subtle.importKey('raw', toArrayBuffer(rawKey), { name: 'AES-GCM' }, false, usage);
};

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const toSecurePayload = (value: string): SecureVaultPayloadV3 | null => {
  if (!value || value[0] !== '{') {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    if (
      parsed.v !== SECURE_VAULT_VERSION ||
      parsed.alg !== SECURE_VAULT_ALG ||
      parsed.kdf !== SECURE_VAULT_KDF ||
      typeof parsed.n !== 'number' ||
      typeof parsed.r !== 'number' ||
      typeof parsed.p !== 'number' ||
      (parsed.ctx !== SECURE_VAULT_CONTEXT && parsed.ctx !== MASTER_KEY_WRAP_CONTEXT && parsed.ctx !== MASTER_KEY_SECRET_CONTEXT) ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.ct !== 'string'
    ) {
      return null;
    }
    ensureScryptParamInRange(parsed.n, parsed.r, parsed.p);
    return parsed as SecureVaultPayloadV3;
  } catch {
    return null;
  }
};

const toSecretPayload = (value: string): SecretPayloadV1 | null => {
  if (!value || value[0] !== '{') {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    if (parsed.v !== 1 || parsed.alg !== SECURE_VAULT_ALG || parsed.ctx !== MASTER_KEY_SECRET_CONTEXT || typeof parsed.iv !== 'string' || typeof parsed.ct !== 'string') {
      return null;
    }
    return parsed as SecretPayloadV1;
  } catch {
    return null;
  }
};

const toSessionMasterKeyPayload = (value: string): SessionMasterKeyPayloadV1 | null => {
  if (!value || value[0] !== '{') {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    if (parsed.v !== 1 || parsed.alg !== SECURE_VAULT_ALG || parsed.ctx !== MASTER_KEY_SESSION_CONTEXT || typeof parsed.iv !== 'string' || typeof parsed.key !== 'string' || typeof parsed.ct !== 'string') {
      return null;
    }
    return parsed as SessionMasterKeyPayloadV1;
  } catch {
    return null;
  }
};

const encryptWithAesGcm = async (keyBytes: Uint8Array, plaintext: Uint8Array, iv: Uint8Array, ctx: string) => {
  const subtle = ensureWebCrypto();
  const key = await importAesKey(keyBytes, ['encrypt']);
  return subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv), additionalData: toArrayBuffer(encoder.encode(ctx)) }, key, toArrayBuffer(plaintext));
};

const decryptWithAesGcm = async (keyBytes: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array, ctx: string) => {
  const subtle = ensureWebCrypto();
  const key = await importAesKey(keyBytes, ['decrypt']);
  return subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv), additionalData: toArrayBuffer(encoder.encode(ctx)) }, key, toArrayBuffer(ciphertext));
};

export const generateMasterKey = () => randomBytes(SECURE_VAULT_MASTER_KEY_BYTES);

export const wrapMasterKey = async (password: string, masterKey: Uint8Array, n = SECURE_VAULT_DEFAULT_N, r = SECURE_VAULT_DEFAULT_R, p = SECURE_VAULT_DEFAULT_P) => {
  if (masterKey.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
    throw new Error('Invalid master key length');
  }
  ensureScryptParamInRange(n, r, p);
  const salt = randomBytes(SECURE_VAULT_SALT_BYTES);
  const iv = randomBytes(SECURE_VAULT_IV_BYTES);
  const derived = await deriveKeyMaterial(password, salt, n, r, p);
  try {
    const encrypted = await encryptWithAesGcm(derived, masterKey, iv, MASTER_KEY_WRAP_CONTEXT);
    const payload: SecureVaultPayloadV3 = {
      v: SECURE_VAULT_VERSION,
      alg: SECURE_VAULT_ALG,
      kdf: SECURE_VAULT_KDF,
      n,
      r,
      p,
      ctx: MASTER_KEY_WRAP_CONTEXT,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ct: bytesToBase64(new Uint8Array(encrypted)),
    };
    return JSON.stringify(payload);
  } finally {
    derived.fill(0);
  }
};

export const unwrapMasterKey = async (password: string, wrapped: string) => {
  const payload = toSecurePayload(wrapped);
  if (!payload || payload.ctx !== MASTER_KEY_WRAP_CONTEXT) {
    throw new Error('Unsupported wrapped master key payload');
  }
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ct = base64ToBytes(payload.ct);
  if (salt.length !== SECURE_VAULT_SALT_BYTES || iv.length !== SECURE_VAULT_IV_BYTES || ct.length < 16) {
    throw new Error('Malformed wrapped master key payload');
  }

  const derived = await deriveKeyMaterial(password, salt, payload.n, payload.r, payload.p);
  try {
    const decrypted = await decryptWithAesGcm(derived, ct, iv, payload.ctx);
    const key = new Uint8Array(decrypted);
    if (key.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
      key.fill(0);
      throw new Error('Invalid unwrapped master key length');
    }
    return key;
  } finally {
    derived.fill(0);
  }
};

export const encryptWithMasterKey = async (masterKey: Uint8Array, plaintext: string) => {
  if (masterKey.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
    throw new Error('Invalid master key length');
  }
  const iv = randomBytes(SECURE_VAULT_IV_BYTES);
  const encrypted = await encryptWithAesGcm(masterKey, encoder.encode(plaintext), iv, MASTER_KEY_SECRET_CONTEXT);
  const payload: SecretPayloadV1 = {
    v: 1,
    alg: SECURE_VAULT_ALG,
    ctx: MASTER_KEY_SECRET_CONTEXT,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(encrypted)),
  };
  return JSON.stringify(payload);
};

export const decryptWithMasterKey = async (masterKey: Uint8Array, encrypted: string) => {
  if (masterKey.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
    throw new Error('Invalid master key length');
  }
  const payload = toSecretPayload(encrypted);
  if (!payload) {
    throw new Error('Unsupported secure secret payload');
  }
  const iv = base64ToBytes(payload.iv);
  const ct = base64ToBytes(payload.ct);
  if (iv.length !== SECURE_VAULT_IV_BYTES || ct.length < 16) {
    throw new Error('Malformed secure secret payload');
  }
  const decrypted = await decryptWithAesGcm(masterKey, ct, iv, payload.ctx);
  return decoder.decode(new Uint8Array(decrypted));
};

export const sealSessionMasterKey = async (masterKey: Uint8Array) => {
  if (masterKey.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
    throw new Error('Invalid master key length');
  }
  const key = randomBytes(SECURE_VAULT_MASTER_KEY_BYTES);
  const iv = randomBytes(SECURE_VAULT_IV_BYTES);
  try {
    const encrypted = await encryptWithAesGcm(key, masterKey, iv, MASTER_KEY_SESSION_CONTEXT);
    const payload: SessionMasterKeyPayloadV1 = {
      v: 1,
      alg: SECURE_VAULT_ALG,
      ctx: MASTER_KEY_SESSION_CONTEXT,
      iv: bytesToBase64(iv),
      key: bytesToBase64(key),
      ct: bytesToBase64(new Uint8Array(encrypted)),
    };
    return JSON.stringify(payload);
  } finally {
    key.fill(0);
  }
};

export const unsealSessionMasterKey = async (sealed: string) => {
  const payload = toSessionMasterKeyPayload(sealed);
  if (!payload) {
    throw new Error('Unsupported session master key payload');
  }
  const key = base64ToBytes(payload.key);
  const iv = base64ToBytes(payload.iv);
  const ct = base64ToBytes(payload.ct);
  if (key.length !== SECURE_VAULT_MASTER_KEY_BYTES || iv.length !== SECURE_VAULT_IV_BYTES || ct.length < 16) {
    key.fill(0);
    throw new Error('Malformed session master key payload');
  }
  try {
    const decrypted = await decryptWithAesGcm(key, ct, iv, payload.ctx);
    const masterKey = new Uint8Array(decrypted);
    if (masterKey.length !== SECURE_VAULT_MASTER_KEY_BYTES) {
      masterKey.fill(0);
      throw new Error('Invalid session master key length');
    }
    return masterKey;
  } finally {
    key.fill(0);
  }
};

// Legacy-compatible APIs retained for callers that still expect password-based field encryption.
export const secureEncrypt = async (password: string, plaintext: string) => {
  const masterKey = generateMasterKey();
  try {
    const wrapped = await wrapMasterKey(password, masterKey);
    const encrypted = await encryptWithMasterKey(masterKey, plaintext);
    return JSON.stringify({ wrapped, encrypted });
  } finally {
    masterKey.fill(0);
  }
};

export const secureDecrypt = async (password: string, encrypted: string) => {
  const parsed = JSON.parse(encrypted) as { wrapped?: string; encrypted?: string };
  if (!parsed?.wrapped || !parsed?.encrypted) {
    throw new Error('Unsupported secure vault payload');
  }
  const masterKey = await unwrapMasterKey(password, parsed.wrapped);
  try {
    return await decryptWithMasterKey(masterKey, parsed.encrypted);
  } finally {
    masterKey.fill(0);
  }
};
