import { describe, it, expect } from 'vitest';
import {
  renderDatesInPairs,
  sortDatesAscending,
  sortDatesStringAscending,
  getShortDesignation,
  cleanBracketName
} from '../print-helpers';

describe('print-helpers', () => {
  describe('renderDatesInPairs', () => {
    it('should sort date strings in chronological ascending order and pair them in 2s', () => {
      // Input from user scenario
      const input = '০১-০৬-২০২৬, ২৩-০৫-২০২৬, ২০-০৫-২০২৬, ১৮-০৫-২০২৬, ১৬-০৫-২০২৬, ০৯-০৫-২০২৬';
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০৯-০৫-২০২৬, ১৬-০৫-২০২৬',
        '১৮-০৫-২০২৬, ২০-০৫-২০২৬',
        '২৩-০৫-২০২৬, ০১-০৬-২০২৬'
      ]);
    });

    it('should sort ISO date array in chronological ascending order and pair them in 2s', () => {
      const input = ['2026-06-01', '2026-05-23', '2026-05-20', '2026-05-18', '2026-05-16', '2026-05-09'];
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০৯-০৫-২০২৬, ১৬-০৫-২০২৬',
        '১৮-০৫-২০২৬, ২০-০৫-২০২৬',
        '২৩-০৫-২০২৬, ০১-০৬-২০২৬'
      ]);
    });

    it('should handle Row 2 4-dates correctly in ascending pairs', () => {
      const input = '২৩-০৫-২০২৬, ১৮-০৫-২০২৬, ১৬-০৫-২০২৬, ০৯-০৫-২০২৬';
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০৯-০৫-২০২৬, ১৬-০৫-২০২৬',
        '১৮-০৫-২০২৬, ২৩-০৫-২০২৬'
      ]);
    });

    it('should handle odd number of dates with last single date', () => {
      const input = '২৩-০৫-২০২৬, ২০-০৫-২০২৬, ১৮-০৫-২০২৬, ১৬-০৫-২০২৬, ০৯-০৫-২০২৬';
      const result = renderDatesInPairs(input);

      expect(result).toEqual([
        '০৯-০৫-২০২৬, ১৬-০৫-২০২৬',
        '১৮-০৫-২০২৬, ২০-০৫-২০২৬',
        '২৩-০৫-২০২৬'
      ]);
    });

    it('should handle empty or null input gracefully', () => {
      expect(renderDatesInPairs('')).toEqual([]);
      expect(renderDatesInPairs([])).toEqual([]);
    });
  });

  describe('sortDatesStringAscending', () => {
    it('should sort a comma-separated dates string in ascending order', () => {
      const input = '০১-০৬-২০২৬, ২৩-০৫-২০২৬, ২০-০৫-২০২৬, ১৮-০৫-২০২৬, ১৬-০৫-২০২৬, ০৯-০৫-২০২৬';
      const result = sortDatesStringAscending(input);

      expect(result).toBe('০৯-০৫-২০২৬, ১৬-০৫-২০২৬, ১৮-০৫-২০২৬, ২০-০৫-২০২৬, ২৩-০৫-২০২৬, ০১-০৬-২০২৬');
    });
  });

  describe('sortDatesAscending', () => {
    it('should sort ISO strings ascending', () => {
      const input = ['2026-12-31', '2026-01-01', '2026-06-15'];
      expect(sortDatesAscending(input)).toEqual(['2026-01-01', '2026-06-15', '2026-12-31']);
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
