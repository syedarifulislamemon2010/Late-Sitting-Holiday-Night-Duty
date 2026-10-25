// Track failed login attempts for brute-force lockout (5 attempts -> 15 min lock)
// Hybrid storage: attempts DB persistence with seamless in-memory fallback.
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { sql } from 'drizzle-orm';

export interface LoginAttempt {
  count: number;
  lockedUntil: number;
}

const memoryLockouts = new Map<string, LoginAttempt>();
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function getLoginAttempt(key: string): Promise<LoginAttempt> {
  const now = Date.now();
  try {
    const result = await db.execute<{ count: number; locked_until: string | null }>(
      sql`SELECT "count", "lockedUntil" AS locked_until FROM "LoginAttempt" WHERE "key" = ${key} LIMIT 1`
    );
    if (result && result.length > 0) {
      const row = result[0];
      const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : 0;
      return { count: Number(row.count), lockedUntil };
    }
  } catch (dbErr) {
    // Graceful fallback to in-memory state on DB error or before migration is applied
    logger.debug('[Auth Lockout] DB query skipped/failed, falling back to memory store');
  }

  return memoryLockouts.get(key) || { count: 0, lockedUntil: 0 };
}

export async function recordFailedAttempt(key: string, username: string, ipAddress: string): Promise<LoginAttempt> {
  const now = Date.now();
  const current = await getLoginAttempt(key);
  current.count += 1;
  if (current.count >= MAX_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_MS;
    logger.warn(`[Auth Lockout] Account ${username} locked out from IP ${ipAddress} for 15 minutes after ${current.count} failed attempts.`);
  }

  // Always update in-memory
  memoryLockouts.set(key, current);

  // Attempt DB persistence
  try {
    const lockedUntilDate = current.lockedUntil > 0 ? new Date(current.lockedUntil).toISOString() : null;
    await db.execute(
      sql`INSERT INTO "LoginAttempt" ("key", "username", "ipAddress", "count", "lockedUntil", "updatedAt")
          VALUES (${key}, ${username}, ${ipAddress}, ${current.count}, ${lockedUntilDate}::timestamp, NOW())
          ON CONFLICT ("key") DO UPDATE SET
            "count" = ${current.count},
            "lockedUntil" = ${lockedUntilDate}::timestamp,
            "updatedAt" = NOW()`
    );
  } catch (dbErr) {
    logger.debug('[Auth Lockout] DB persist failed, continuing with in-memory lockout');
  }

  return current;
}

export async function clearLoginAttempt(key: string): Promise<void> {
  memoryLockouts.delete(key);
  try {
    await db.execute(sql`DELETE FROM "LoginAttempt" WHERE "key" = ${key}`);
  } catch (dbErr) {
    logger.debug('[Auth Lockout] DB delete failed, continuing with in-memory reset');
  }
}
