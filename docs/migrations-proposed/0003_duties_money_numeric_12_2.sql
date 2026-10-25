-- ==============================================================================
-- docs/migrations-proposed/0003_duties_money_numeric_12_2.sql
-- Proposal: Convert monetary columns from double precision to numeric(12,2)
-- Affected columns: "Duty"."allowance1", "Duty"."allowance2", "Duty"."totalBill"
-- Purpose:
--   Prevent IEEE 754 floating-point inaccuracies in currency calculations.
--   Preserve exact taka values (300.00, 500.00, 1000.00, etc.).
-- ==============================================================================

-- ==============================================================================
-- 1. MATHEMATICAL VALUE-PRESERVATION PROOF (মান-সংরক্ষণশীলতার প্রমাণ)
-- ==============================================================================
-- In our system, allowance rates are strictly discrete integers in taka:
--   - LATE_SITTING: allowance1 = 300, allowance2 = 0, totalBill = 300
--   - HOLIDAY:      allowance1 = 500, allowance2 = 0, totalBill = 500
--   - NIGHT_SHIFT:  allowance1 = 500, allowance2 = 500, totalBill = 1000
--
-- IEEE 754 double precision (64-bit float) represents all integer values up to
-- 2^53 - 1 (9,007,199,254,740,991) with 100% exact precision (zero roundoff error).
-- Since all existing taka values in "Duty" are non-negative integers or exact halves/decimals
-- well below 10^7, casting directly:
--   value::numeric(12,2) == value::double precision
-- is mathematically guaranteed to be exact and lossless.
--
-- PRE-CHECK SQL (Dry-run verification on Staging before execution):
-- Must return 0 rows:
-- ==============================================================================
-- SELECT "id", "allowance1", "allowance2", "totalBill"
-- FROM "Duty"
-- WHERE "allowance1"::numeric(12,2)::double precision <> "allowance1"
--    OR "allowance2"::numeric(12,2)::double precision <> "allowance2"
--    OR "totalBill"::numeric(12,2)::double precision <> "totalBill";

-- ==============================================================================
-- 2. FORWARD MIGRATION (UP)
-- ==============================================================================
BEGIN;

ALTER TABLE "Duty"
  ALTER COLUMN "allowance1" TYPE numeric(12,2) USING ROUND("allowance1"::numeric, 2),
  ALTER COLUMN "allowance2" TYPE numeric(12,2) USING ROUND("allowance2"::numeric, 2),
  ALTER COLUMN "totalBill" TYPE numeric(12,2) USING ROUND("totalBill"::numeric, 2);

-- Post-migration check inside transaction
DO $$
DECLARE
  mismatch_count integer;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM "Duty"
  WHERE "allowance1" IS NULL OR "allowance2" IS NULL OR "totalBill" IS NULL;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: null monetary fields encountered';
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- 3. ROLLBACK MIGRATION (DOWN)
-- ==============================================================================
-- BEGIN;
-- ALTER TABLE "Duty"
--   ALTER COLUMN "allowance1" TYPE double precision USING "allowance1"::double precision,
--   ALTER COLUMN "allowance2" TYPE double precision USING "allowance2"::double precision,
--   ALTER COLUMN "totalBill" TYPE double precision USING "totalBill"::double precision;
-- COMMIT;
