import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { users, userCells, cells, auditLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getMacAddress(): Promise<string> {
  return 'Not Available';
}

export async function logActivity(params: {
  username: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  userId?: string | number;
  bankId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
}) {
  const timestamp = new Date().toISOString();
  let cellName = 'Unknown';

  try {
    const userList = await db.select().from(users).where(eq(users.username, params.username));
    const user = userList[0];
    if (user) {
      const associatedCells = await db.select({
        name: cells.name
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id))
      .where(eq(userCells.B, user.id));

      if (associatedCells.length > 0) {
        cellName = associatedCells.map((c: { name: string }) => c.name).join(', ');
      }
    }
  } catch (dbErr) {
    console.error('Failed to resolve user cells in logActivity:', dbErr);
  }

  const logEntry = {
    timestamp,
    userId: params.userId || 'Unknown',
    bankId: params.bankId || params.username || 'Unknown',
    cell: cellName,
    recordId: params.entityId || 'Unknown',
    actionType: params.action,
    ipAddress: params.ipAddress || '127.0.0.1',
    userAgent: params.userAgent || 'Unknown',
    details: params.details
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  console.log(`[AUDIT LOG] [${timestamp}] User: ${logEntry.bankId} (ID: ${logEntry.userId}), Cell: ${logEntry.cell}, Action: ${logEntry.actionType}, Record: ${logEntry.recordId}, Details: ${params.details}`);

  // 1. Write to database AuditLog table
  try {
    await db.insert(auditLogs).values({
      username: params.username,
      action: params.action,
      entityType: params.entityType || null,
      entityId: params.entityId !== undefined ? String(params.entityId) : null,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Unknown',
      details: params.details
    });
  } catch (dbLogErr) {
    console.error('Failed to write audit log to database:', dbLogErr);
  }

  // 2. Fallback: Write to local audit.log file
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'audit.log');
    fs.appendFileSync(logFilePath, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write audit log to file:', err);
  }
}
