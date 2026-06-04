import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { employees, cells, duties, trash } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const existingEmployeeList = await db.select().from(employees).where(eq(employees.id, employeeId));
    const existingEmployee = existingEmployeeList[0];

    if (!existingEmployee) {
      return NextResponse.json({ error: 'employee_not_found', message: 'কর্মকর্তা পাওয়া যায়নি।' }, { status: 404 });
    }

    let updatedData: any = {
      name: name.trim(),
      mobile: mobile?.trim() || null,
    };

    if (currentUser.role !== 'ADMIN') {
      const isOwnRecord = existingEmployee.bankId && currentUser.username && existingEmployee.bankId.trim() === currentUser.username.trim();
      if (!isOwnRecord) {
        return NextResponse.json({
          error: 'forbidden',
          message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা সংশোধন করতে পারবেন।'
        }, { status: 403 });
      }

      // Restrict modification of core fields for non-admin self-editing
      updatedData.designation = existingEmployee.designation;
      updatedData.bankId = existingEmployee.bankId;
      updatedData.fileNo = existingEmployee.fileNo;
      updatedData.cellId = existingEmployee.cellId;
    } else {
      updatedData.designation = designation.trim();
      updatedData.bankId = bankId?.trim() || null;
      updatedData.fileNo = fileNo?.trim() || null;
      updatedData.cellId = parsedCellId;
    }
    
    const updatedEmpList = await db.update(employees)
      .set(updatedData)
      .where(eq(employees.id, employeeId))
      .returning();
    const updatedEmp = updatedEmpList[0];

    const cellList = await db.select().from(cells).where(eq(cells.id, updatedEmp.cellId));
    const cell = cellList[0];

    const employee = {
      ...updatedEmp,
      cell
    };

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
        details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${employee.name}" এর তথ্য সংশোধন করেছেন (সেল: ${cell.name})।`
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
    
    const employeeList = await db.select().from(employees).where(eq(employees.id, employeeId));
    const employee = employeeList[0];
    
    if (!employee) {
      return NextResponse.json({ error: 'employee_not_found' }, { status: 404 });
    }

    const employeeDuties = await db.select().from(duties).where(eq(duties.employeeId, employeeId));
    const employeeWithDuties = {
      ...employee,
      duties: employeeDuties
    };

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    // Enforce ADMIN role for deleting employees
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'forbidden',
        message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা মুছে ফেলতে পারবেন।'
      }, { status: 403 });
    }

    const deletedBy = currentUser.username;
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

    await db.insert(trash).values({
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      name: `${employee.name} (${employee.designation})`,
      data: JSON.stringify(employeeWithDuties),
      deletedBy
    });
    
    await db.delete(employees).where(eq(employees.id, employeeId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'failed_to_delete_employee' }, { status: 500 });
  }
}
