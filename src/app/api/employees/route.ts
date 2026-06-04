import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { employees, cells, users, userCells } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { sortEmployeesBySeniority } from '@/lib/seniority';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (user && user.role === 'USER') {
      isUserRestricted = true;
      // Find corresponding employee record by bankId to get their primary cell
      const empList = await db.select().from(employees).where(eq(sql`LOWER(${employees.bankId})`, user.username.toLowerCase()));
      const emp = empList[0];
      if (emp) {
        cellIds = [emp.cellId];
      } else if (user.cells && user.cells.length > 0) {
        cellIds = [user.cells[0].id];
      } else {
        cellIds = [];
      }
    }

    const { searchParams } = new URL(request.url);
    const isDirectory = searchParams.get('directory') === 'true';

    const conditions = [];
    if (isUserRestricted && !isDirectory) {
      if (cellIds.length > 0) {
        conditions.push(inArray(employees.cellId, cellIds));
      } else {
        return NextResponse.json([]);
      }
    }

    const empList = await db
      .select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
        fileNo: employees.fileNo,
        mobile: employees.mobile,
        cellId: employees.cellId,
        createdAt: employees.createdAt,
        cell: {
          id: cells.id,
          name: cells.name,
          description: cells.description,
          createdAt: cells.createdAt
        }
      })
      .from(employees)
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    let finalEmployees = empList;
    if (isDirectory) {
      const allUsers = await db.select().from(users);
      const allUserCells = await db
        .select({
          userId: userCells.B,
          cellId: cells.id,
          cellName: cells.name,
          cellDescription: cells.description,
          cellCreatedAt: cells.createdAt
        })
        .from(userCells)
        .innerJoin(cells, eq(userCells.A, cells.id));

      const userCellsMap = new Map<string, any[]>();
      allUsers.forEach(u => {
        if (u.username) {
          const uCells = allUserCells
            .filter((uc: any) => uc.userId === u.id)
            .map((uc: any) => ({
              id: uc.cellId,
              name: uc.cellName,
              description: uc.cellDescription,
              createdAt: uc.cellCreatedAt
            }));
          userCellsMap.set(u.username.trim().toLowerCase(), uCells);
        }
      });

      const expandedEmployees: any[] = [];
      for (const emp of empList) {
        expandedEmployees.push(emp);
        
        if (emp.bankId) {
          const assignedCells = userCellsMap.get(emp.bankId.trim().toLowerCase());
          if (assignedCells) {
            for (const cell of assignedCells) {
              if (cell.id !== emp.cellId) {
                expandedEmployees.push({
                  ...emp,
                  cellId: cell.id,
                  cell: cell
                });
              }
            }
          }
        }
      }
      finalEmployees = expandedEmployees;

      if (isUserRestricted) {
        finalEmployees = finalEmployees.filter(emp => cellIds.includes(emp.cellId));
      }
    }

    const sortedEmployees = sortEmployeesBySeniority(finalEmployees);

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
    
    const currentUser = await getCurrentUser();

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

    const newEmpList = await db.insert(employees).values({
      name: name.trim(),
      designation: designation.trim(),
      bankId: bankId?.trim() || null,
      fileNo: fileNo?.trim() || null,
      mobile: mobile?.trim() || null,
      cellId: parsedCellId
    }).returning();
    const newEmp = newEmpList[0];

    const cellList = await db.select().from(cells).where(eq(cells.id, parsedCellId));
    const cell = cellList[0];

    const employee = {
      ...newEmp,
      cell
    };

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
        details: `${currentUser.name} (@${currentUser.username}) নতুন কর্মকর্তা "${employee.name}" (${employee.designation}) কে ${cell.name} সেলে যোগ করেছেন।`
      });

    }
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'failed_to_create_employee' }, { status: 500 });
  }
}
