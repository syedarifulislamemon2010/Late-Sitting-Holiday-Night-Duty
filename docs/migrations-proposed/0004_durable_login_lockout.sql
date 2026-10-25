-- ==============================================================================
-- docs/migrations-proposed/0004_durable_login_lockout.sql
-- Proposal: Create "LoginAttempt" table for durable authentication lockout tracking
-- Purpose:
--   Prevent brute-force rate-limiting resets across server/PM2 reloads.
--   Preserves fail-safe in-memory fallback if table does not exist or DB connection fails.
-- ==============================================================================

-- ==============================================================================
-- FORWARD MIGRATION (UP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "username" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lockedUntil" TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_login_attempt_key" ON "LoginAttempt" ("key");
CREATE INDEX IF NOT EXISTS "idx_login_attempt_locked" ON "LoginAttempt" ("lockedUntil");

-- Auto cleanup expired entries older than 24 hours
-- DELETE FROM "LoginAttempt" WHERE "updatedAt" < NOW() - INTERVAL '24 hours';

-- ==============================================================================
-- ROLLBACK MIGRATION (DOWN)
-- ==============================================================================
-- DROP TABLE IF EXISTS "LoginAttempt" CASCADE;
