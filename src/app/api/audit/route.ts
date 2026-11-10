import { auditRbacRequest } from '@/lib/rbac-audit';
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser) auditRbacRequest('GET', '/api/audit', currentUser);
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

    let lineIndex = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const raw = JSON.parse(trimmed);
          lineIndex++;
          
          // Unified normalized audit log object compatible with both /audit and /users
          const timestamp = raw.timestamp || raw.createdAt || new Date().toISOString();
          const username = raw.username || raw.bankId || raw.userId || 'Unknown';
          const action = raw.action || raw.actionType || 'ACTIVITY';
          const recordId = raw.recordId || raw.entityId || 'N/A';
          const id = raw.id || `${timestamp}-${lineIndex}`;

          logs.push({
            id,
            timestamp,
            createdAt: timestamp,
            userId: raw.userId || username,
            bankId: raw.bankId || username,
            username,
            cell: raw.cell || 'N/A',
            recordId,
            entityId: recordId,
            action,
            actionType: action,
            ipAddress: raw.ipAddress || '127.0.0.1',
            userAgent: raw.userAgent || 'Unknown',
            details: raw.details || ''
          });
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
    return NextResponse.json({ error: 'failed_to_read_audit_logs', message: 'অডিট লগ লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}
