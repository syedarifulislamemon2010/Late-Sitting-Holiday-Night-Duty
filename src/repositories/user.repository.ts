import { db } from '@/lib/db';
import { users, cells, userCells } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  static async findById(id: number) {
    const list = await db.select().from(users).where(eq(users.id, id));
    return list[0] || null;
  }

  static async findByUsername(username: string) {
    const list = await db.select().from(users).where(eq(users.username, username));
    return list[0] || null;
  }

  static async listAll() {
    return db.select().from(users);
  }

  static async getUserAssignedCells(userId: number) {
    return db
      .select({
        id: cells.id,
        name: cells.name,
        description: cells.description,
        createdAt: cells.createdAt
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id))
      .where(eq(userCells.B, userId));
  }
}
