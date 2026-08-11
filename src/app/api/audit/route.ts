import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অডিট লগ দেখার অনুমতি শুধুমাত্র অ্যাডমিনদের রয়েছে।' }, { status: 403 });
    }

    const logFilePath = path.join(process.cwd(), 'logs', 'audit.log');
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json([]);
    }

    const fileContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = fileContent.split('\n');
    const logs = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          logs.push(JSON.parse(trimmed));
        } catch {
          // Ignore malformed lines
        }
      }
    }

    // Newest logs first
    logs.reverse();

    return NextResponse.json(logs);
  } catch (error) {
    logger.error('Error reading audit logs:', error);
    return NextResponse.json({ error: 'failed_to_read_audit_logs', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
