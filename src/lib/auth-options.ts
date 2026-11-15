import logger from '@/lib/logger';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, employees, userCells } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { logActivity } from '@/lib/audit';
import { toEnglishDigits } from '@/lib/bengali-converter';
import { verifyPassword, hashPassword } from '@/lib/password';
import { getLoginAttempt, recordFailedAttempt, clearLoginAttempt, MAX_ATTEMPTS } from '@/lib/login-lockout';
import { getBankIdSearchCandidates, normalizeBankId, normalizeMobile } from '@/lib/bank-id-helper';

// Validate NEXTAUTH_SECRET on startup
// STRICT SECURITY CHECK: Detect compile-time build phases only, never trust CI flag at runtime
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    if (!isBuildPhase) {
      throw new Error('🚨 [Critical Security Error]: NEXTAUTH_SECRET is required in production. Please set NEXTAUTH_SECRET in your environment.');
    }
  } else {
    logger.warn('⚠️ [Security Warning]: NEXTAUTH_SECRET is not set in environment variables. Please set NEXTAUTH_SECRET in your .env file.');
  }
}

// Brute-force lockout is managed via hybrid DB/memory in @/lib/login-lockout

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
        const attempt = await getLoginAttempt(rateLimitKey);
        if (attempt && attempt.lockedUntil > now) {
          const remainingMin = Math.ceil((attempt.lockedUntil - now) / 60000);
          logger.warn(`[Auth Lockout] Login blocked for ${username} from ${ipAddress}. Locked for ${remainingMin} more minutes.`);
          throw new Error(`অতিরিক্ত ব্যর্থ প্রচেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। ${remainingMin} মিনিট পর পুনরায় চেষ্টা করুন।`);
        }

        // Query user using candidates (supports both 6-digit padded '034269' and unpadded '34269')
        const candidates = getBankIdSearchCandidates(username);
        const candidateLower = candidates.map((c) => c.toLowerCase());

        const userList = await db.select().from(users).where(inArray(users.username, candidates));
        let user = userList[0];

        // Case-insensitive exact match fallback if exact match fails
        if (!user) {
          const caseInsensitiveUsers = await db
            .select()
            .from(users)
            .where(inArray(sql`LOWER(TRIM(${users.username}))`, candidateLower))
            .limit(1);
          user = caseInsensitiveUsers[0];
        }

        // Auto-provision user if missing, but employee with this bankId exists
        if (!user) {
          const empList = await db.select().from(employees).where(inArray(employees.bankId, candidates));
          let employee = empList[0];

          if (!employee) {
            const caseInsensitiveEmps = await db
              .select()
              .from(employees)
              .where(inArray(sql`LOWER(TRIM(${employees.bankId}))`, candidateLower))
              .limit(1);
            employee = caseInsensitiveEmps[0];
          }

          if (employee && employee.bankId) {
            const finalBankId = normalizeBankId(employee.bankId) || employee.bankId.trim();
            const finalMobile = normalizeMobile(employee.mobile) || (employee.mobile ? employee.mobile.trim() : null);

            // Create user in the database with secure hashed default password
            const hashedDefaultPassword = await hashPassword('123456');
            const newUsers = await db.insert(users).values({
              username: finalBankId,
              password: hashedDefaultPassword, // default password hashed
              name: employee.name.trim(),
              role: 'USER',
              mobile: finalMobile,
            }).returning();
            
            user = newUsers[0];

            // Connect user to the employee's cell (A = cellId, B = userId)
            if (employee.cellId) {
              await db.insert(userCells).values({
                A: employee.cellId,
                B: user.id,
              }).catch((e) => logger.error('Failed to attach user cell mapping:', e));
            }

            logger.info(`Auto-provisioned User record with hashed password for Employee: ${employee.name} (${finalBankId})`);
          }
        }

        if (user) {
          // Dual-compatible verification: supports both modern bcrypt hash and legacy plaintext
          const { isValid, needsMigration } = await verifyPassword(password, user.password);

          if (isValid) {
            // Reset failed login count upon successful authentication
            await clearLoginAttempt(rateLimitKey);

            // Self-heal: ensure 6-digit padded bankId and 11-digit mobile for user and employee records
            const normalizedBankId = normalizeBankId(user.username);
            const normalizedUserMobile = normalizeMobile(user.mobile);
            if ((normalizedBankId && normalizedBankId !== user.username) || (normalizedUserMobile && normalizedUserMobile !== user.mobile)) {
              try {
                const patch: { username?: string; mobile?: string } = {};
                if (normalizedBankId && normalizedBankId !== user.username) {
                  patch.username = normalizedBankId;
                }
                if (normalizedUserMobile && normalizedUserMobile !== user.mobile) {
                  patch.mobile = normalizedUserMobile;
                }
                await db.update(users).set(patch).where(eq(users.id, user.id));
                if (patch.username) {
                  await db.update(employees)
                    .set({ bankId: patch.username, ...(patch.mobile ? { mobile: patch.mobile } : {}) })
                    .where(eq(sql`LOWER(TRIM(${employees.bankId}))`, user.username.toLowerCase()));
                  user.username = patch.username;
                }
                if (patch.mobile) user.mobile = patch.mobile;
                logger.info(`[Auth] Auto-healed bankId/mobile for user: ${user.username} (ID: ${user.id})`);
              } catch (healErr) {
                logger.warn('[Auth] Could not auto-heal user record:', healErr);
              }
            }

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
        const currentAttempt = await recordFailedAttempt(rateLimitKey, username, ipAddress);

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
  secret: process.env.NEXTAUTH_SECRET || (isBuildPhase ? 'ci-build-temporary-nextauth-secret-key-2026' : (process.env.NODE_ENV !== 'production' ? 'dev-local-temporary-nextauth-secret-key-2026' : undefined)),
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
