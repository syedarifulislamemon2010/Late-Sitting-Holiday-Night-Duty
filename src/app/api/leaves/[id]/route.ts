import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id, 10);
    if (isNaN(leaveId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

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

    const existingLeave = await prisma.leaveApplication.findUnique({
      where: { id: leaveId }
    });

    if (!existingLeave) {
      return NextResponse.json({ error: 'leave_not_found' }, { status: 404 });
    }

    // Role check: Only admin or the owner can update
    if (currentUser.role !== 'ADMIN' && existingLeave.userId !== currentUser.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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

    const updatedLeave = await prisma.leaveApplication.update({
      where: { id: leaveId },
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
        specialUsed: parseInt(specialUsed, 10) || 0
      }
    });

    // Log Activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: String(updatedLeave.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) আইডি ${updatedLeave.id} এর ছুটির আবেদন আপডেট করেছেন।`
    });

    return NextResponse.json(updatedLeave);
  } catch (error: any) {
    console.error('Error updating leave application:', error);
    return NextResponse.json({ error: 'failed_to_update_leave' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id, 10);
    if (isNaN(leaveId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

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

    const existingLeave = await prisma.leaveApplication.findUnique({
      where: { id: leaveId }
    });

    if (!existingLeave) {
      return NextResponse.json({ error: 'leave_not_found' }, { status: 404 });
    }

    // Role check: Only admin or the owner can delete
    if (currentUser.role !== 'ADMIN' && existingLeave.userId !== currentUser.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await prisma.leaveApplication.delete({
      where: { id: leaveId }
    });

    // Log Activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'USER',
      entityId: String(leaveId),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) আইডি ${leaveId} এর ছুটির আবেদন ডিলিট করেছেন।`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting leave application:', error);
    return NextResponse.json({ error: 'failed_to_delete_leave' }, { status: 500 });
  }
}
