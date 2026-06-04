import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { executives } from '@/db/schema';

export async function GET() {
  try {
    const execs = await db.select().from(executives).orderBy(executives.createdAt);
    return NextResponse.json(execs);
  } catch (error: any) {
    console.error('Error fetching executives:', error);
    return NextResponse.json({ error: 'failed_to_fetch_executives' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const body = await request.json();
    const { name, designation, phone, email, bankId, fileNo } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'name_and_designation_required' }, { status: 400 });
    }

    const createdList = await db.insert(executives).values({
      name: name.trim(),
      designation: designation.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      bankId: bankId?.trim() || null,
      fileNo: fileNo?.trim() || null
    }).returning();
    const created = createdList[0];

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating executive:', error);
    return NextResponse.json({ error: 'failed_to_create_executive' }, { status: 500 });
  }
}
