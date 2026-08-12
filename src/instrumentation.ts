import logger from '@/lib/logger';

export async function register() {
  // Only run on the server (Node.js runtime)
  if (typeof window !== 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const CRON_SECRET = process.env.CRON_SECRET;
  const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!CRON_SECRET) {
    logger.warn('[AutoBackup] CRON_SECRET not configured, auto-backup disabled.');
    return;
  }

  // Schedule first backup after 1 minute delay (let server fully start)
  setTimeout(() => {
    triggerBackup(BASE_URL, CRON_SECRET);
    
    // Then schedule recurring backup every 24 hours
    setInterval(() => {
      triggerBackup(BASE_URL, CRON_SECRET);
    }, BACKUP_INTERVAL_MS);
  }, 60 * 1000);

  logger.info('[AutoBackup] Scheduled daily auto-backup at 24h intervals.');
}

async function triggerBackup(baseUrl: string, cronSecret: string) {
  try {
    const res = await fetch(`${baseUrl}/api/backup/cron`, {
      headers: { 'x-cron-secret': cronSecret }
    });
    if (res.ok) {
      logger.info(`[AutoBackup] Daily backup completed successfully at ${new Date().toISOString()}`);
    } else {
      logger.error(`[AutoBackup] Backup failed with status ${res.status}`);
    }
  } catch (error) {
    logger.error('[AutoBackup] Backup trigger error:', error);
  }
}
