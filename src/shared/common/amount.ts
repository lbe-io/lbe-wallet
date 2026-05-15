export const satoshisToBTC = (amount: number) => amount / 100000000;

export const btcTosatoshis = (amount: number) => Math.floor(amount * 100000000);

export async function sleep(timeSec: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeSec * 1000);
  });
}

export function formatAmount(amount: string, decimals: string | number, precision: number = 18): string {
  if (!(amount && decimals)) return '';
  const decimalsInt = Number(decimals);
  if (Number.isNaN(decimalsInt) || decimalsInt < 0) return '';

  const rawAmount = amount.trim() ? BigInt(amount.trim()) : 0n;
  const divisor = 10n ** BigInt(decimalsInt);
  const integerPart = rawAmount / divisor;
  const remainder = rawAmount % divisor;

  if (remainder === 0n || precision <= 0) {
    return integerPart.toString();
  }

  const fractionFull = remainder.toString().padStart(decimalsInt, '0');
  const fraction = fractionFull.slice(0, Math.min(precision, decimalsInt)).replace(/0+$/, '');
  return fraction ? `${integerPart.toString()}.${fraction}` : integerPart.toString();
}

const LARGE_VALUE_DECIMALS = 4;
const MID_VALUE_DECIMALS = 6;
const SMALL_VALUE_MAX_DECIMALS = 8;
const SMALL_VALUE_MIN_DECIMALS = 6;
const SMALL_VALUE_THRESHOLD = 0.0001;
const MID_VALUE_SIGNIFICANT_THRESHOLD = 0.1;
const MIN_READABLE_THRESHOLD = 0.00000001;
const MIN_DISPLAY_AMOUNT = 0.000001;
const DECIMAL_PATTERN = /^[+-]?\d*(\.\d*)?$/;

const sanitizeNumericString = (value: string) => value.replace(/,/g, '').trim();
const INTEGER_PATTERN = /^[+-]?\d+$/;

const expandScientificNotation = (value: string): string => {
  if (!/[eE]/.test(value)) {
    return value;
  }
  const match = /^([+-]?)(\d+(?:\.\d+)?)[eE]([+-]?\d+)$/.exec(value);
  if (!match) {
    return value;
  }
  const [, sign, coefficient, exponentRaw] = match;
  const exponent = Number(exponentRaw);
  if (!Number.isFinite(exponent)) {
    return value;
  }
  const [integerPartRaw, fractionPartRaw = ''] = coefficient.split('.');
  const digits = (integerPartRaw + fractionPartRaw).replace(/^0+(?=\d)/, '') || '0';
  if (digits === '0') {
    return '0';
  }
  if (exponent === 0) {
    return `${sign}${digits}`;
  }
  if (exponent > 0) {
    const integerLength = integerPartRaw.length + exponent;
    if (integerLength >= digits.length) {
      const integer = digits.padEnd(integerLength, '0');
      return `${sign}${integer}`;
    }
    const integer = digits.slice(0, integerLength) || '0';
    const fraction = digits.slice(integerLength);
    return `${sign}${integer}.${fraction}`;
  }
  const shift = Math.abs(exponent);
  if (shift >= integerPartRaw.length) {
    const zeros = '0'.repeat(shift - integerPartRaw.length);
    return `${sign}0.${zeros}${digits}`;
  }
  const breakPoint = integerPartRaw.length - shift;
  const integer = digits.slice(0, breakPoint) || '0';
  const fraction = digits.slice(breakPoint);
  return `${sign}${integer}.${fraction}`;
};

const normalizeDecimalInput = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return expandScientificNotation(value.toString());
  }
  const normalized = expandScientificNotation(sanitizeNumericString(value));
  if (!normalized) {
    return null;
  }
  return normalized;
};

const toDecimalParts = (value: string): { sign: string; integer: string; fraction: string } | null => {
  if (!value || !DECIMAL_PATTERN.test(value)) {
    return null;
  }
  const sign = value.startsWith('-') ? '-' : '';
  const unsigned = value.replace(/^[+-]/, '');
  if (!unsigned) {
    return { sign, integer: '0', fraction: '' };
  }
  const [integerRaw, fractionRaw = ''] = unsigned.split('.');
  const integer = integerRaw.replace(/^0+(?=\d)/, '') || '0';
  const fraction = fractionRaw.replace(/[^0-9]/g, '');
  return { sign, integer, fraction };
};

