import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * 清理并规范化助记词
 * - trim
 * - 小写
 * - 合并多空格
 * - 删除隐藏字符
 */
const normalizeMnemonic = (mnemonic: string): string => {
  return mnemonic
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 隐藏字符
    .replace(/\u00A0/g, ' ') // NBSP
    .replace(/\u3000/g, ' ') // 全角空格
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * 验证助记词是否有效
 */
export const isValidMnemonic = (mnemonic: string): boolean => {
  if (!mnemonic || !mnemonic.trim()) return false;

  const normalized = normalizeMnemonic(mnemonic);
  const words = normalized.split(' ');

  if (![12, 15, 18, 21, 24].includes(words.length)) return false;

  try {
    return bip39.validateMnemonic(normalized, wordlist);
  } catch (error) {
    console.error('[isValidMnemonic] 验证异常:', (error as Error).message);
    return false;
  }
};

/**
 * 生成随机助记词
 * @param wordCount 12,15,18,21,24
 */
export const generateRandomMnemonic = (wordCount: 12 | 15 | 18 | 21 | 24 = 12): string => {
  // strength maps to entropy bits in BIP39: 12->128, 15->160, 18->192, 21->224, 24->256
  const strengthMap: Record<number, number> = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256,
  };
  const strength = strengthMap[wordCount] || 128;

  return bip39.generateMnemonic(wordlist, strength);
};
