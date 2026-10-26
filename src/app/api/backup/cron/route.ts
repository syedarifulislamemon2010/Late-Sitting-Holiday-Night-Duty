import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecretHeader = req.headers.get('x-cron-secret');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const providedSecret = cronSecretHeader || bearerSecret;

    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (!providedSecret || providedSecret.length !== CRON_SECRET.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedSecret, 'utf-8'),
      Buffer.from(CRON_SECRET, 'utf-8')
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all tables
    const allData = {
      cells: await db.select().from(schema.cells),
      users: await db.select().from(schema.users),
      userCells: await db.select().from(schema.userCells),
      employees: await db.select().from(schema.employees),
      duties: await db.select().from(schema.duties),
      holidays: await db.select().from(schema.holidays),
      officeOrders: await db.select().from(schema.officeOrders),
      leaveApplications: await db.select().from(schema.leaveApplications),
      lunchBills: await db.select().from(schema.lunchBills),
      executives: await db.select().from(schema.executives),
      documents: await db.select().from(schema.documents),
      manualDocuments: await db.select().from(schema.manualDocuments),
      auditLogs: await db.select().from(schema.auditLogs),
      hardwareRequisitions: await db.select().from(schema.hardwareRequisitions),
      hardwareRequisitionItems: await db.select().from(schema.hardwareRequisitionItems),
      tazCommitteeForms: await db.select().from(schema.tazCommitteeForms),
      trash: await db.select().from(schema.trash),
    };

    const dataString = JSON.stringify(allData);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    const recordCounts: Record<string, number> = {};
    Object.entries(allData).forEach(([key, val]) => {
      recordCounts[key] = Array.isArray(val) ? val.length : 0;
    });

    // Encrypt backup payload with AES-256-GCM
    const isBuildOrTest =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NODE_ENV === 'test' ||
      !!process.env.CI ||
      process.env.npm_lifecycle_event === 'build';

    const rawKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
    if (!rawKey && process.env.NODE_ENV === 'production' && !isBuildOrTest) {
      throw new Error('🚨 [Critical Security Error]: BACKUP_ENCRYPTION_KEY or NEXTAUTH_SECRET is required in production.');
    }
    const effectiveKey = rawKey || (isBuildOrTest || process.env.NODE_ENV !== 'production' ? 'ci-build-temporary-nextauth-secret-key-2026' : undefined);
    if (!effectiveKey) {
      throw new Error('🚨 [Critical Security Error]: Backup encryption key is missing.');
    }
    const ENCRYPTION_KEY = crypto.createHash('sha256').update(effectiveKey).digest();

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(dataString, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const backupRecord = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      checksum,
      tablesCount: Object.keys(allData).length,
      recordCounts,
      payload: {
        encryptedData: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      }
    };

    // Ensure backups directory exists and persist to disk
    const BACKUP_DIR = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backup-${dateStr}-${Date.now()}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(backupRecord, null, 2), 'utf-8');

    // Update history.json
    const historyPath = path.join(BACKUP_DIR, 'history.json');
    let history: Record<string, unknown>[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch {}
    }
    history.push({
      id: fileName,
      date: new Date().toISOString(),
      size: fs.statSync(filePath).size,
      status: 'success',
      tablesCount: Object.keys(allData).length,
    });
    if (history.length > 100) history = history.slice(-100);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');

    logger.info(`[AutoBackup] Successfully written daily backup to disk: ${fileName}`);

    // Return safe confirmation without leaking sensitive database records over HTTP
    return NextResponse.json({
      success: true,
      message: 'স্বয়ংক্রিয় ডাটাবেজ ব্যাকআপ সফলভাবে ডিস্কে সংরক্ষিত হয়েছে।',
      fileName,
      timestamp: backupRecord.timestamp,
      checksum,
      tablesCount: Object.keys(allData).length,
      recordCounts
    }, { status: 200 });
  } catch (error) {
    logger.error('Cron backup generation error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
