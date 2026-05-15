import { Locale, isValidLocale } from '@/locales/types';
import { browser } from 'wxt/browser';

/** Language preference persistence for extension background services. */
export class LanguagePreferenceService {
  private static readonly STORAGE_KEY = 'preferredLanguage';

  /** Get the currently saved locale, defaulting to `en`. */
  static async getPreferredLanguage(): Promise<Locale> {
    try {
      const stored = await browser.storage.local.get(this.STORAGE_KEY);
      const locale = stored[this.STORAGE_KEY] as unknown;

      if (isValidLocale(locale)) {
        return locale;
      }
    } catch (error) {
      console.warn('Failed to get preferred language:', error);
    }

    return 'en';
  }

  /** Persist the chosen locale. */
  static async setPreferredLanguage(locale: Locale): Promise<void> {
    if (!isValidLocale(locale)) {
      throw new Error(`Invalid locale: ${locale}`);
    }

    try {
      await browser.storage.local.set({ [this.STORAGE_KEY]: locale });
    } catch (error) {
      console.error('Failed to set preferred language:', error);
      throw error;
    }
  }

  /** Subscribe to locale changes and return an unsubscribe function. */
  static onLanguageChanged(callback: (locale: Locale) => void): () => void {
    const listener = (changes: Record<string, { newValue?: unknown }>) => {
      if (this.STORAGE_KEY in changes) {
        const newLocale = changes[this.STORAGE_KEY].newValue;
        if (isValidLocale(newLocale)) {
          callback(newLocale);
        }
      }
    };

    browser.storage.local.onChanged.addListener(listener);

    return () => {
      browser.storage.local.onChanged.removeListener(listener);
    };
  }

  /** Remove persisted locale preference. */
  static async clearPreference(): Promise<void> {
    try {
      await browser.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear language preference:', error);
      throw error;
    }
  }
}

export default LanguagePreferenceService;
