import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import logger from '@/lib/logger';

async function runFixBankIds() {
  logger.info('🚀 [Database Cleanup]: Starting Bank ID (6-digit) and Mobile (11-digit) normalization...');

  try {
    // 1. Employee
    const empBankResult = await db.execute(sql`
      UPDATE "Employee" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    const empMobileResult = await db.execute(sql`
      UPDATE "Employee" 
      SET "mobile" = '0' || "mobile" 
      WHERE "mobile" ~ '^1[0-9]{9}$'
    `);
    logger.info(`✅ [Employee]: Bank IDs and mobile numbers updated.`);

    // 2. User
    const userResult = await db.execute(sql`
      UPDATE "User" 
      SET "username" = LPAD("username", 6, '0') 
      WHERE "username" ~ '^[0-9]{1,5}$'
    `);
    const userMobileResult = await db.execute(sql`
      UPDATE "User" 
      SET "mobile" = '0' || "mobile" 
      WHERE "mobile" ~ '^1[0-9]{9}$'
    `);
    logger.info(`✅ [User]: Usernames and mobile numbers updated.`);

    // 3. LeaveApplication
    await db.execute(sql`
      UPDATE "LeaveApplication" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    await db.execute(sql`
      UPDATE "LeaveApplication" 
      SET "mobileNo" = '0' || "mobileNo" 
      WHERE "mobileNo" ~ '^1[0-9]{9}$'
    `);
    logger.info(`✅ [LeaveApplication]: Bank IDs and mobile numbers updated.`);

    // 4. Executive
    await db.execute(sql`
      UPDATE "Executive" 
      SET "bankId" = LPAD("bankId", 6, '0') 
      WHERE "bankId" ~ '^[0-9]{1,5}$'
    `);
    await db.execute(sql`
      UPDATE "Executive" 
      SET "phone" = '0' || "phone" 
      WHERE "phone" ~ '^1[0-9]{9}$'
    `);
    logger.info(`✅ [Executive]: Bank IDs and phones updated.`);

    logger.info('🎉 [Database Cleanup]: All Bank IDs and mobile numbers successfully normalized to standard format!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ [Database Cleanup]: Failed to run cleanup:', error);
    process.exit(1);
  }
}

runFixBankIds();
