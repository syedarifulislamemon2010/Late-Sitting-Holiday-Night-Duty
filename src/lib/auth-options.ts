import logger from '@/lib/logger';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, employees, userCells } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { logActivity } from '@/lib/audit';
import { toEnglishDigits } from '@/lib/bengali-converter';
import { verifyPassword, hashPassword } from '@/lib/password';

// Validate NEXTAUTH_SECRET on startup
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || !!process.env.CI || process.env.npm_lifecycle_event === 'build';
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error('🚨 [Critical Security Error]: NEXTAUTH_SECRET is required in production. Please set NEXTAUTH_SECRET in your environment.');
  } else {
    logger.warn('⚠️ [Security Warning]: NEXTAUTH_SECRET is not set in environment variables. Please set NEXTAUTH_SECRET in your .env file.');
  }
}

// Track failed login attempts for brute-force lockout (5 attempts -> 15 min lock)
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

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

        const rawUsername = credentials.username.trim();
        const username = toEnglishDigits(rawUsername).trim();
        const password = credentials.password;

        // Resolve client IP and User Agent
        const trustProxy = process.env.TRUST_PROXY_HEADERS === 'true';
        let ipAddress = '127.0.0.1';
        let userAgent = 'Unknown';
        if (req && req.headers) {
          if (trustProxy) {
            ipAddress = (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ipAddress;
          }
          userAgent = (req.headers['user-agent'] as string) || userAgent;
        } else {
          try {
            const reqHeaders = await headers();
            if (trustProxy) {
              ipAddress = reqHeaders.get('x-real-ip') || reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || ipAddress;
            }
            userAgent = reqHeaders.get('user-agent') || userAgent;
          } catch {}
        }

        // Check for brute-force account/IP lockout
        const rateLimitKey = `${ipAddress}:${username.toLowerCase()}`;
        const now = Date.now();
        const attempt = loginAttempts.get(rateLimitKey);
        if (attempt && attempt.lockedUntil > now) {
          const remainingMin = Math.ceil((attempt.lockedUntil - now) / 60000);
          logger.warn(`[Auth Lockout] Login blocked for ${username} from ${ipAddress}. Locked for ${remainingMin} more minutes.`);
          throw new Error(`অতিরিক্ত ব্যর্থ প্রচেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। ${remainingMin} মিনিট পর পুনরায় চেষ্টা করুন।`);
        }

        // Query user using exact match or exact case-insensitive match (NO wildcard injection)
        const userList = await db.select().from(users).where(eq(users.username, username));
        let user = userList[0];

        // Case-insensitive exact match fallback if exact match fails (avoids % and _ wildcard injection)
        if (!user) {
          const caseInsensitiveUsers = await db
            .select()
            .from(users)
            .where(eq(sql`LOWER(TRIM(${users.username}))`, username.toLowerCase()))
            .limit(1);
          user = caseInsensitiveUsers[0];
        }

        // Auto-provision user if missing, but employee with this bankId exists
        if (!user) {
          const empList = await db.select().from(employees).where(eq(employees.bankId, username));
          let employee = empList[0];

          if (!employee) {
            const caseInsensitiveEmps = await db
              .select()
              .from(employees)
              .where(eq(sql`LOWER(TRIM(${employees.bankId}))`, username.toLowerCase()))
              .limit(1);
            employee = caseInsensitiveEmps[0];
          }

          if (employee && employee.bankId) {
            // Create user in the database with secure hashed default password
            const hashedDefaultPassword = await hashPassword('123456');
            const newUsers = await db.insert(users).values({
              username: employee.bankId.trim(),
              password: hashedDefaultPassword, // default password hashed
              name: employee.name.trim(),
              role: 'USER',
            }).returning();
            
            user = newUsers[0];

            // Connect user to the employee's cell (A = cellId, B = userId)
            if (employee.cellId) {
              await db.insert(userCells).values({
                A: employee.cellId,
                B: user.id,
              }).catch((e) => logger.error('Failed to attach user cell mapping:', e));
            }

            logger.info(`Auto-provisioned User record with hashed password for Employee: ${employee.name} (${employee.bankId})`);
          }
        }

        if (user) {
          // Dual-compatible verification: supports both modern bcrypt hash and legacy plaintext
          const { isValid, needsMigration } = await verifyPassword(password, user.password);

          if (isValid) {
            // Reset failed login count upon successful authentication
            loginAttempts.delete(rateLimitKey);

            // Lazy migration: if password matched as legacy plaintext, upgrade it to bcrypt in DB
            if (needsMigration) {
              try {
                const newHash = await hashPassword(password);
                await db.update(users).set({ password: newHash }).where(eq(users.id, user.id));
                logger.info(`[Auth] Successfully lazy-migrated password to bcrypt for user: ${user.username} (ID: ${user.id})`);
              } catch (migErr) {
                logger.error(`[Auth] Failed to lazy-migrate password for user: ${user.username}`, migErr);
              }
            }

            try {
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
              logger.error('Failed to log login activity in authorize callback:', e);
            }

            return {
              id: String(user.id),
              name: user.name,
              email: user.username, // using email slot for username
              role: user.role,
            };
          }
        }

        // Authentication failed - record failed attempt for brute-force protection
        const currentAttempt = loginAttempts.get(rateLimitKey) || { count: 0, lockedUntil: 0 };
        currentAttempt.count += 1;
        if (currentAttempt.count >= MAX_ATTEMPTS) {
          currentAttempt.lockedUntil = now + LOCKOUT_MS;
          logger.warn(`[Auth Lockout] Account ${username} locked out from IP ${ipAddress} for 15 minutes after ${currentAttempt.count} failed attempts.`);
        }
        loginAttempts.set(rateLimitKey, currentAttempt);

        try {
          await logActivity({
            username: username || 'Unknown',
            action: 'LOGIN_FAILED',
            entityType: 'USER',
            entityId: user ? String(user.id) : '0',
            ipAddress,
            userAgent,
            details: `${username} এর জন্য ব্যর্থ লগইন প্রচেষ্টা (ভুল পাসওয়ার্ড অথবা ইউজার নেই)। চেষ্টা: ${currentAttempt.count}/${MAX_ATTEMPTS}`
          });
        } catch (e) {
          logger.error('Failed to log failed login activity in authorize callback:', e);
        }

        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (office working hours)
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
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        if (urlObj.origin === baseObj.origin || urlObj.hostname === baseObj.hostname) return url;
      } catch {}
      return baseUrl;
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || (isBuildPhase || process.env.NODE_ENV !== 'production' ? 'ci-build-temporary-nextauth-secret-key-2026' : undefined),
  logger: {
    error(code, ...metadata) {
      if (code === 'JWT_SESSION_ERROR' && metadata.some(m => String(m).includes('decryption operation failed'))) {
        logger.warn('NextAuth: Session decryption failed (likely due to expired or mismatched browser cookies). Redirecting to login.');
        return;
      }
      logger.error(code, ...metadata);
    }
  }
};
