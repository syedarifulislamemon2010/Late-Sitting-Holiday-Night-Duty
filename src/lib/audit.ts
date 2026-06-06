import fs from 'fs';
import path from 'path';

export async function getMacAddress(ip: string): Promise<string> {
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
  const logEntry = {
    timestamp,
    userId: params.userId || 'Unknown',
    bankId: params.bankId || params.username || 'Unknown',
    recordId: params.entityId || 'Unknown',
    actionType: params.action,
    ipAddress: params.ipAddress || '127.0.0.1',
    userAgent: params.userAgent || 'Unknown',
    details: params.details
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  console.log(`[AUDIT LOG] [${timestamp}] User: ${logEntry.bankId} (ID: ${logEntry.userId}), Action: ${logEntry.actionType}, Record: ${logEntry.recordId}, Details: ${params.details}`);

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
