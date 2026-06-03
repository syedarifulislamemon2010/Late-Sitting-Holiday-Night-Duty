import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { sortEmployeesBySeniority } from '@/lib/seniority';

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
          // Find corresponding employee record by bankId to get their primary cell
          const emp = await prisma.employee.findFirst({
            where: {
              bankId: {
                equals: user.username,
                mode: 'insensitive'
              }
            }
          });
          if (emp) {
            cellIds = [emp.cellId];
          } else if (user.cells && user.cells.length > 0) {
            cellIds = [user.cells[0].id];
          } else {
            cellIds = [];
          }
        }
      }
    }

    const whereClause = isUserRestricted ? { cellId: { in: cellIds } } : {};

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        cell: true
      }
    });

    const sortedEmployees = sortEmployeesBySeniority(employees);

    return NextResponse.json(sortedEmployees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'failed_to_fetch_employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    // Enforce ADMIN role for creating new employee records
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'forbidden',
        message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা যোগ করতে পারবেন।'
      }, { status: 403 });
    }

    const employee = await prisma.employee.create({
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
        action: 'CREATE',
        entityType: 'EMPLOYEE',
        entityId: String(employee.id),
        ipAddress,
        userAgent,
        details: `${currentUser.name} (@${currentUser.username}) নতুন কর্মকর্তা "${employee.name}" (${employee.designation}) কে ${employee.cell.name} সেলে যোগ করেছেন।`
      });

      // Notify all other users about this admin update
      try {
        const allUsers = await prisma.user.findMany();
        const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
        await prisma.notification.createMany({
          data: otherUsers.map(u => ({
            userId: u.id,
            title: 'নতুন কর্মকর্তা নোটিশ',
            message: `প্রশাসন সেল কর্তৃক নতুন কর্মকর্তা জনাব ${employee.name} (${employee.designation}) কে ${employee.cell.name} সেলে যোগ করা হয়েছে।`,
            link: '/employees',
            isRead: false
          }))
        });
      } catch (notifErr) {
        console.error('Error generating employee add notification:', notifErr);
      }
    }
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'failed_to_create_employee' }, { status: 500 });
  }
}
