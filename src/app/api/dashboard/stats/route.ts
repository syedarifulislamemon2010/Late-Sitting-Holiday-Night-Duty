import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-wrapper";
import { db } from "@/lib/db";
import { duties, employees, leaveApplications, officeOrders } from "@/db/schema";
import { eq, gte, count, inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const userCellIds: number[] = user.cells?.map((c: { id: number }) => c.id) ?? [];
    const isAdmin = user.role === "ADMIN";

    // Cell sharing for CBS (9) and R09 (7)
    if (!isAdmin) {
      if (userCellIds.includes(7) && !userCellIds.includes(9)) {
        userCellIds.push(9);
      } else if (userCellIds.includes(9) && !userCellIds.includes(7)) {
        userCellIds.push(7);
      }
    }

    const employeeConditions = isAdmin
      ? undefined
      : (userCellIds.length > 0 ? inArray(employees.cellId, userCellIds) : undefined);

    const [totalEmployees, dutiesThisMonth, pendingOrders, leavesThisMonth] =
      await Promise.all([
        db.select({ count: count() })
          .from(employees)
          .where(employeeConditions),

        db.select({ count: count() })
          .from(duties)
          .where(gte(duties.createdAt, firstOfMonth)),

        db.select({ count: count() })
          .from(officeOrders)
          .where(eq(officeOrders.status, "Generated")),

        db.select({ count: count() })
          .from(leaveApplications)
          .where(gte(leaveApplications.createdAt, firstOfMonth)),
      ]);

    return NextResponse.json({
      totalEmployees: totalEmployees[0]?.count ?? 0,
      dutiesThisMonth: dutiesThisMonth[0]?.count ?? 0,
      pendingOrders: pendingOrders[0]?.count ?? 0,
      leavesThisMonth: leavesThisMonth[0]?.count ?? 0,
      month: now.toLocaleString("bn-BD", { month: "long", year: "numeric" }),
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "failed_to_fetch_stats" }, { status: 500 });
  }
}
