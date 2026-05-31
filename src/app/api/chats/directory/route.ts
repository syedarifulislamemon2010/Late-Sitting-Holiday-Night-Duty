import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Retrieve all users in the system sorted by name, excluding current user
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Retrieve employee designations to join with users by bankId (username)
    const employees = await prisma.employee.findMany({
      select: {
        bankId: true,
        designation: true
      }
    });

    const employeeMap = new Map<string, string>();
    employees.forEach(emp => {
      if (emp.bankId) {
        employeeMap.set(emp.bankId, emp.designation);
      }
    });

    const usersWithDesignation = users.map(user => ({
      ...user,
      designation: employeeMap.get(user.username) || null
    }));

    return NextResponse.json(usersWithDesignation);
  } catch (error: any) {
    console.error('Error fetching chat directory:', error);
    return NextResponse.json({ error: 'failed_to_fetch_directory' }, { status: 500 });
  }
}
