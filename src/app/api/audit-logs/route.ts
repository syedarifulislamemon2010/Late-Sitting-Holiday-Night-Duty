import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন সিস্টেম লগ দেখতে পারবেন।' }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to last 1000 logs for performance
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'failed_to_fetch_logs', message: error.message }, { status: 500 });
  }
}
