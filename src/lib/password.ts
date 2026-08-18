import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Checks if a given string matches standard bcrypt hash format.
 */
export function isBcryptHash(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return BCRYPT_REGEX.test(value.trim());
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Verifies a plaintext password against a stored password string.
 * Supports both modern bcrypt hashes and legacy plaintext passwords.
 * 
 * Returns:
 * - isValid: true if credentials match
 * - needsMigration: true if credentials matched a legacy plaintext password and should be upgraded to bcrypt
 */
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<{ isValid: boolean; needsMigration: boolean }> {
  if (!plainPassword || !storedPassword) {
    return { isValid: false, needsMigration: false };
  }

  if (isBcryptHash(storedPassword)) {
    try {
      const isValid = await bcrypt.compare(plainPassword, storedPassword);
      return { isValid, needsMigration: false };
    } catch (err) {
      logger.error('Error during bcrypt.compare:', err);
      return { isValid: false, needsMigration: false };
    }
  }

  // Legacy plaintext verification
  const isValid = (plainPassword === storedPassword);
  return {
    isValid,
    needsMigration: isValid // If valid plaintext match, it needs migration to bcrypt
  };
}
