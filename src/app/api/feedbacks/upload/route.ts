import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'user_not_found', message: 'ইউজার পাওয়া যায়নি।' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ফাইল সিলেক্ট করুন।' }, { status: 400 });
    }

    // Validate MIME type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const fileExt = path.extname(file.name).toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      return NextResponse.json({ 
        error: 'invalid_type', 
        message: 'শুধুমাত্র ইমেজ (.png, .jpg, .jpeg, .webp, .gif) ফাইল স্ক্রিনশট হিসেবে আপলোড করা যাবে।' 
      }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure feedback upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'feedback');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique name
    const sanitizedName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const uniqueFilename = `${Date.now()}_${sanitizedName || 'screenshot.png'}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save to disk
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/feedback/${uniqueFilename}`;

    return NextResponse.json({ 
      success: true, 
      filePath: relativePath 
    });
  } catch (error: any) {
    console.error('Feedback Upload Error:', error);
    return NextResponse.json({ 
      error: 'internal_error', 
      message: 'ফাইল আপলোড করতে সমস্যা হয়েছে।' 
    }, { status: 500 });
  }
}
