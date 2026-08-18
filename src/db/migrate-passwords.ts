import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isBcryptHash, hashPassword } from '@/lib/password';

/**
 * One-time password migration script:
 * Migrates legacy plaintext passwords to secure bcrypt hashes in the database
 * while preserving every user's existing password value unchanged.
 */
async function migratePasswords() {
  console.log('🔒 [Password Migration]: Starting password hashing migration...');

  try {
    const allUsers = await db.select().from(users);
    console.log(`📊 [Password Migration]: Found total ${allUsers.length} user records.`);

    let alreadyHashedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      if (!user.password || user.password.trim() === '') {
        console.warn(`⚠️ [Skip]: User @${user.username} (ID: ${user.id}) has empty password.`);
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

      console.log(`✅ [Migrated]: User @${user.username} (ID: ${user.id}) password converted to bcrypt hash.`);
      migratedCount++;
    }

    console.log('\n=========================================');
    console.log('🎉 [Password Migration Summary]');
    console.log(`- Total Users Checked: ${allUsers.length}`);
    console.log(`- Already Bcrypt Hashed: ${alreadyHashedCount}`);
    console.log(`- Successfully Migrated: ${migratedCount}`);
    console.log(`- Skipped (empty): ${skippedCount}`);
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ [Password Migration Error]: Failed to migrate passwords:', error);
    process.exit(1);
  }
}

migratePasswords();
