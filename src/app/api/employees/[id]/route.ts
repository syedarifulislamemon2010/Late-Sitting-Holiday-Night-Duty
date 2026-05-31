import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id, 10);
    
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, designation, bankId, fileNo, mobile, cellId } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }
    if (!designation || designation.trim() === '') {
      return NextResponse.json({ error: 'designation_required' }, { status: 400 });
    }
    if (!cellId) {
      return NextResponse.json({ error: 'cell_required' }, { status: 400 });
    }
    
    const parsedCellId = parseInt(cellId, 10);
    if (isNaN(parsedCellId)) {
      return NextResponse.json({ error: 'invalid_cell_id' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let currentUser: any = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'employee_not_found', message: 'কর্মকর্তা পাওয়া যায়নি।' }, { status: 404 });
    }

    // 1. Enforce Cell verification for USER role
    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: any) => c.id);

      // Verify user has access to existing employee's cell
      if (!userCellIds.includes(existingEmployee.cellId)) {
        return NextResponse.json({
          error: 'forbidden',
          message: 'এই কর্মকর্তার তথ্য সংশোধন করার অনুমতি আপনার নেই।'
        }, { status: 403 });
      }

      // Verify user has access to target cell
      if (!userCellIds.includes(parsedCellId)) {
        return NextResponse.json({
          error: 'forbidden',
          message: 'এই সেলে কর্মকর্তা স্থানান্তর করার অনুমতি আপনার নেই।'
        }, { status: 403 });
      }

      // Verify duplicate bankId restriction for officers already in another cell
      if (bankId && bankId.trim() !== '') {
        const existingConflict = await prisma.employee.findFirst({
          where: {
            bankId: bankId.trim(),
            id: { not: employeeId }
          }
        });
        if (existingConflict && existingConflict.cellId !== parsedCellId) {
          return NextResponse.json({
            error: 'forbidden',
            message: 'এই কর্মকর্তা অন্য সেলে কর্মরত আছেন। শুধুমাত্র সিস্টেম এডমিন এটি পরিবর্তন করতে পারবেন।'
          }, { status: 403 });
        }
      }
    }
    
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        name: name.trim(),
        designation: designation.trim(),
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null,
        mobile: mobile?.trim() || null,
        cellId: parsedCellId
      },
      include: {
        cell: true
      }
    });

    if (currentUser) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      await logActivity({
        username: currentUser.username,
        action: 'UPDATE',
        entityType: 'EMPLOYEE',
        entityId: String(employee.id),
        ipAddress,
        userAgent,
        details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${employee.name}" এর তথ্য সংশোধন করেছেন (সেল: ${employee.cell.name})।`
      });
    }
    
    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'failed_to_update_employee' }, { status: 500 });
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
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { duties: true }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'employee_not_found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let currentUser: any = null;
    let deletedBy: string | null = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    // Enforce Cell verification for USER role on delete
    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: any) => c.id);
      if (!userCellIds.includes(employee.cellId)) {
        return NextResponse.json({
          error: 'forbidden',
          message: 'এই কর্মকর্তা মুছে ফেলার অনুমতি আপনার নেই।'
        }, { status: 403 });
      }
    }

    deletedBy = currentUser.username;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'EMPLOYEE',
      entityId: String(employeeId),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${employee.name}" (${employee.designation}) কে সিস্টেম থেকে সরিয়ে দিয়েছেন।`
    });

    await prisma.trash.create({
      data: {
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        name: `${employee.name} (${employee.designation})`,
        data: JSON.stringify(employee),
        deletedBy
      }
    });
    
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'failed_to_delete_employee' }, { status: 500 });
  }
}
