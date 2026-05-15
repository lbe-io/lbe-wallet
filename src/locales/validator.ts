import { resources, type Locale } from './resources';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export function validateTranslations(): ValidationResult {
  const issues: string[] = [];
  const referenceKeys = new Set(Object.keys(resources.en.translations));

  for (const [locale, entry] of Object.entries(resources)) {
    if (locale === 'en') {
      continue;
    }

    const keys = Object.keys(entry.translations);
    const currentKeys = new Set(keys);
    const missingKeys = Array.from(referenceKeys).filter((key) => !currentKeys.has(key));
    const extraKeys = Array.from(currentKeys).filter((key) => !referenceKeys.has(key));

    if (missingKeys.length > 0) {
      issues.push(`${locale}: missing keys: ${missingKeys.join(', ')}`);
    }

    if (extraKeys.length > 0) {
      issues.push(`${locale}: extra keys: ${extraKeys.join(', ')}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function getAllTranslationKeys(): string[] {
  return Object.keys(resources.en.translations);
}

export function getMissingTranslations(locale: Locale): string[] {
  const referenceKeys = new Set(Object.keys(resources.en.translations));
  const currentKeys = new Set(Object.keys(resources[locale].translations));

  return Array.from(referenceKeys).filter((key) => !currentKeys.has(key));
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  const result = validateTranslations();
  if (!result.isValid) {
    console.warn('Translation validation issues:');
    result.issues.forEach((issue) => console.warn(`  - ${issue}`));
  }
}

export default validateTranslations;
