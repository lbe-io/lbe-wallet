import type { PreferenceStore } from './preference';

type LegacyPreferenceStore = Partial<{
  alianNames: Record<string, string>;
  initAlianNames: boolean;
  keyringAlianNames: Record<string, string>;
  accountAlianNames: Record<string, string>;
}>;

export const applyLegacyPreferenceMigrations = (store: PreferenceStore) => {
  const legacy = store as unknown as LegacyPreferenceStore;

  if (!store.aliasNames && legacy.alianNames) {
    store.aliasNames = legacy.alianNames;
  }
  if (store.initAliasNames === undefined && legacy.initAlianNames !== undefined) {
    store.initAliasNames = legacy.initAlianNames;
  }
  if (!store.keyringAliasNames && legacy.keyringAlianNames) {
    store.keyringAliasNames = legacy.keyringAlianNames;
  }
  if (!store.accountAliasNames && legacy.accountAlianNames) {
    store.accountAliasNames = legacy.accountAlianNames;
  }
};
