import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { EmployeeService } from '@/services/employee.service';
import { handleApiError, AppError } from '@/lib/errors';
import { employeeUpdateSchema } from '@/validations/employee.schema';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id, 10);
    
    if (isNaN(employeeId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }
    
    const user = await getCurrentUser();
    const body = await request.json();

    const validation = employeeUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ ইনপুট ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await EmployeeService.updateEmployee(user, employeeId, validation.data, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id, 10);
    
    if (isNaN(employeeId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await EmployeeService.deleteEmployee(user, employeeId, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
