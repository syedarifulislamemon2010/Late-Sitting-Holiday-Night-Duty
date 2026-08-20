import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { manualDocuments, trash } from '@/db/schema';
import { eq, desc, or, and } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import fs from 'fs';
import path from 'path';
import { manualDocumentUpdateSchema } from '@/validations/manualDocument.schema';

// GET: Fetch all manual documents
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    let docs;
    if (user.role === 'ADMIN') {
      docs = await db.select().from(manualDocuments).orderBy(desc(manualDocuments.uploadedAt));
    } else {
      docs = await db.select()
        .from(manualDocuments)
        .where(
          or(
            eq(manualDocuments.uploadedBy, user.username),
            eq(manualDocuments.isVisibleToUsers, true)
          )
        )
        .orderBy(desc(manualDocuments.uploadedAt));
    }
    return NextResponse.json(docs);
  } catch (error) {
    logger.error('Error fetching manual documents:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// POST: Upload a manual document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const isVisibleToUsersVal = user.role === 'ADMIN' ? (formData.get('isVisibleToUsers') === 'true') : false;

    if (!file) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ফাইল নির্বাচন করুন।' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'file_too_large', message: 'ফাইল সাইজ ১০০ মেগাবাইটের (100MB) বেশি হওয়া সম্ভব নয়।' }, { status: 400 });
    }

    // Validate file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv', '.zip'];
    const fileExt = path.extname(file.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ 
        error: 'invalid_type', 
        message: 'অসমর্থিত ফাইল ফরম্যাট। শুধুমাত্র PDF, Word, Excel, JPG, PNG, GIF, TXT, CSV, ZIP ফাইল আপলোড করা যাবে।' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'manual');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/manual/${uniqueFilename}`;

    // Save to database
    const cleanName = file.name.substring(0, file.name.length - fileExt.length);
    const docList = await db.insert(manualDocuments).values({
      name: name || cleanName,
      filePath: relativePath,
      fileSize: file.size,
      fileType: fileExt.substring(1), // e.g. 'docx', 'pdf'
      uploadedBy: user.username,
      isVisibleToUsers: isVisibleToUsersVal,
    }).returning();
    const doc = docList[0];

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    await logActivity({
      username: user.username,
      action: 'CREATE',
      entityType: 'MANUAL_DOCUMENT',
      entityId: String(doc.id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) নতুন ম্যানুয়াল ফাইল আপলোড করেছেন: "${doc.name}"।`
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    logger.error('Manual File Upload Error:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// PUT: Rename manual document or toggle visibility
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await request.json();
    const validation = manualDocumentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ ইনপুট ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { id, name, isVisibleToUsers } = body;

    if (!id) {
      return NextResponse.json({ error: 'missing_parameters', message: 'আইডি আবশ্যক।' }, { status: 400 });
    }

    const docId = Number(id);
    const docList = await db.select().from(manualDocuments).where(eq(manualDocuments.id, docId));
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json({ error: 'not_found', message: 'ফাইলটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Check permissions: Admin can modify any file. User can only modify their own.
    if (user.role !== 'ADMIN' && doc.uploadedBy !== user.username) {
      return NextResponse.json({ error: 'forbidden', message: 'এই ফাইলটি পরিবর্তন করার অনুমতি আপনার নেই।' }, { status: 403 });
    }

    const updateFields: Partial<typeof manualDocuments.$inferInsert> = {};
    let details = '';

    if (name !== undefined) {
      updateFields.name = name;
      details += `ম্যানুয়াল ফাইলের নাম পরিবর্তন করা হয়েছে: "${doc.name}" থেকে "${name}"। `;
    }

    if (isVisibleToUsers !== undefined && user.role === 'ADMIN') {
      updateFields.isVisibleToUsers = isVisibleToUsers;
      details += `ম্যানুয়াল ফাইলের ইউজার দেখার পারমিশন পরিবর্তন করা হয়েছে: ${isVisibleToUsers ? 'দৃশ্যমান' : 'অদৃশ্যমান'}। `;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'missing_parameters', message: 'কোনো পরিবর্তনযোগ্য প্যারামিটার দেওয়া হয়নি।' }, { status: 400 });
    }

    await db.update(manualDocuments)
      .set(updateFields)
      .where(eq(manualDocuments.id, docId));

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: user.username,
      action: 'UPDATE',
      entityType: 'MANUAL_DOCUMENT',
      entityId: String(docId),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) ${details}`
    });

    return NextResponse.json({ success: true, message: 'Document updated successfully' });
  } catch (error) {
    logger.error('Error updating manual document:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// DELETE: Soft delete manual document to Recycle Bin
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id_required', message: 'ফাইল আইডি আবশ্যক।' }, { status: 400 });
    }

    const docId = Number(id);
    const docList = await db.select().from(manualDocuments).where(eq(manualDocuments.id, docId));
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json({ error: 'not_found', message: 'ফাইলটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Check permissions: Admin can delete any file. User can only delete their own.
    if (user.role !== 'ADMIN' && doc.uploadedBy !== user.username) {
      return NextResponse.json({ error: 'forbidden', message: 'এই ফাইলটি ডিলিট করার অনুমতি আপনার নেই।' }, { status: 403 });
    }

    // Save metadata to Trash (keeping physical file intact for 30 days retention / restore support)
    const deletedBy = user.username;

    await db.insert(trash).values({
      entityType: 'MANUAL_DOCUMENT',
      entityId: doc.id,
      name: `ম্যানুয়াল ফাইল: ${doc.name}.${doc.fileType}`,
      data: JSON.stringify(doc),
      deletedBy
    });

    // Delete database entry
    await db.delete(manualDocuments).where(eq(manualDocuments.id, docId));

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: user.username,
      action: 'DELETE',
      entityType: 'MANUAL_DOCUMENT',
      entityId: String(id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) ম্যানুয়াল ফাইল ডিলিট করেছেন (রিসাইকেল বিনে স্থানান্তরিত): "${doc.name}"।`
    });

    return NextResponse.json({ success: true, message: 'Document moved to Recycle Bin' });
  } catch (error) {
    logger.error('Error deleting manual document:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
