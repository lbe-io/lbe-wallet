export const hex2Text = (hex: string) => {
  try {
    return hex.startsWith('0x') ? decodeURIComponent(hex.replace(/^0x/, '').replace(/[0-9a-f]{2}/g, '%$&')) : hex;
  } catch {
    return hex;
  }
};

export const getOriginName = (origin: string) => {
  const matches = origin.replace(/https?:\/\//, '').match(/^([^.]+\.)?(\S+)\./);
  return matches ? matches[2] || origin : origin;
};

export const hashCode = (str: string) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
};

export const ellipsisOverflowedText = (str: string, length = 5, removeLastComma = false) => {
  if (str.length <= length) return str;
  let cut = str.substring(0, length);
  if (removeLastComma && cut.endsWith(',')) {
    cut = cut.substring(0, length - 1);
  }
  return `${cut}...`;
};

export function shortAddress(address?: string | number, len = 5) {
  if (address == null) return '';

  if (typeof address !== 'string') return address;

  if (address.length <= len * 2) return address;

  return `${address.slice(0, len)}...${address.slice(address.length - len)}`;
}

export function shortDesc(desc?: string, len = 50) {
  if (!desc) return '';
  if (desc.length <= len) return desc;
  return `${desc.slice(0, len)}...`;
}

export const getOriginFromUrl = (url: string) => {
  const urlObj = new URL(url);
  return urlObj.origin;
};

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}
