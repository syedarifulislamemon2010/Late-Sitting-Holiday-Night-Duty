import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { backupRestoreSchema } from '@/validations/backup.schema';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const HISTORY_FILE = path.join(BACKUP_DIR, 'history.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.BACKUP_ENCRYPTION_KEY || 'default-secure-key-12345').digest();

function encryptData(data: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptData(encryptedData: string, ivBase64: string, authTagBase64: string) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

function addHistoryLog(log: any) {
  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    history.push(log);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    logger.error('Failed to write backup history', error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    if (action === 'history') {
      const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      return NextResponse.json(history);
    }

    const currentUser = await getCurrentUser();
    // Allow cron secret bypass
    const cronSecret = req.headers.get('authorization')?.split(' ')[1] || req.headers.get('cron_secret');
    const isCron = cronSecret === process.env.CRON_SECRET;
    
    if (!isCron && (!currentUser || currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
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

    const format = req.nextUrl.searchParams.get('format');
    let responseData: any = allData;

    if (format !== 'raw') {
      const dataString = JSON.stringify(allData);
      const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
      const recordCounts: Record<string, number> = {};
      Object.keys(allData).forEach((key) => {
        recordCounts[key] = (allData as any)[key].length;
      });

      const encrypted = encryptData(dataString);

      responseData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        checksum,
        tablesCount: Object.keys(allData).length,
        recordCounts,
        payload: encrypted, // Add encrypted payload
        data: req.nextUrl.searchParams.get('encryptOnly') === 'true' ? undefined : allData, // Optional raw data based on parameter
      };

      // Save locally
      const fileName = `backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      const filePath = path.join(BACKUP_DIR, fileName);
      fs.writeFileSync(filePath, JSON.stringify(responseData, null, 2));

      // Log to history
      addHistoryLog({
        id: fileName,
        date: new Date().toISOString(),
        size: fs.statSync(filePath).size,
        status: 'success',
        tablesCount: Object.keys(allData).length,
      });
    }

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error('Backup generation error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'bad_request', message: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    let parsedInput = JSON.parse(text);
    backupRestoreSchema.safeParse(parsedInput);
    
    let backupData = parsedInput;
    let isManifest = false;
    
    if (parsedInput.version === '1.0') {
      isManifest = true;
      
      if (parsedInput.payload && parsedInput.payload.encryptedData) {
        try {
          const decryptedStr = decryptData(parsedInput.payload.encryptedData, parsedInput.payload.iv, parsedInput.payload.authTag);
          backupData = JSON.parse(decryptedStr);
        } catch (err) {
          return NextResponse.json({ error: 'decryption_failed', message: 'Failed to decrypt backup data. Invalid key or corrupted data.' }, { status: 400 });
        }
      } else if (parsedInput.data) {
        backupData = parsedInput.data;
      } else {
         return NextResponse.json({ error: 'invalid_format', message: 'No valid data payload found in backup file.' }, { status: 400 });
      }
      
      const dataString = JSON.stringify(backupData);
      const computedChecksum = crypto.createHash('sha256').update(dataString).digest('hex');
      
      if (computedChecksum !== parsedInput.checksum) {
        return NextResponse.json({ error: 'integrity_error', message: 'Backup file checksum validation failed. Data may be corrupted or tampered with.' }, { status: 400 });
      }
    }

    // This is a highly destructive operation. We use transactions to ensure all or nothing.
    // Drizzle doesn't easily support dynamic truncate across all tables in order, 
    // but we can just use raw sql for the truncate.
    
    const recordCounts: Record<string, number> = {};

    await db.transaction(async (tx) => {
      // Temporarily disable foreign key constraints for bulk loading
      // For Postgres, we can TRUNCATE with CASCADE
      const tableNames = [
        'HardwareRequisitionItem', 'HardwareRequisition', 'TazCommitteeForm',
        'LeaveApplication', 'LunchBill', 'Duty', 'Employee', '_UserCells',
        'User', 'Cell', 'Holiday', 'OfficeOrder', 'Executive', 'Document',
        'ManualDocument', 'AuditLog', 'Trash'
      ];

      for (const tableName of tableNames) {
        await tx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
      }

      // Re-insert data in correct order to respect foreign keys (User and Cell first, then dependents)
      if (backupData.cells?.length) { await tx.insert(schema.cells).values(backupData.cells); recordCounts.cells = backupData.cells.length; }
      if (backupData.users?.length) { await tx.insert(schema.users).values(backupData.users); recordCounts.users = backupData.users.length; }
      if (backupData.userCells?.length) { await tx.insert(schema.userCells).values(backupData.userCells); recordCounts.userCells = backupData.userCells.length; }
      if (backupData.employees?.length) { await tx.insert(schema.employees).values(backupData.employees); recordCounts.employees = backupData.employees.length; }
      if (backupData.duties?.length) { await tx.insert(schema.duties).values(backupData.duties); recordCounts.duties = backupData.duties.length; }
      if (backupData.holidays?.length) { await tx.insert(schema.holidays).values(backupData.holidays); recordCounts.holidays = backupData.holidays.length; }
      if (backupData.officeOrders?.length) { await tx.insert(schema.officeOrders).values(backupData.officeOrders); recordCounts.officeOrders = backupData.officeOrders.length; }
      if (backupData.leaveApplications?.length) { await tx.insert(schema.leaveApplications).values(backupData.leaveApplications); recordCounts.leaveApplications = backupData.leaveApplications.length; }
      if (backupData.lunchBills?.length) { await tx.insert(schema.lunchBills).values(backupData.lunchBills); recordCounts.lunchBills = backupData.lunchBills.length; }
      if (backupData.executives?.length) { await tx.insert(schema.executives).values(backupData.executives); recordCounts.executives = backupData.executives.length; }
      if (backupData.documents?.length) { await tx.insert(schema.documents).values(backupData.documents); recordCounts.documents = backupData.documents.length; }
      if (backupData.manualDocuments?.length) { await tx.insert(schema.manualDocuments).values(backupData.manualDocuments); recordCounts.manualDocuments = backupData.manualDocuments.length; }
      if (backupData.auditLogs?.length) { await tx.insert(schema.auditLogs).values(backupData.auditLogs); recordCounts.auditLogs = backupData.auditLogs.length; }
      if (backupData.hardwareRequisitions?.length) { await tx.insert(schema.hardwareRequisitions).values(backupData.hardwareRequisitions); recordCounts.hardwareRequisitions = backupData.hardwareRequisitions.length; }
      if (backupData.hardwareRequisitionItems?.length) { await tx.insert(schema.hardwareRequisitionItems).values(backupData.hardwareRequisitionItems); recordCounts.hardwareRequisitionItems = backupData.hardwareRequisitionItems.length; }
      if (backupData.tazCommitteeForms?.length) { await tx.insert(schema.tazCommitteeForms).values(backupData.tazCommitteeForms); recordCounts.tazCommitteeForms = backupData.tazCommitteeForms.length; }
      if (backupData.trash?.length) { await tx.insert(schema.trash).values(backupData.trash); recordCounts.trash = backupData.trash.length; }
      
      // Update sequences to max ID
      for (const tableName of tableNames) {
        if (tableName === '_UserCells') continue; // No ID sequence
        try {
          await tx.execute(sql.raw(`SELECT setval('"${tableName}_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "${tableName}"), 1), false)`));
        } catch (e) {
          logger.warn(`Could not set sequence for ${tableName}:`, e);
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database restored successfully',
      restoredRecords: recordCounts,
      isManifest
    });
  } catch (error) {
    logger.error('Restore error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
