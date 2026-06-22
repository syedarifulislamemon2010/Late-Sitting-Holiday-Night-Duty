import { db } from './db';
import { users, cells, userCells } from '../db/schema';
import { eq } from 'drizzle-orm';
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

          const hasR09 = assignedCells.some(c => c.id === 7 || c.name === 'R09 Development & Customization Cell');
          const hasCBS = assignedCells.some(c => c.id === 9 || c.name === 'CBS Integrated Development Cell');

          if (hasR09 && !hasCBS) {
            assignedCells.push({
              id: 9,
              name: 'CBS Integrated Development Cell'
            });
          } else if (hasCBS && !hasR09) {
            assignedCells.push({
              id: 7,
              name: 'R09 Development & Customization Cell'
            });
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
    console.error('getCurrentUser Error:', error);
    return null;
  }
}
