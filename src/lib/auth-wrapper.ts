import logger from '@/lib/logger';
import { db } from './db';
import { users, cells, userCells } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const nextAuthUserId = (session.user as { id?: number }).id;
      if (nextAuthUserId) {
        // Query user details with cells
        const userList = await db.select().from(users).where(eq(users.id, nextAuthUserId));
        const user = userList[0];
        if (user) {
          // Fetch assigned cells (A = cellId, B = userId)
          const assignedCells = await db
            .select({
              id: cells.id,
              name: cells.name,
            })
            .from(userCells)
            .innerJoin(cells, eq(userCells.A, cells.id))
            .where(eq(userCells.B, user.id));

          const hasR09 = assignedCells.some(c => c.name.includes('R09'));
          const hasCBS = assignedCells.some(c => c.name.includes('CBS Integrated'));

          if (hasR09 && !hasCBS) {
            const cbsCell = await db
              .select({ id: cells.id, name: cells.name })
              .from(cells)
              .where(ilike(cells.name, '%CBS Integrated%'))
              .limit(1);
            if (cbsCell[0]) assignedCells.push(cbsCell[0]);
          } else if (hasCBS && !hasR09) {
            const r09Cell = await db
              .select({ id: cells.id, name: cells.name })
              .from(cells)
              .where(ilike(cells.name, '%R09%'))
              .limit(1);
            if (r09Cell[0]) assignedCells.push(r09Cell[0]);
          }

          return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN' | 'EMPLOYEE',
            mobile: user.mobile,
            cells: assignedCells,
          };
        }
      }
    }
    return null;
  } catch (error) {
    logger.error('getCurrentUser Error:', error);
    return null;
  }
}
