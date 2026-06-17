import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees, duties, leaveApplications, officeOrders, cells } from '@/db/schema';
import { eq, inArray, or, ilike, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { handleApiError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Resolve user cell IDs
    const cellIds: number[] = user.cells.map(c => c.id);
    const cellNames: string[] = user.cells.map(c => c.name);

    if (user.role === 'USER' && cellIds.length === 0) {
      const emp = await db.select().from(employees).where(eq(employees.bankId, user.username));
      if (emp[0]) {
        cellIds.push(emp[0].cellId);
        const cellRecord = await db.select().from(cells).where(eq(cells.id, emp[0].cellId));
        if (cellRecord[0]) {
          cellNames.push(cellRecord[0].name);
        }
      }
    }

    const searchQuery = `%${query}%`;
    const results: Array<{
      type: 'employee' | 'duty' | 'leave' | 'order';
      id: number;
      title: string;
      subtitle: string;
      url: string;
    }> = [];

    // 1. Search Employees
    const empConditions = [
      or(
        ilike(employees.name, searchQuery),
        ilike(employees.bankId, searchQuery),
        ilike(employees.designation, searchQuery)
      )
    ];
    if (user.role === 'USER' && cellIds.length > 0) {
      empConditions.push(inArray(employees.cellId, cellIds));
    } else if (user.role === 'USER') {
      empConditions.push(eq(employees.cellId, -1)); // block if no cell
    }

    const empList = await db
      .select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
      })
      .from(employees)
      .where(and(...empConditions))
      .limit(6);

    empList.forEach(e => {
      results.push({
        type: 'employee',
        id: e.id,
        title: e.name,
        subtitle: `${e.designation} (${e.bankId || 'N/A'})`,
        url: `/employees?search=${encodeURIComponent(e.bankId || e.name)}`
      });
    });

    // 2. Search Leave Applications
    const leaveConditions = [
      or(
        ilike(leaveApplications.applicantName, searchQuery),
        ilike(leaveApplications.bankId, searchQuery),
        ilike(leaveApplications.leaveLocation, searchQuery)
      )
    ];
    if (user.role === 'USER') {
      leaveConditions.push(eq(leaveApplications.userId, user.id));
    }

    const leaveList = await db
      .select({
        id: leaveApplications.id,
        applicantName: leaveApplications.applicantName,
        leaveType: leaveApplications.leaveType,
        startDate: leaveApplications.startDate,
        endDate: leaveApplications.endDate,
      })
      .from(leaveApplications)
      .where(and(...leaveConditions))
      .limit(6);

    leaveList.forEach(l => {
      const displayType = l.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : l.leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ' : 'নৈমিত্তিক';
      results.push({
        type: 'leave',
        id: l.id,
        title: `${l.applicantName} - ছুটির আবেদন`,
        subtitle: `${displayType} (${l.startDate} থেকে ${l.endDate})`,
        url: `/leave`
      });
    });

    // 3. Search Office Orders
    const orderConditions = [
      or(
        ilike(officeOrders.orderRef, searchQuery),
        ilike(officeOrders.employeeName, searchQuery),
        ilike(officeOrders.category, searchQuery)
      )
    ];
    if (user.role === 'USER' && cellNames.length > 0) {
      orderConditions.push(inArray(officeOrders.cellName, cellNames));
    } else if (user.role === 'USER') {
      orderConditions.push(eq(officeOrders.id, -1)); // block
    }

    const orderList = await db
      .select({
        id: officeOrders.id,
        orderRef: officeOrders.orderRef,
        category: officeOrders.category,
        employeeName: officeOrders.employeeName,
      })
      .from(officeOrders)
      .where(and(...orderConditions))
      .limit(6);

    orderList.forEach(o => {
      results.push({
        type: 'order',
        id: o.id,
        title: `স্মারক/অর্ডার: ${o.orderRef}`,
        subtitle: `শ্রেণী: ${o.category} | কর্মকর্তা: ${o.employeeName}`,
        url: `/billing?tab=orders&search=${encodeURIComponent(o.orderRef)}`
      });
    });

    // 4. Search Duties (Join on employee for cell safety)
    const dutyConditions = [
      or(
        ilike(duties.orderRef, searchQuery),
        ilike(duties.type, searchQuery)
      )
    ];
    if (user.role === 'USER' && cellIds.length > 0) {
      dutyConditions.push(inArray(employees.cellId, cellIds));
    } else if (user.role === 'USER') {
      dutyConditions.push(eq(employees.cellId, -1)); // block
    }

    const dutyList = await db
      .select({
        id: duties.id,
        type: duties.type,
        date: duties.date,
        orderRef: duties.orderRef,
        employeeName: employees.name,
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .where(and(...dutyConditions))
      .limit(6);

    dutyList.forEach(d => {
      const displayType = d.type === 'LATE_SITTING' ? 'লেট সিটিং' : d.type === 'HOLIDAY' ? 'ছুটির দিন' : 'রাত্রীকালীন ডিউটি';
      results.push({
        type: 'duty',
        id: d.id,
        title: `${d.employeeName} - ${displayType}`,
        subtitle: `তারিখ: ${d.date} | স্মারক: ${d.orderRef || 'N/A'}`,
        url: `/roster`
      });
    });

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
