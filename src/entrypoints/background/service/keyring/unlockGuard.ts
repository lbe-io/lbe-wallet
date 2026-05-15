export type UnlockGuardState = {
  failedUnlockCount: number;
  nextUnlockAllowedAt: number;
};

export const UNLOCK_GUARD_VERSION = 1 as const;
export const DEFAULT_UNLOCK_MAX_BACKOFF_MS = 5 * 60 * 1000;

export const getUnlockDelayMs = (failedCount: number, maxBackoffMs = DEFAULT_UNLOCK_MAX_BACKOFF_MS) => {
  if (failedCount <= 0) {
    return 0;
  }
  const exponent = Math.min(failedCount - 1, 8);
  return Math.min(1000 * 2 ** exponent, maxBackoffMs);
};

export const ensureUnlockAllowed = (state: UnlockGuardState, now = Date.now()) => {
  if (state.nextUnlockAllowedAt <= 0 || now >= state.nextUnlockAllowedAt) {
    return;
  }
  const waitMs = state.nextUnlockAllowedAt - now;
  throw new Error(`Too many failed attempts. Retry after ${Math.ceil(waitMs / 1000)} seconds`);
};

export const markUnlockFailure = (state: UnlockGuardState, now = Date.now(), maxBackoffMs = DEFAULT_UNLOCK_MAX_BACKOFF_MS): UnlockGuardState => {
  const failedUnlockCount = state.failedUnlockCount + 1;
  return {
    failedUnlockCount,
    nextUnlockAllowedAt: now + getUnlockDelayMs(failedUnlockCount, maxBackoffMs),
  };
};

export const markUnlockSuccess = (): UnlockGuardState => {
  return {
    failedUnlockCount: 0,
    nextUnlockAllowedAt: 0,
  };
};

export const toUnlockGuardRecord = (state: UnlockGuardState) => {
  return {
    version: UNLOCK_GUARD_VERSION,
    failedUnlockCount: state.failedUnlockCount,
    nextUnlockAllowedAt: state.nextUnlockAllowedAt,
  };
};

export const fromUnlockGuardRecord = (value: unknown): UnlockGuardState | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const state = value as { version?: unknown; failedUnlockCount?: unknown; nextUnlockAllowedAt?: unknown };
  if (state.version !== UNLOCK_GUARD_VERSION) {
    return null;
  }
  const failedUnlockCount = Number(state.failedUnlockCount);
  const nextUnlockAllowedAt = Number(state.nextUnlockAllowedAt);
  if (!Number.isFinite(failedUnlockCount) || !Number.isFinite(nextUnlockAllowedAt)) {
    return null;
  }
  return {
    failedUnlockCount: Math.max(0, Math.floor(failedUnlockCount)),
    nextUnlockAllowedAt: Math.max(0, Math.floor(nextUnlockAllowedAt)),
  };
};
