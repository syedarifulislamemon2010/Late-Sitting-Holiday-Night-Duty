import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isBcryptHash, hashPassword } from '@/lib/password';
import logger from '@/lib/logger';

/**
 * One-time password migration script:
 * Migrates legacy plaintext passwords to secure bcrypt hashes in the database
 * while preserving every user's existing password value unchanged.
 */
async function migratePasswords() {
  logger.info('🔒 [Password Migration]: Starting password hashing migration...');

  try {
    const allUsers = await db.select().from(users);
    logger.info(`📊 [Password Migration]: Found total ${allUsers.length} user records.`);

    let alreadyHashedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      if (!user.password || user.password.trim() === '') {
        logger.warn(`⚠️ [Skip]: User @${user.username} (ID: ${user.id}) has empty password.`);
        skippedCount++;
        continue;
      }

      if (isBcryptHash(user.password)) {
        alreadyHashedCount++;
        continue;
      }

      // Plaintext password detected -> hash existing password value
      const plaintext = user.password;
      const hashedPassword = await hashPassword(plaintext);

      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      logger.info(`✅ [Migrated]: User @${user.username} (ID: ${user.id}) password converted to bcrypt hash.`);
      migratedCount++;
    }

    logger.info('\n=========================================');
    logger.info('🎉 [Password Migration Summary]');
    logger.info(`- Total Users Checked: ${allUsers.length}`);
    logger.info(`- Already Bcrypt Hashed: ${alreadyHashedCount}`);
    logger.info(`- Successfully Migrated: ${migratedCount}`);
    logger.info(`- Skipped (empty): ${skippedCount}`);
    logger.info('=========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ [Password Migration Error]: Failed to migrate passwords:', error);
    process.exit(1);
  }
}

migratePasswords();
