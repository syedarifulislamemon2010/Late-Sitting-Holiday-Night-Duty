import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LeaveService } from '@/services/leave.service';
import { handleApiError, AppError, ConflictError } from '@/lib/errors';
import { explainConflictInBengali } from '@/lib/ai-explainer';
import { db } from '@/lib/db';
import { employees, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { leaveUpdateSchema } from '@/validations/leave.schema';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id, 10);
    
    if (isNaN(leaveId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const body = await request.json();

    const validation = leaveUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ ছুটির আবেদন ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Dynamically save or update the applicant's mobile number in the database if inputted
    if (validatedData.bankId && validatedData.mobileNo) {
      const trimmedBankId = validatedData.bankId.trim().toLowerCase();
      const trimmedMobile = validatedData.mobileNo.trim();
      if (trimmedBankId && trimmedMobile) {
        const empList = await db.select().from(employees).where(eq(sql`LOWER(TRIM(${employees.bankId}))`, trimmedBankId));
        const emp = empList[0];
        if (emp && (!emp.mobile || emp.mobile.trim() !== trimmedMobile)) {
          // Update employee mobile
          await db.update(employees)
            .set({ mobile: trimmedMobile })
            .where(eq(employees.id, emp.id));

          // Update user mobile if applicable
          await db.update(users)
            .set({ mobile: trimmedMobile })
            .where(eq(sql`LOWER(TRIM(${users.username}))`, trimmedBankId));
        }
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await LeaveService.updateLeave(user, leaveId, validatedData as import('@/validations/leave.schema').LeaveCreateInput, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConflictError) {
      const conflictType = error.details?.conflictType || 'LEAVE_OVERLAP';
      const formattedDates = error.details?.dates?.map((d: string) => d.split('-').reverse().join('-'));

      const bengaliExplanation = await explainConflictInBengali({
        type: conflictType as import('@/lib/ai-explainer').ConflictType,
        employeeName: error.details?.employeeName,
        dates: formattedDates,
        existingLeaveStart: error.details?.existingLeaveStart ? new Date(error.details.existingLeaveStart).toLocaleDateString("bn-BD") : undefined,
        existingLeaveEnd: error.details?.existingLeaveEnd ? new Date(error.details.existingLeaveEnd).toLocaleDateString("bn-BD") : undefined,
        cellName: error.details?.cellName
      });

      return NextResponse.json(
        {
          error: "leave_collision",
          message: bengaliExplanation,
          conflictType
        },
        { status: 409 }
      );
    }
    return handleApiError(error);
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
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await LeaveService.deleteLeave(user, leaveId, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
