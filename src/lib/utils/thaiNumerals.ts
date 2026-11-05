/**
 * src/lib/utils/thaiNumerals.ts
 * ==============================================================================
 * Thai Numeral, Date Conversion & BahtText Utilities
 * ==============================================================================
 */

export const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'] as const;

export const THAI_MONTHS = [
  '',
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
] as const;

/**
 * Converts all Arabic digits (0-9) in a string or number to Thai numerals (๐-๙).
 */
export function toThaiDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[0-9]/g, (d) => THAI_DIGITS[Number(d)]);
}

/**
 * Converts Thai digits (๐-๙) back to Arabic digits (0-9).
 */
export function toArabicDigits(val: string | null | undefined): string {
  if (!val) return '';
  const thaiToArabicMap: Record<string, string> = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
  };
  return val.replace(/[๐-๙]/g, (ch) => thaiToArabicMap[ch] || ch);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into official Thai format: "D Month BE"
 * Example: "2026-10-29" -> "29 ตุลาคม 2569"
 */
export function formatThaiDate(dateIso: string): string {
  if (!dateIso || !dateIso.includes('-')) return '';
  const [yStr, mStr, dStr] = dateIso.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return '';
  const be = y + 543;
  return `${d} ${THAI_MONTHS[m]} ${be}`;
}

/**
 * Formats an ISO date string into official Thai date with Thai numerals.
 * Example: "2026-10-29" -> "๒๙ ตุลาคม ๒๕๖๙"
 */
export function formatThaiDateWithDigits(dateIso: string): string {
  return toThaiDigits(formatThaiDate(dateIso));
}

/**
 * Converts an Arabic address string into Thai numerals and splits into address_line1 and line2.
 */
export function convertAddressArabicToThai(arabicAddress: string): {
  address_line1: string;
  address_line2: string;
} {
  if (!arabicAddress) return { address_line1: '', address_line2: '' };

  // Convert all digits to Thai numerals
  const converted = toThaiDigits(arabicAddress);

  // Attempt smart split on common administrative keywords: "อำเภอ", "อ.", "เขต"
  const splitKeywords = ['อำเภอ', 'อ.', 'เขต'];
  for (const kw of splitKeywords) {
    const idx = converted.indexOf(kw);
    if (idx > 0) {
      return {
        address_line1: converted.slice(0, idx).trim(),
        address_line2: converted.slice(idx).trim(),
      };
    }
  }

  // Fallback: split on comma if available
  if (converted.includes(',')) {
    const parts = converted.split(',');
    return {
      address_line1: parts[0].trim(),
      address_line2: parts.slice(1).join(',').trim(),
    };
  }

  return {
    address_line1: converted,
    address_line2: '',
  };
}

/**
 * Converts numbers into official Thai BahtText words
 * Mirroring salary_calculation_engine.py baht_text()
 */
export function bahtText(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '';
  const num = Number(val);
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const isNeg = num < 0;
  const absNum = Math.abs(num);

  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readGroup(groupStr: string, isMillions: boolean = false): string {
    const s = groupStr.padStart(6, '0');
    let res = '';
    const len = s.length;

    for (let i = 0; i < len; i++) {
      const digit = Number(s[i]);
      const pos = len - 1 - i;

      if (digit === 0) continue;

      if (pos === 0) {
        if (digit === 1 && len > 1) {
          const tensDigit = Number(s[len - 2]);
          if (tensDigit !== 0) {
            res += 'เอ็ด';
          } else {
            res += 'หนึ่ง';
          }
        } else {
          res += units[digit];
        }
      } else if (pos === 1) {
        if (digit === 1) {
          res += 'สิบ';
        } else if (digit === 2) {
          res += 'ยี่สิบ';
        } else {
          res += units[digit] + 'สิบ';
        }
      } else {
        res += units[digit] + places[pos];
      }
    }
    return res;
  }

  // Format to 2 decimal places
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  let intRes = '';
  if (intPart === '0') {
    intRes = 'ศูนย์';
  } else {
    // Split into 6-digit blocks from right to left
    const blocks: string[] = [];
    let cur = intPart;
    while (cur.length > 6) {
      blocks.unshift(cur.slice(cur.length - 6));
      cur = cur.slice(0, cur.length - 6);
    }
    blocks.unshift(cur);

    for (let b = 0; b < blocks.length; b++) {
      const blockStr = blocks[b];
      const blockRead = readGroup(blockStr, b > 0);
      intRes += blockRead;
      if (b < blocks.length - 1 && blockRead.length > 0) {
        intRes += 'ล้าน';
      }
    }
  }

  const satangVal = Number(decPart);
  let satangRes = '';
  if (satangVal > 0) {
    const d1 = Number(decPart[0]);
    const d2 = Number(decPart[1]);
    if (d1 === 1) satangRes += 'สิบ';
    else if (d1 === 2) satangRes += 'ยี่สิบ';
    else if (d1 > 2) satangRes += units[d1] + 'สิบ';

    if (d2 === 1 && d1 !== 0) satangRes += 'เอ็ด';
    else if (d2 > 0) satangRes += units[d2];

    satangRes += 'สตางค์';
  }

  let finalStr = '';
  if (intPart === '0' && satangVal > 0) {
    finalStr = `ศูนย์บาท${satangRes}`;
  } else if (satangVal === 0) {
    finalStr = `${intRes}บาทถ้วน`;
  } else {
    finalStr = `${intRes}บาท${satangRes}`;
  }

  return isNeg ? `ลบ${finalStr}` : finalStr;
}