const trimTrailingZeros = (fraction: string) => fraction.replace(/0+$/, '');

const formatDecimalFromParts = (parts: { sign: string; integer: string; fraction: string }, digits: number) => {
  if (digits <= 0 || !parts.fraction) {
    return `${parts.sign}${parts.integer}`;
  }
  const truncated = parts.fraction.slice(0, digits);
  const trimmed = trimTrailingZeros(truncated);
  if (!trimmed) {
    return `${parts.sign}${parts.integer}`;
  }
  return `${parts.sign}${parts.integer}.${trimmed}`;
};

const countLeadingFractionZeros = (fraction: string) => {
  const match = fraction.match(/^0+/);
  return match ? match[0].length : 0;
};

const formatTinyDecimalFromParts = (parts: { sign: string; integer: string; fraction: string }) => {
  const fraction = parts.fraction || '';
  const firstNonZero = fraction.search(/[^0]/);
  if (firstNonZero === -1) {
    return `${parts.sign}${parts.integer}`;
  }
  const minDigits = firstNonZero + SMALL_VALUE_MIN_DECIMALS;
  const maxDigits = firstNonZero + SMALL_VALUE_MAX_DECIMALS;
  const digits = Math.max(firstNonZero + 1, Math.min(maxDigits, Math.max(minDigits, fraction.length)));
  const truncated = fraction.slice(0, digits);
  const trimmed = trimTrailingZeros(truncated) || truncated || '0';
  return `${parts.sign}${parts.integer}.${trimmed}`;
};

export function formatTokenAmount(value: string | number | null | undefined): string {
  if (typeof value === 'string') {
    const normalized = sanitizeNumericString(value);
    if (normalized && INTEGER_PATTERN.test(normalized)) {
      return normalized.replace(/^(-?)0+(?=\d)/, '$1');
    }
  }

  const normalizedInput = normalizeDecimalInput(value);
  if (!normalizedInput) {
    return '0';
  }

  const parts = toDecimalParts(normalizedInput);
  if (!parts) {
    return '0';
  }

  if (!parts.fraction) {
    return `${parts.sign}${parts.integer}`;
  }

  const numericValue = Number(normalizedInput);
  const absValue = Number.isFinite(numericValue) ? Math.abs(numericValue) : null;
  const integerIsZero = parts.integer === '0';
  const leadingZeros = countLeadingFractionZeros(parts.fraction);

  if (!integerIsZero || (absValue !== null && absValue >= 1)) {
    return formatDecimalFromParts(parts, LARGE_VALUE_DECIMALS);
  }

  if ((absValue !== null && absValue >= MID_VALUE_SIGNIFICANT_THRESHOLD) || leadingZeros === 0) {
    return formatDecimalFromParts(parts, LARGE_VALUE_DECIMALS);
  }

  const aboveSmallThreshold = absValue !== null ? absValue >= SMALL_VALUE_THRESHOLD : leadingZeros < 4;
  if (aboveSmallThreshold) {
    const availableDigits = Math.min(parts.fraction.length, MID_VALUE_DECIMALS);
    const digits = Math.max(leadingZeros + 1, availableDigits);
    return formatDecimalFromParts(parts, digits);
  }

  const aboveReadableThreshold = absValue !== null ? absValue >= MIN_READABLE_THRESHOLD : leadingZeros <= 7;
  if (aboveReadableThreshold) {
    return formatTinyDecimalFromParts(parts);
  }

  return `${parts.sign}${MIN_DISPLAY_AMOUNT.toFixed(6)}`;
}

export function toSubunitAmount(value: string | number, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('Invalid decimals');
  }
  const raw = typeof value === 'number' ? (Number.isFinite(value) ? value.toString() : '') : sanitizeNumericString(String(value ?? '').trim());
  if (!raw) {
    throw new Error('Amount is required');
  }
  const parts = toDecimalParts(raw);
  if (!parts) {
    throw new Error('Invalid amount format');
  }
  if (parts.sign === '-') {
    throw new Error('Amount must be positive');
  }
  if (decimals === 0) {
    return parts.integer.replace(/^0+(?=\d)/, '') || '0';
  }
  const fraction = (parts.fraction || '').slice(0, decimals).padEnd(decimals, '0');
  const combined = `${parts.integer}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
  return combined;
}
