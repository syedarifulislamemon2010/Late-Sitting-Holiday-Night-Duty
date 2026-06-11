import { cookies } from 'next/headers';
import { db } from './db';
import { users, cells, userCells } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

const COOKIE_SECRET = process.env.NEXTAUTH_SECRET || 'NextAuthSecretSecretKey2026';

export function signSession(userId: string): string {
  const hmac = crypto.createHmac('sha256', COOKIE_SECRET);
  hmac.update(userId);
  const signature = hmac.digest('base64url');
  return `${userId}.${signature}`;
}

export function verifySession(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [value, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', COOKIE_SECRET).update(value).digest('base64url');
  if (signature === expectedSignature) {
    return value;
  }
  return null;
}

export async function getCurrentUser() {
  try {
    // 1. Try NextAuth session
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

          return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN',
            mobile: user.mobile,
            cells: assignedCells,
          };
        }
      }
    }

    // 2. Fallback to secure custom cookie 'session'
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (sessionCookie) {
      const verifiedUserId = verifySession(sessionCookie);
      if (verifiedUserId) {
        const userId = parseInt(verifiedUserId, 10);
        if (!isNaN(userId)) {
          const userList = await db.select().from(users).where(eq(users.id, userId));
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

            return {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role as 'USER' | 'ADMIN',
              mobile: user.mobile,
              cells: assignedCells,
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
}
