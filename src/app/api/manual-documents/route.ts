import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { manualDocuments, trash } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

// GET: Fetch all manual documents
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল দেখতে পারবেন।' }, { status: 403 });
    }

    const docs = await db.select().from(manualDocuments).orderBy(desc(manualDocuments.uploadedAt));
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Error fetching manual documents:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// POST: Upload a manual document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল আপলোড করতে পারবেন।' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ফাইল নির্বাচন করুন।' }, { status: 400 });
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
    console.error('Manual File Upload Error:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// PUT: Rename manual document name
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইলের নাম পরিবর্তন করতে পারবেন।' }, { status: 403 });
    }

    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'missing_parameters', message: 'আইডি এবং নতুন নাম আবশ্যক।' }, { status: 400 });
    }

    const docId = Number(id);
    const docList = await db.select().from(manualDocuments).where(eq(manualDocuments.id, docId));
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json({ error: 'not_found', message: 'ফাইলটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const oldName = doc.name;

    // Update name
    await db.update(manualDocuments)
      .set({ name })
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
      details: `${user.name} (@${user.username}) ম্যানুয়াল ফাইলের নাম পরিবর্তন করেছেন: "${oldName}" থেকে "${name}"।`
    });

    return NextResponse.json({ success: true, message: 'Document renamed successfully' });
  } catch (error) {
    console.error('Error renaming manual document:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// DELETE: Soft delete manual document to Recycle Bin
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল মুছে ফেলতে পারবেন।' }, { status: 403 });
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
    console.error('Error deleting manual document:', error);
    return NextResponse.json({ error: 'internal_error', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
