import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { officeOrders } from '@/db/schema';
import { and, eq, like, desc, notLike } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const orders = await db.select()
      .from(officeOrders)
      .where(
        and(
          eq(officeOrders.category, category),
          like(officeOrders.orderRef, `%${year}%`),
          notLike(officeOrders.orderRef, `%/বিল`)
        )
      )
      .orderBy(desc(officeOrders.createdAt))
      .limit(50);

    let lastRef = null;
    let suggestedNumber = 1;

    if (orders.length > 0) {
      let maxNum = 0;
      for (const order of orders) {
        const match = order.orderRef.match(/\/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
            lastRef = order.orderRef;
          }
        }
      }
      suggestedNumber = maxNum + 1;
    }

    let suggestedRef = '';
    if (lastRef) {
      suggestedRef = lastRef.replace(/\/\d+$/, `/${suggestedNumber}`);
    }

    let isDuplicate = false;
    if (suggestedRef) {
      const existing = await db.select().from(officeOrders).where(eq(officeOrders.orderRef, suggestedRef));
      isDuplicate = existing.length > 0;
    }

    return NextResponse.json({
      suggestedRef,
      lastRef,
      suggestedNumber,
      isDuplicate
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
