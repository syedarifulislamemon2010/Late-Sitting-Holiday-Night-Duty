import { describe, it, expect } from 'vitest';
import { normalizeBankId, normalizeMobile, getBankIdSearchCandidates } from '../bank-id-helper';

describe('normalizeBankId', () => {
  it('pads 5-digit bank id to 6 digits with leading 0', () => {
    expect(normalizeBankId('34269')).toBe('034269');
    expect(normalizeBankId('43308')).toBe('043308');
    expect(normalizeBankId('26799')).toBe('026799');
  });

  it('pads 1-4 digit numbers to 6 digits', () => {
    expect(normalizeBankId('1')).toBe('000001');
    expect(normalizeBankId('123')).toBe('000123');
    expect(normalizeBankId('4269')).toBe('004269');
  });

  it('leaves already 6-digit bank ids untouched', () => {
    expect(normalizeBankId('034269')).toBe('034269');
    expect(normalizeBankId('043308')).toBe('043308');
    expect(normalizeBankId('123456')).toBe('123456');
  });

  it('converts Bengali digits and pads if needed', () => {
    expect(normalizeBankId('৩৪২৬৯')).toBe('034269');
    expect(normalizeBankId('০৩৪২৬৯')).toBe('034269');
  });

  it('trims whitespace', () => {
    expect(normalizeBankId('  34269  ')).toBe('034269');
    expect(normalizeBankId('  034269  ')).toBe('034269');
  });

  it('preserves non-numeric usernames like admin', () => {
    expect(normalizeBankId('admin')).toBe('admin');
    expect(normalizeBankId('super_admin')).toBe('super_admin');
  });

  it('handles null, undefined, empty string gracefully', () => {
    expect(normalizeBankId(null)).toBe(null);
    expect(normalizeBankId(undefined)).toBe(null);
    expect(normalizeBankId('')).toBe(null);
  });
});

describe('normalizeMobile', () => {
  it('adds leading 0 to 10-digit mobile numbers starting with 1', () => {
    expect(normalizeMobile('1766489774')).toBe('01766489774');
    expect(normalizeMobile('1812345678')).toBe('01812345678');
  });

  it('keeps 11-digit numbers starting with 01 untouched', () => {
    expect(normalizeMobile('01766489774')).toBe('01766489774');
  });

  it('strips +880 and 880 prefixes', () => {
    expect(normalizeMobile('+8801766489774')).toBe('01766489774');
    expect(normalizeMobile('8801766489774')).toBe('01766489774');
  });

  it('removes spaces and hyphens', () => {
    expect(normalizeMobile('01766-489774')).toBe('01766489774');
    expect(normalizeMobile('01766 489 774')).toBe('01766489774');
    expect(normalizeMobile('1766-489774')).toBe('01766489774');
  });

  it('converts Bengali digits to English digits', () => {
    expect(normalizeMobile('০১766489774')).toBe('01766489774');
    expect(normalizeMobile('০১৭৬৬৪৮৯৭৭৪')).toBe('01766489774');
    expect(normalizeMobile('১৭৬৬৪৮৯৭৭৪')).toBe('01766489774');
  });

  it('handles null, undefined, empty string gracefully', () => {
    expect(normalizeMobile(null)).toBe(null);
    expect(normalizeMobile(undefined)).toBe(null);
    expect(normalizeMobile('')).toBe(null);
  });
});

describe('getBankIdSearchCandidates', () => {
  it('returns both unpadded and padded variants for 5-digit bank id', () => {
    const candidates = getBankIdSearchCandidates('34269');
    expect(candidates).toContain('34269');
    expect(candidates).toContain('034269');
  });

  it('returns both padded and stripped variants for 6-digit bank id starting with 0', () => {
    const candidates = getBankIdSearchCandidates('034269');
    expect(candidates).toContain('034269');
    expect(candidates).toContain('34269');
  });

  it('handles Bengali digits input', () => {
    const candidates = getBankIdSearchCandidates('৩৪২৬৯');
    expect(candidates).toContain('34269');
    expect(candidates).toContain('034269');
  });

  it('handles alphanumeric admin usernames', () => {
    const candidates = getBankIdSearchCandidates('admin');
    expect(candidates).toEqual(['admin']);
  });

  it('returns empty array for empty inputs', () => {
    expect(getBankIdSearchCandidates('')).toEqual([]);
    expect(getBankIdSearchCandidates(null)).toEqual([]);
    expect(getBankIdSearchCandidates(undefined)).toEqual([]);
  });
});
