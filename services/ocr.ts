// On-device OCR for payment cards. Uses Google ML Kit Text Recognition via
// @react-native-ml-kit/text-recognition. The photo never leaves the device.
//
// SECURITY:
// - Never log extracted values.
// - Never send photo URI or text to any network endpoint.
// - CVV is NOT extracted — even if visible, never read back.

import { Platform } from 'react-native';
import type { CardBrand, IdKind } from '../store/types';

export type CardOcrResult = {
  number?: string;
  expiry?: string;
  holder?: string;
  brand?: CardBrand;
};

export type IdOcrResult = {
  number?: string;
  name?: string;
};

export function luhnValid(digits: string): boolean {
  const s = digits.replace(/\D/g, '');
  if (s.length < 12 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = s.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function brandFromNumber(digits: string): CardBrand | undefined {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mc';
  // RuPay BIN ranges (partial, per NPCI public info).
  if (/^(60|6521|6522|81|82|508)/.test(digits)) return 'rupay';
  return undefined;
}

function extractNumber(text: string): string | undefined {
  // Look for 13–19 digit runs with optional space/dash separators.
  const re = /(?:\d[\s-]?){12,18}\d/g;
  const matches = text.match(re) ?? [];
  for (const raw of matches) {
    const digits = raw.replace(/\D/g, '');
    if (luhnValid(digits)) return digits;
  }
  return undefined;
}

function extractExpiry(text: string): string | undefined {
  // MM/YY, MM-YY, MM YY — month 01-12, year 2-digit.
  const re = /\b(0[1-9]|1[0-2])[\s/\-.](\d{2})\b/;
  const m = text.match(re);
  if (!m) return undefined;
  return `${m[1]}/${m[2]}`;
}

function extractHolder(text: string, number?: string, expiry?: string): string | undefined {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (number && line.includes(number.slice(0, 4))) continue;
    if (expiry && line.includes(expiry)) continue;
    if (/\d/.test(line)) continue;
    // Holder typically all caps, >= 2 words, alpha + space only.
    if (/^[A-Z][A-Z .'-]{2,}\s+[A-Z][A-Z .'-]{2,}$/.test(line) && line.length <= 32) {
      return line;
    }
  }
  return undefined;
}

export async function recognizeCard(photoUri: string): Promise<CardOcrResult> {
  const text = await runOcr(photoUri);
  if (!text) return {};
  const number = extractNumber(text);
  const expiry = extractExpiry(text);
  const holder = extractHolder(text, number, expiry);
  const brand = number ? brandFromNumber(number) : undefined;
  return { number, expiry, holder, brand };
}

// ── ID documents (PAN / Aadhaar / DL) ───────────────────────────────────────

const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
// DL formats vary by state; this catches most: 2 letters + digits (spaces/dashes allowed), 10–16 chars total.
const DL_RE = /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?\d{4}[-\s]?\d{6,8}\b/;

function extractIdNumber(kind: IdKind, text: string): string | undefined {
  const upper = text.toUpperCase();
  if (kind === 'pan') return upper.match(PAN_RE)?.[0];
  if (kind === 'aadhaar') {
    const m = text.match(AADHAAR_RE)?.[0];
    return m ? m.replace(/\s+/g, ' ').trim() : undefined;
  }
  if (kind === 'dl') return upper.match(DL_RE)?.[0]?.replace(/\s+/g, '');
  return undefined;
}

function extractIdName(text: string, exclude: string[]): string | undefined {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (exclude.some((e) => e && line.includes(e))) continue;
    if (/\d/.test(line)) continue;
    if (line.length < 4 || line.length > 40) continue;
    // Match "GOVERNMENT OF INDIA" style headers too but skip generic single words.
    if (/^[A-Z][A-Z .'-]{2,}\s+[A-Z][A-Z .'-]{2,}/.test(line)) {
      // Skip obvious header lines.
      if (/GOVERNMENT|INCOME|UNIQUE|AUTHORITY|INDIA|TRANSPORT|LICENCE|LICENSE|CARD|DEPARTMENT/i.test(line)) continue;
      return line;
    }
  }
  return undefined;
}

export async function recognizeId(kind: IdKind, photoUri: string): Promise<IdOcrResult> {
  const text = await runOcr(photoUri);
  if (!text) return {};
  const number = extractIdNumber(kind, text);
  const name = extractIdName(text, [number ?? '']);
  return { number, name };
}

async function runOcr(photoUri: string): Promise<string> {
  if (Platform.OS === 'web') return '';
  let TextRecognition: typeof import('@react-native-ml-kit/text-recognition').default;
  try {
    TextRecognition = require('@react-native-ml-kit/text-recognition').default;
  } catch {
    return '';
  }
  try {
    const result = await TextRecognition.recognize(photoUri);
    return result?.text ?? '';
  } catch {
    return '';
  }
}
