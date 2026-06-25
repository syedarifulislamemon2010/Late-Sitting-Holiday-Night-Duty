import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LeaveService } from '@/services/leave.service';
import { handleApiError, ConflictError } from '@/lib/errors';
import { explainConflictInBengali } from '@/lib/ai-explainer';
import { db } from '@/lib/db';
import { employees, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';
    const filterBankId = searchParams.get('bankId');

    const result = await LeaveService.listLeaves(user, { latest, bankId: filterBankId });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    // Dynamically save or update the applicant's mobile number in the database if inputted
    if (body.bankId && body.mobileNo) {
      const trimmedBankId = body.bankId.trim().toLowerCase();
      const trimmedMobile = body.mobileNo.trim();
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

    const result = await LeaveService.createLeave(user, body, { ipAddress, userAgent });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      const conflictType = error.details?.conflictType || 'LEAVE_OVERLAP';
      const formattedDates = error.details?.dates?.map((d: string) => d.split('-').reverse().join('-'));

      const bengaliExplanation = await explainConflictInBengali({
        type: conflictType,
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
