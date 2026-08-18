/**
 * Single source of truth for Category Color mappings across LHN Portal
 * Standard Category Tokens:
 * 1. LATE_SITTING / BILL_LATE_SITTING -> Purple (🟣)
 * 2. HOLIDAY / BILL_HOLIDAY           -> Sky (🟢/🩵)
 * 3. NIGHT_SHIFT / BILL_NIGHT_SHIFT   -> Blue (🔵)
 */

export type BaseCategory = 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';

export interface CategoryColorConfig {
  key: BaseCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
  textClass: string;
  bgLight: string;
  borderClass: string;
  accentCardClass: string;
}

export function normalizeCategory(cat: string): BaseCategory {
  if (!cat) return 'LATE_SITTING';
  const clean = cat.replace(/^BILL_/, '').toUpperCase();
  if (clean === 'HOLIDAY') return 'HOLIDAY';
  if (clean === 'NIGHT_SHIFT') return 'NIGHT_SHIFT';
  return 'LATE_SITTING';
}

export const CATEGORY_CONFIG: Record<BaseCategory, CategoryColorConfig> = {
  LATE_SITTING: {
    key: 'LATE_SITTING',
    label: 'লেট সিটিং',
    shortLabel: 'লেট-সিটিং',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50',
    dotColor: 'bg-purple-600 dark:bg-purple-400',
    textClass: 'text-purple-700 dark:text-purple-300',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200 dark:border-purple-900/50',
    accentCardClass: 'from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-100/50 dark:border-purple-950/50'
  },
  HOLIDAY: {
    key: 'HOLIDAY',
    label: 'সরকারি ছুটি',
    shortLabel: 'ছুটির দিন',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/50',
    dotColor: 'bg-sky-600 dark:bg-sky-400',
    textClass: 'text-sky-700 dark:text-sky-300',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-900/50',
    accentCardClass: 'from-sky-50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10 border-sky-100/50 dark:border-sky-950/50'
  },
  NIGHT_SHIFT: {
    key: 'NIGHT_SHIFT',
    label: 'রাত্রীকালীন',
    shortLabel: 'নাইট শিফট',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
    dotColor: 'bg-blue-600 dark:bg-blue-400',
    textClass: 'text-blue-700 dark:text-blue-300',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200 dark:border-blue-900/50',
    accentCardClass: 'from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-100/50 dark:border-blue-950/50'
  }
};

export function getCategoryConfig(cat: string): CategoryColorConfig {
  const norm = normalizeCategory(cat);
  return CATEGORY_CONFIG[norm];
}
