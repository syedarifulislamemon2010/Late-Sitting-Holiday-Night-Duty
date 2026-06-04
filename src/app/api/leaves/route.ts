import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { leaveApplications } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';
    const filterBankId = searchParams.get('bankId');

    const conditions = [];
    if (currentUser.role === 'ADMIN') {
      if (filterBankId) {
        conditions.push(eq(leaveApplications.bankId, filterBankId));
      }
    } else {
      conditions.push(eq(leaveApplications.userId, currentUser.id));
    }

    if (latest) {
      const latestLeaveList = await db.select().from(leaveApplications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(leaveApplications.createdAt))
        .limit(1);
      return NextResponse.json(latestLeaveList[0] || null);
    }

    const leaves = await db.select().from(leaveApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leaveApplications.createdAt));

    return NextResponse.json(leaves);
  } catch (error: any) {
    console.error('Error fetching leave applications:', error);
    return NextResponse.json({ error: 'failed_to_fetch_leaves' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      leaveType,
      startDate,
      endDate,
      applicationDate,
      applicantName,
      designation,
      bankId,
      fileNo,
      cellName,
      leaveLocation,
      mobileNo,
      selectedDistrict,
      delegateId,
      casualTotal,
      casualUsed,
      ordinaryTotal,
      ordinaryUsed,
      specialTotal,
      specialUsed
    } = body;

    // Validation
    if (!leaveType || !startDate || !endDate || !applicationDate || !applicantName || !designation || !bankId || !cellName || !leaveLocation || !mobileNo) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    const newLeaveList = await db.insert(leaveApplications).values({
      leaveType,
      startDate,
      endDate,
      applicationDate,
      applicantName,
      designation,
      bankId,
      fileNo: fileNo || null,
      cellName,
      leaveLocation,
      mobileNo,
      selectedDistrict: selectedDistrict || null,
      delegateId: delegateId || null,
      casualTotal: parseInt(casualTotal, 10) || 0,
      casualUsed: parseInt(casualUsed, 10) || 0,
      ordinaryTotal: parseInt(ordinaryTotal, 10) || 0,
      ordinaryUsed: parseInt(ordinaryUsed, 10) || 0,
      specialTotal: parseInt(specialTotal, 10) || 0,
      specialUsed: parseInt(specialUsed, 10) || 0,
      userId: currentUser.id
    }).returning();
    const newLeave = newLeaveList[0];

    // Log Activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'USER',
      entityId: String(newLeave.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন ছুটির আবেদন (${leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'}) তৈরি ও সংরক্ষণ করেছেন।`
    });

    return NextResponse.json(newLeave, { status: 201 });
  } catch (error: any) {
    console.error('Error creating leave application:', error);
    return NextResponse.json({ error: 'failed_to_create_leave' }, { status: 500 });
  }
}
