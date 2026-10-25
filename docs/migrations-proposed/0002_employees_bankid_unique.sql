-- ==============================================================================
-- docs/migrations-proposed/0002_employees_bankid_unique.sql
-- Proposal: Add unique partial index on "Employee"("bankId")
-- Purpose: Enforce unique bank ID per officer while safely handling NULLs.
-- Safe deployment pattern: CREATE UNIQUE INDEX CONCURRENTLY WHERE "bankId" IS NOT NULL
-- ==============================================================================

-- ==============================================================================
-- PRE-CHECK (Dry-run verification on Staging before execution)
-- Must return 0 rows before creating unique index:
-- ==============================================================================
-- SELECT TRIM("bankId") AS bank_id, COUNT(*)
-- FROM "Employee"
-- WHERE "bankId" IS NOT NULL AND TRIM("bankId") <> ''
-- GROUP BY TRIM("bankId")
-- HAVING COUNT(*) > 1;

-- ==============================================================================
-- FORWARD MIGRATION (UP)
-- ==============================================================================

-- Partial unique index ensures that:
-- 1. Multiple officers without bankId (NULL or empty string) can exist.
-- 2. Non-null, non-empty bankIds must be globally unique across all active cells.
-- CONCURRENTLY prevents locking table reads/writes during index creation.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_employee_bankid_unique"
ON "Employee" ("bankId")
WHERE "bankId" IS NOT NULL AND "bankId" <> '';

-- ==============================================================================
-- DRIZZLE ORM SCHEMA REPLICATION
-- In src/db/schema.ts, within employees table callback:
--   bankIdUnique: uniqueIndex('idx_employee_bankid_unique').on(table.bankId).where(sql`"bankId" IS NOT NULL AND "bankId" <> ''`),
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK MIGRATION (DOWN)
-- ==============================================================================
-- DROP INDEX CONCURRENTLY IF EXISTS "idx_employee_bankid_unique";
