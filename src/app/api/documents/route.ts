import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { documents, trash } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { documentDeleteSchema } from '@/validations/manualDocument.schema';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল দেখতে পারবেন।' }, { status: 403 });
    }

    const docs = await db.select().from(documents).orderBy(desc(documents.uploadedAt));
    return NextResponse.json(docs);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = documentDeleteSchema.safeParse(body);
    if (!parseResult.success) {
      return handleApiError(parseResult.error);
    }
    const { id } = parseResult.data;

    const docId = Number(id);
    const docList = await db.select().from(documents).where(eq(documents.id, docId));
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Save to Trash (keep physical file for restoration support)
    const deletedBy: string | null = user ? user.username : null;

    await db.insert(trash).values({
      entityType: 'DOCUMENT',
      entityId: doc.id,
      name: `দলিল: ${doc.name}`,
      data: JSON.stringify(doc),
      deletedBy
    });

    // Delete database entry
    await db.delete(documents).where(eq(documents.id, docId));

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: String(id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) ম্যানুয়াল ফাইল ডিলিট করেছেন: "${doc.name}"।`
    });

    return NextResponse.json({ success: true, message: 'Document soft-deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
