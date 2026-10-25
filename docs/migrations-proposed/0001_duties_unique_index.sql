-- ==============================================================================
-- docs/migrations-proposed/0001_duties_unique_index.sql
-- Proposal: Add unique partial index on "Duty"("employeeId", "date", "type")
-- Purpose: Prevent duplicate duty assignments at database engine level.
-- Safe deployment pattern: CREATE UNIQUE INDEX CONCURRENTLY
-- ==============================================================================

-- ==============================================================================
-- PRE-CHECK (Dry-run verification on Staging before execution)
-- Must return 0 rows before creating unique index:
-- ==============================================================================
-- SELECT "employeeId", "date", "type", COUNT(*)
-- FROM "Duty"
-- GROUP BY "employeeId", "date", "type"
-- HAVING COUNT(*) > 1;

-- ==============================================================================
-- FORWARD MIGRATION (UP)
-- ==============================================================================

-- In PostgreSQL production environments with active connections, CONCURRENTLY
-- builds the index without acquiring an exclusive write lock on "Duty".
-- NOTE: CONCURRENTLY cannot run inside a multi-statement transaction block.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_duties_employee_date_type_unique"
ON "Duty" ("employeeId", "date", "type");

-- ==============================================================================
-- DRIZZLE ORM SCHEMA REPLICATION
-- In src/db/schema.ts, within duties table callback:
--   empDateTypeUnique: uniqueIndex('idx_duties_employee_date_type_unique').on(table.employeeId, table.date, table.type),
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK MIGRATION (DOWN)
-- ==============================================================================
-- DROP INDEX CONCURRENTLY IF EXISTS "idx_duties_employee_date_type_unique";
