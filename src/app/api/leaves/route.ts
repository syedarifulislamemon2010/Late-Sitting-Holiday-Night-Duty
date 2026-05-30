import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';
    const filterBankId = searchParams.get('bankId');

    let whereClause: any = {};
    if (currentUser.role === 'ADMIN') {
      if (filterBankId) {
        whereClause = { bankId: filterBankId };
      }
    } else {
      whereClause = { userId: currentUser.id };
    }

    if (latest) {
      const latestLeave = await prisma.leaveApplication.findFirst({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        }
      });
      return NextResponse.json(latestLeave);
    }

    const leaves = await prisma.leaveApplication.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(leaves);
  } catch (error: any) {
    console.error('Error fetching leave applications:', error);
    return NextResponse.json({ error: 'failed_to_fetch_leaves' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
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

    const newLeave = await prisma.leaveApplication.create({
      data: {
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
      }
    });

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
