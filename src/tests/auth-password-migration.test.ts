import { describe, it, expect } from 'vitest';
import { isBcryptHash, hashPassword, verifyPassword } from '@/lib/password';

describe('Password Hashing & Dual-Compatibility Migration Engine', () => {
  describe('isBcryptHash', () => {
    it('should correctly identify standard bcrypt hashes ($2a, $2b, $2y)', () => {
      // 60-character bcrypt hash examples
      const validHash2a = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const validHash2b = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7HA3.ee.7bW';
      const validHash2y = '$2y$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7HA3.ee.7bW';

      expect(isBcryptHash(validHash2a)).toBe(true);
      expect(isBcryptHash(validHash2b)).toBe(true);
      expect(isBcryptHash(validHash2y)).toBe(true);
    });

    it('should return false for plaintext passwords, empty strings, and null/undefined', () => {
      expect(isBcryptHash('123456')).toBe(false);
      expect(isBcryptHash('admin123')).toBe(false);
      expect(isBcryptHash('Password@2026!')).toBe(false);
      expect(isBcryptHash('$2b$10$short')).toBe(false);
      expect(isBcryptHash('')).toBe(false);
      expect(isBcryptHash(null)).toBe(false);
      expect(isBcryptHash(undefined)).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash a plaintext password into a valid bcrypt hash', async () => {
      const plain = '123456';
      const hashed = await hashPassword(plain);

      expect(isBcryptHash(hashed)).toBe(true);
      expect(hashed.length).toBe(60);
      expect(hashed).not.toBe(plain);
    });

    it('should generate distinct salt-salted hashes for identical plaintext inputs', async () => {
      const plain = 'JanataBank2026';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      expect(hash1).not.toBe(hash2);
      expect(isBcryptHash(hash1)).toBe(true);
      expect(isBcryptHash(hash2)).toBe(true);
    });
  });

  describe('verifyPassword (Dual Compatibility & Lazy Migration Flow)', () => {
    it('should verify legacy plaintext password and signal that migration is needed', async () => {
      const inputPassword = 'user_old_password';
      const storedLegacyPassword = 'user_old_password';

      const result = await verifyPassword(inputPassword, storedLegacyPassword);

      expect(result.isValid).toBe(true);
      expect(result.needsMigration).toBe(true);
    });

    it('should reject invalid password for legacy plaintext without signaling migration', async () => {
      const inputPassword = 'wrong_password';
      const storedLegacyPassword = 'user_old_password';

      const result = await verifyPassword(inputPassword, storedLegacyPassword);

      expect(result.isValid).toBe(false);
      expect(result.needsMigration).toBe(false);
    });

    it('should verify already-hashed bcrypt password and signal no migration needed', async () => {
      const plainPassword = 'mySecurePassword2026!';
      const storedHash = await hashPassword(plainPassword);

      const result = await verifyPassword(plainPassword, storedHash);

      expect(result.isValid).toBe(true);
      expect(result.needsMigration).toBe(false);
    });

    it('should reject incorrect password for bcrypt-hashed user', async () => {
      const plainPassword = 'correctPassword';
      const wrongPassword = 'incorrectPassword';
      const storedHash = await hashPassword(plainPassword);

      const result = await verifyPassword(wrongPassword, storedHash);

      expect(result.isValid).toBe(false);
      expect(result.needsMigration).toBe(false);
    });

    it('should maintain unbroken login capability through full migration lifecycle (plaintext -> hash -> login)', async () => {
      const userPlainPassword = '123456';

      // Step 1: User logs in with legacy plaintext
      const firstLogin = await verifyPassword(userPlainPassword, userPlainPassword);
      expect(firstLogin.isValid).toBe(true);
      expect(firstLogin.needsMigration).toBe(true);

      // Step 2: System automatically hashes and saves to DB (Lazy migration)
      const migratedDbPassword = await hashPassword(userPlainPassword);
      expect(isBcryptHash(migratedDbPassword)).toBe(true);

      // Step 3: User logs in next time with the EXACT same password '123456'
      const secondLogin = await verifyPassword(userPlainPassword, migratedDbPassword);
      expect(secondLogin.isValid).toBe(true);
      expect(secondLogin.needsMigration).toBe(false);
    });
  });
});
