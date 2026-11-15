import { toEnglishDigits } from './bengali-converter';
import { sql } from 'drizzle-orm';
import type { DbExecutor } from './db';
import logger from './logger';

/**
 * Normalizes Janata Bank PLC Bank ID:
 * - Converts Bengali digits to English digits
 * - Trims whitespace
 * - If numeric and length is between 1 and 5 digits (e.g., '34269'), left-pads with '0' to standard 6 digits ('034269').
 * - Preserves alphanumeric usernames like 'admin'.
 */
export function normalizeBankId(val: string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  const clean = toEnglishDigits(String(val)).trim();
  if (!clean) return null;
  // If purely numeric and 1 to 5 digits, pad with leading zeros to 6 digits
  if (/^\d{1,5}$/.test(clean)) {
    return clean.padStart(6, '0');
  }
  return clean;
}

/**
 * Normalizes Bangladesh Mobile Number:
 * - Converts Bengali digits to English digits
 * - Removes non-digit characters (spaces, dashes, parens, etc.)
 * - If prefixed with +880 or 880 (13 digits), removes country prefix -> 11 digits
 * - If 10 digits starting with '1' (e.g., '1766489774' from Excel stripping '0'), prepends '0' -> '01766489774'
 */
export function normalizeMobile(val: string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  let digits = toEnglishDigits(String(val)).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('880') && digits.length === 13) {
    digits = digits.slice(2);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Returns possible Bank ID candidates for searching/authenticating:
 * If numeric, includes:
 * 1. Cleaned input
 * 2. 6-digit zero-padded variant (e.g., '034269')
 * 3. Leading-zero-stripped variant (e.g., '34269')
 */
export function getBankIdSearchCandidates(val: string | null | undefined): string[] {
  if (!val) return [];
  const clean = toEnglishDigits(String(val)).trim();
  if (!clean) return [];

  const candidates = new Set<string>();
  candidates.add(clean);

  if (/^\d+$/.test(clean)) {
    if (clean.length <= 6) {
      candidates.add(clean.padStart(6, '0'));
      const stripped = clean.replace(/^0+/, '');
      if (stripped) {
        candidates.add(stripped);
      }
    }
  }

  return Array.from(candidates);
}

/**
 * Self-healing repair for existing database records:
 * Pads any 1-5 digit bankId/username to 6 digits,
 * and prepends leading '0' to any 10-digit mobile number starting with '1'.
 */
let repairExecuted = false;
export async function repairBankIdsAndMobilesInDb(dbExecutor: DbExecutor): Promise<{ updated: boolean }> {
  if (repairExecuted) return { updated: false };
  try {
    // 1. Repair Employee table
    await dbExecutor.execute(sql`
      UPDATE "Employee" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    await dbExecutor.execute(sql`
      UPDATE "Employee" 
      SET "mobile" = '0' || "mobile" 
      WHERE "mobile" ~ '^1[0-9]{9}$'
    `);

    // 2. Repair User table (username and mobile)
    await dbExecutor.execute(sql`
      UPDATE "User" 
      SET "username" = LPAD("username", 6, '0') 
      WHERE "username" ~ '^[0-9]{1,5}$'
    `);
    await dbExecutor.execute(sql`
      UPDATE "User" 
      SET "mobile" = '0' || "mobile" 
      WHERE "mobile" ~ '^1[0-9]{9}$'
    `);

    // 3. Repair LeaveApplication table
    await dbExecutor.execute(sql`
      UPDATE "LeaveApplication" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    await dbExecutor.execute(sql`
      UPDATE "LeaveApplication" 
      SET "mobileNo" = '0' || "mobileNo" 
      WHERE "mobileNo" ~ '^1[0-9]{9}$'
    `);

    // 4. Repair Executive table
    await dbExecutor.execute(sql`
      UPDATE "Executive" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    await dbExecutor.execute(sql`
      UPDATE "Executive" 
      SET "phone" = '0' || "phone" 
      WHERE "phone" ~ '^1[0-9]{9}$'
    `);

    repairExecuted = true;
    logger.info('✅ [Data Self-Healing]: Successfully verified and repaired 6-digit Bank IDs and 11-digit mobile numbers in DB.');
    return { updated: true };
  } catch (error) {
    logger.error('⚠️ [Data Self-Healing]: Failed to run bankId/mobile repair query:', error);
    return { updated: false };
  }
}
