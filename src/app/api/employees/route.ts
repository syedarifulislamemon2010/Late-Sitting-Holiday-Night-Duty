import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
        if (user && user.role === 'USER') {
          isUserRestricted = true;
          cellIds = user.cells.map((c: any) => c.id);
        }
      }
    }

    const whereClause = isUserRestricted ? { cellId: { in: cellIds } } : {};

    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        cell: true
      }
    });
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'failed_to_fetch_employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
    
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let currentUser: any = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({ where: { id: userId } });
      }
    }

    const employee = await prisma.employee.create({
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

    if (currentUser) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      await logActivity({
        username: currentUser.username,
        action: 'CREATE',
        entityType: 'EMPLOYEE',
        entityId: String(employee.id),
        ipAddress,
        userAgent,
        details: `${currentUser.name} (@${currentUser.username}) নতুন কর্মকর্তা "${employee.name}" (${employee.designation}) কে ${employee.cell.name} সেলে যোগ করেছেন।`
      });
    }
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'failed_to_create_employee' }, { status: 500 });
  }
}
