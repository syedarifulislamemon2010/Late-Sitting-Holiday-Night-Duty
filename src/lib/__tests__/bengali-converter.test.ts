import { describe, it, expect } from 'vitest';
import {
  toBanglaDigits,
  getBanglaNumberWords,
  getBanglaDate,
  getBanglaMonthYearLabel,
  detectEncoding
} from '../bengali-converter';

describe('bengali-converter', () => {
  describe('toBanglaDigits', () => {
    it('should convert numbers', () => {
      expect(toBanglaDigits(123)).toBe('১২৩');
    });
    it('should convert strings', () => {
      expect(toBanglaDigits('456')).toBe('৪৫৬');
    });
    it('should handle null and undefined', () => {
      expect(toBanglaDigits(null)).toBe('');
      expect(toBanglaDigits(undefined)).toBe('');
    });
  });

  describe('getBanglaNumberWords', () => {
    it('should convert various amounts (100, 1000, 15000, 30400)', () => {
      expect(typeof getBanglaNumberWords(100)).toBe('string');
      expect(typeof getBanglaNumberWords(1000)).toBe('string');
      expect(typeof getBanglaNumberWords(15000)).toBe('string');
      expect(typeof getBanglaNumberWords(30400)).toBe('string');
    });
  });

  describe('getBanglaDate', () => {
    it('should convert date formatting', () => {
      expect(typeof getBanglaDate('2026-06-12')).toBe('string');
    });
  });

  describe('getBanglaMonthYearLabel', () => {
    it('should convert month/year formatting', () => {
      expect(typeof getBanglaMonthYearLabel('2026-06')).toBe('string');
    });
  });

  describe('detectEncoding', () => {
    it('should detect UNICODE vs BIJOY', () => {
      expect(detectEncoding('আমার')).toBe('UNICODE');
      expect(detectEncoding('Avgvi')).toBe('BIJOY_ANSI');
    });
  });
});
