import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অডিট লগ দেখার অনুমতি শুধুমাত্র অ্যাডমিনদের রয়েছে।' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const logFilePath = path.join(process.cwd(), 'logs', 'audit.log');
    if (!fs.existsSync(logFilePath)) {
      if (pageParam || limitParam) {
        return NextResponse.json({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 });
      }
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

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, Math.min(200, parseInt(limitParam || '50', 10)));
      const total = logs.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedLogs = logs.slice(startIndex, startIndex + limit);

      return NextResponse.json({
        data: paginatedLogs,
        total,
        page,
        limit,
        totalPages
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    logger.error('Error reading audit logs:', error);
    return NextResponse.json({ error: 'failed_to_read_audit_logs', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
