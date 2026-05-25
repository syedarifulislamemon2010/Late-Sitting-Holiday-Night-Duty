import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

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
    const { name, designation, bankId, fileNo, cellId } = body;
    
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
    
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        name: name.trim(),
        designation: designation.trim(),
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null,
        cellId: parsedCellId
      },
      include: {
        cell: true
      }
    });
    
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
    
    // Create soft-delete Trash entry
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let deletedBy: string | null = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          deletedBy = user.username;
        }
      }
    }

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
