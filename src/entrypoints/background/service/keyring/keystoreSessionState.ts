import type { MemStoreState } from './types';

type UnlockGuardState = {
  failedUnlockCount: number;
  nextUnlockAllowedAt: number;
} | null;

type ClearRuntimeSessionDeps = {
  clearMasterKey: () => void;
  markUnlockSuccess: () => void;
  clearCaches: () => void;
  clearTransientFields: () => void;
};

export const createInitialMemStoreState = (keyringTypes: string[]): MemStoreState => ({
  isUnlocked: false,
  keyringTypes,
  keyrings: [],
  pendingMnemonic: '',
  addressTypes: [],
  rsaPublicKey: '',
  rsaPrivateKey: '',
  deviceId: '',
});

export const normalizePendingMnemonic = (mnemonic: string) => mnemonic.trim();

export const getPendingMnemonicValue = (state: Pick<MemStoreState, 'pendingMnemonic'>) => state.pendingMnemonic || '';

export const buildPendingMnemonicPatch = (mnemonic: string): Partial<MemStoreState> => ({
  pendingMnemonic: normalizePendingMnemonic(mnemonic),
});

export const buildClearedPendingMnemonicPatch = (): Partial<MemStoreState> => ({
  pendingMnemonic: '',
});

export const resolveRuntimeMnemonic = (params: { unlockSessionMnemonic: string | null; pendingMnemonic: string }) => {
  if (params.unlockSessionMnemonic) {
    return params.unlockSessionMnemonic;
  }
  return params.pendingMnemonic || null;
};

export const buildUnlockedMemStorePatch = (): Partial<MemStoreState> => ({
  isUnlocked: true,
});

export const buildLockedMemStorePatch = (): Partial<MemStoreState> => ({
  isUnlocked: false,
});

export const buildClearedWalletMemStorePatch = (): Partial<MemStoreState> => ({
  isUnlocked: false,
  pendingMnemonic: '',
  rsaPublicKey: '',
  rsaPrivateKey: '',
  deviceId: '',
});

export const buildRestoredUnlockRuntimeState = (unlockGuard: UnlockGuardState) => ({
  failedUnlockCount: unlockGuard?.failedUnlockCount ?? 0,
  nextUnlockAllowedAt: unlockGuard?.nextUnlockAllowedAt ?? 0,
  unlockSessionMnemonic: null as string | null,
});

export const clearRuntimeSessionState = (deps: ClearRuntimeSessionDeps) => {
  deps.clearMasterKey();
  deps.markUnlockSuccess();
  deps.clearTransientFields();
  deps.clearCaches();
};
