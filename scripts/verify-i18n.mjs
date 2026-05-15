import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES = ['en', 'zh-CN', 'zh-TW'];
const FILES = Object.fromEntries(
  LOCALES.map((locale) => [locale, path.join(ROOT, 'src', 'locales', locale, 'translations.json')]),
);

const PLACEHOLDER_RE = /{{\s*([a-zA-Z0-9_.-]+)\s*}}|{\s*([a-zA-Z0-9_.-]+)\s*}/g;
const LEGACY_KEY_RE = /^page\.wallet\.[A-Z]/;
const ALLOWLIST_LATIN_TOKENS = /\b(LBE|Web3|DApp|URL|RPC|Gas|SignDoc|Tx|ID|QR|Cosmos|USDT|USDC|BTC|ETH)\b/gi;

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const extractPlaceholders = (value) => {
  const placeholders = new Set();
  const text = String(value);
  let match = PLACEHOLDER_RE.exec(text);
  while (match) {
    placeholders.add(match[1] || match[2]);
    match = PLACEHOLDER_RE.exec(text);
  }
  PLACEHOLDER_RE.lastIndex = 0;
  return placeholders;
};

const toSet = (arr) => new Set(arr);
const diff = (a, b) => [...a].filter((item) => !b.has(item));

const hasCjk = (text) => /[\u3400-\u9FFF]/.test(text);
const hasLatin = (text) => /[A-Za-z]/.test(text);

const normalizeForMixedCheck = (text) => text.replace(ALLOWLIST_LATIN_TOKENS, '');

const run = () => {
  const errors = [];
  const warnings = [];

  const localeData = {};
  for (const locale of LOCALES) {
    const filePath = FILES[locale];
    if (!fs.existsSync(filePath)) {
      errors.push(`[missing-file] ${locale}: ${filePath}`);
      continue;
    }
    try {
      localeData[locale] = readJson(filePath);
    } catch (error) {
      errors.push(`[invalid-json] ${locale}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    console.error('verify-i18n failed:\n' + errors.map((item) => `- ${item}`).join('\n'));
    process.exit(1);
  }

  const keySets = Object.fromEntries(
    LOCALES.map((locale) => [locale, toSet(Object.keys(localeData[locale]))]),
  );

  const referenceLocale = 'en';
  const referenceKeys = keySets[referenceLocale];

  for (const locale of LOCALES) {
    const missing = diff(referenceKeys, keySets[locale]);
    const extra = diff(keySets[locale], referenceKeys);
    if (missing.length) errors.push(`[key-missing] ${locale}: ${missing.join(', ')}`);
    if (extra.length) errors.push(`[key-extra] ${locale}: ${extra.join(', ')}`);
  }

  for (const key of referenceKeys) {
    const placeholdersByLocale = Object.fromEntries(
      LOCALES.map((locale) => [locale, extractPlaceholders(localeData[locale][key])]),
    );
    const baseline = placeholdersByLocale[referenceLocale];
    for (const locale of LOCALES) {
      const current = placeholdersByLocale[locale];
      const miss = diff(baseline, current);
      const extra = diff(current, baseline);
      if (miss.length || extra.length) {
        errors.push(
          `[placeholder-mismatch] key=${key} locale=${locale} missing=[${miss.join(', ')}] extra=[${extra.join(', ')}]`,
        );
      }
    }
  }

  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(localeData[locale])) {
      if (typeof value !== 'string') {
        errors.push(`[non-string-value] ${locale}.${key}`);
        continue;
      }
      if (value.trim() === '') {
        errors.push(`[empty-value] ${locale}.${key}`);
      }

      if (LEGACY_KEY_RE.test(key)) {
        errors.push(`[legacy-key-style] ${key}`);
      }

      if (locale === 'en' && hasCjk(value)) {
        warnings.push(`[mixed-language] en.${key}: contains CJK text`);
      }

      if (locale !== 'en') {
        const candidate = normalizeForMixedCheck(value);
        if (hasCjk(candidate) && hasLatin(candidate)) {
          warnings.push(`[mixed-language] ${locale}.${key}: contains both CJK and Latin text`);
        }
      }
    }
  }

  if (warnings.length) {
    console.warn('verify-i18n warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length) {
    console.error('verify-i18n failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('verify-i18n passed');
  console.log(`- Locales checked: ${LOCALES.join(', ')}`);
  console.log(`- Total keys: ${referenceKeys.size}`);
  console.log(`- Warnings: ${warnings.length}`);
};

run();
