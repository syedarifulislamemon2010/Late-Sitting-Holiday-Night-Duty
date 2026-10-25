-- ==============================================================================
-- scripts/check-duplicates.sql
-- Description: Read-only duplicate audit script for PostgreSQL database
-- Purpose:
--   1. Detect duplicate duties on (employeeId, date, type).
--   2. Detect duplicate employees by bankId (ignoring null and empty strings).
--   3. Detect cross-duty conflicts on the same date (e.g. LATE_SITTING & NIGHT_SHIFT).
-- SAFETY: This script contains ONLY SELECT statements. It does NOT modify data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DUTIES: Check duplicate duties on (employeeId, date, type)
-- ------------------------------------------------------------------------------
SELECT
    d."employeeId",
    e."name" AS employee_name,
    e."bankId" AS employee_bank_id,
    c."name" AS cell_name,
    d."date",
    d."type",
    COUNT(*) AS duplicate_count,
    ARRAY_AGG(d."id" ORDER BY d."id") AS duty_ids,
    ARRAY_AGG(COALESCE(d."orderRef", '<NO_ORDER_REF>') ORDER BY d."id") AS order_refs,
    ARRAY_AGG(d."totalBill" ORDER BY d."id") AS total_bills
FROM "Duty" d
LEFT JOIN "Employee" e ON e."id" = d."employeeId"
LEFT JOIN "Cell" c ON c."id" = e."cellId"
GROUP BY d."employeeId", e."name", e."bankId", c."name", d."date", d."type"
HAVING COUNT(*) > 1
ORDER BY d."date" DESC, d."employeeId" ASC;

-- ------------------------------------------------------------------------------
-- 2. EMPLOYEES: Check duplicate bankId entries
--    (Excludes NULL, empty strings, and whitespace-only entries)
-- ------------------------------------------------------------------------------
SELECT
    TRIM(e."bankId") AS bank_id,
    COUNT(*) AS duplicate_count,
    ARRAY_AGG(e."id" ORDER BY e."id") AS employee_ids,
    ARRAY_AGG(e."name" ORDER BY e."id") AS employee_names,
    ARRAY_AGG(e."designation" ORDER BY e."id") AS designations,
    ARRAY_AGG(COALESCE(c."name", '<NO_CELL>') ORDER BY e."id") AS cell_names,
    ARRAY_AGG(e."createdAt"::text ORDER BY e."id") AS created_at_list
FROM "Employee" e
LEFT JOIN "Cell" c ON c."id" = e."cellId"
WHERE e."bankId" IS NOT NULL
  AND TRIM(e."bankId") <> ''
GROUP BY TRIM(e."bankId")
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, bank_id ASC;

-- ------------------------------------------------------------------------------
-- 3. DUTIES (EXTRA INTEGRITY CHECK): Same officer, same date conflicting duty types
--    (Business rule: LATE_SITTING and NIGHT_SHIFT cannot co-exist on same date)
-- ------------------------------------------------------------------------------
SELECT
    d."employeeId",
    e."name" AS employee_name,
    d."date",
    COUNT(DISTINCT d."type") AS distinct_types_count,
    ARRAY_AGG(DISTINCT d."type") AS duty_types,
    ARRAY_AGG(d."id" ORDER BY d."id") AS duty_ids
FROM "Duty" d
LEFT JOIN "Employee" e ON e."id" = d."employeeId"
WHERE d."type" IN ('LATE_SITTING', 'NIGHT_SHIFT')
GROUP BY d."employeeId", e."name", d."date"
HAVING COUNT(DISTINCT d."type") > 1
ORDER BY d."date" DESC, d."employeeId" ASC;
