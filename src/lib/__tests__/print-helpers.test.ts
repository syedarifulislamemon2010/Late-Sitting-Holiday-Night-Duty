import { describe, it, expect } from 'vitest';
import {
  renderDatesInPairs,
  sortDatesDescending,
  sortDatesStringDescending,
  getShortDesignation,
  cleanBracketName
} from '../print-helpers';

describe('print-helpers', () => {
  describe('renderDatesInPairs', () => {
    it('should sort Bangla date strings in descending order and pair them in 2s', () => {
      // Input from user scenario (previously in ascending order)
      const input = '০৯-০৫-২০২৬, ১৬-০৫-২০২৬, ১৮-০৫-২০২৬, ২০-০৫-২০২৬, ২৩-০৫-২০২৬, ০১-০৬-২০২৬';
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০১-০৬-২০২৬, ২৩-০৫-২০২৬',
        '২০-০৫-২০২৬, ১৮-০৫-২০২৬',
        '১৬-০৫-২০২৬, ০৯-০৫-২০২৬'
      ]);
    });

    it('should sort ISO date array in descending order and pair them in 2s', () => {
      const input = ['2026-05-09', '2026-05-16', '2026-05-18', '2026-05-20', '2026-05-23', '2026-06-01'];
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০১-০৬-২০২৬, ২৩-০৫-২০২৬',
        '২০-০৫-২০২৬, ১৮-০৫-২০২৬',
        '১৬-০৫-২০২৬, ০৯-০৫-২০২৬'
      ]);
    });

    it('should handle odd number of dates with last single date', () => {
      const input = '০৯-০৫-২০২৬, ১৬-০৫-২০২৬, ১৮-০৫-২০২৬, ২০-০৫-২০২৬, ২৩-০৫-২০২৬';
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '২৩-০৫-২০২৬, ২০-০৫-২০২৬',
        '১৮-০৫-২০২৬, ১৬-০৫-২০২৬',
        '০৯-০৫-২০২৬'
      ]);
    });

    it('should handle empty or null input gracefully', () => {
      expect(renderDatesInPairs('')).toEqual([]);
      expect(renderDatesInPairs([])).toEqual([]);
    });
  });

  describe('sortDatesStringDescending', () => {
    it('should sort a comma-separated dates string in descending order', () => {
      const input = '০৯-০৫-২০২৬, ১৬-০৫-২০২৬, ১৮-০৫-২০২৬, ২০-০৫-২০২৬, ২৩-০৫-২০২৬, ০১-০৬-২০২৬';
      const result = sortDatesStringDescending(input);

      expect(result).toBe('০১-০৬-২০২৬, ২৩-০৫-২০২৬, ২০-০৫-২০২৬, ১৮-০৫-২০২৬, ১৬-০৫-২০২৬, ০৯-০৫-২০২৬');
    });
  });

  describe('sortDatesDescending', () => {
    it('should sort ISO strings descending', () => {
      const input = ['2026-01-01', '2026-12-31', '2026-06-15'];
      expect(sortDatesDescending(input)).toEqual(['2026-12-31', '2026-06-15', '2026-01-01']);
    });
  });

  describe('getShortDesignation', () => {
    it('should extract short designation', () => {
      expect(getShortDesignation('Senior Principal Officer (SPO)')).toBe('SPO');
      expect(getShortDesignation('Principal Officer')).toBe('পিও');
      expect(getShortDesignation('Senior Officer')).toBe('এসো');
    });
  });

  describe('cleanBracketName', () => {
    it('should clean honorific prefix and brackets', () => {
      expect(cleanBracketName('জনাব মোঃ আরিফুল ইসলাম')).toBe('মোঃ আরিফুল ইসলাম');
      expect(cleanBracketName('(রাশেদ)')).toBe('রাশেদ');
    });
  });
});
