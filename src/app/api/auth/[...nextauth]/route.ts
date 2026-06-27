import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, employees, userCells } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { logActivity } from '@/lib/audit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username.trim();
        const password = credentials.password;

        // Query user using Drizzle
        const userList = await db.select().from(users).where(eq(users.username, username));
        let user = userList[0];

        // Case-insensitive fallback if exact match fails
        if (!user) {
          const allUsers = await db.select().from(users);
          user = allUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())!;
        }

        // Auto-provision user if missing, but employee with this bankId exists
        if (!user) {
          const empList = await db.select().from(employees).where(eq(employees.bankId, username));
          let employee = empList[0];

          if (!employee) {
            const allEmps = await db.select().from(employees);
            employee = allEmps.find((e) => e.bankId?.toLowerCase() === username.toLowerCase())!;
          }

          if (employee && employee.bankId) {
            // Create user in the database
            const newUsers = await db.insert(users).values({
              username: employee.bankId.trim(),
              password: '123456', // default password
              name: employee.name.trim(),
              role: 'USER',
            }).returning();
            
            user = newUsers[0];

            // Connect user to the employee's cell (A = cellId, B = userId)
            await db.insert(userCells).values({
              A: employee.cellId,
              B: user.id,
            });

            console.log(`Auto-provisioned User record for Employee: ${employee.name} (${employee.bankId})`);
          }
        }

        if (user && user.password === password) {
          try {
            let ipAddress = '127.0.0.1';
            let userAgent = 'Unknown';

            if (req && req.headers) {
              ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || ipAddress;
              userAgent = req.headers['user-agent'] || userAgent;
            } else {
              try {
                const reqHeaders = await headers();
                ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || ipAddress;
                userAgent = reqHeaders.get('user-agent') || userAgent;
              } catch {}
            }

            await logActivity({
              username: user.username,
              action: 'LOGIN',
              entityType: 'USER',
              entityId: String(user.id),
              ipAddress,
              userAgent,
              details: `${user.name} (@${user.username}) সিস্টেমে সফলভাবে লগইন করেছেন (NextAuth)।`
            });
          } catch (e) {
            console.error('Failed to log login activity in authorize callback:', e);
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.username, // using email slot for username
            role: user.role,
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const sessionUser = session.user as {
          id?: number;
          role?: string;
          username?: string | null;
          email?: string | null;
        };
        if (token.id) {
          sessionUser.id = parseInt(token.id as string, 10);
        }
        if (token.role) {
          sessionUser.role = token.role as string;
        }
        sessionUser.username = sessionUser.email;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'NextAuthSecretSecretKey2026',
  logger: {
    error(code, ...metadata) {
      if (code === 'JWT_SESSION_ERROR' && metadata.some(m => String(m).includes('decryption operation failed'))) {
        console.warn('NextAuth: Session decryption failed (likely due to expired or mismatched browser cookies). Redirecting to login.');
        return;
      }
      console.error(code, ...metadata);
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
