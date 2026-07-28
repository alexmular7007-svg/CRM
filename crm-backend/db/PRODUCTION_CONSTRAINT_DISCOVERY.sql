-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCTION CONSTRAINT DISCOVERY SCRIPT
-- PHASE 1A.5 VERIFICATION - Before running V12 migration
-- 
-- DO NOT assume constraint name is "leads_email_key"
-- Run this script FIRST to discover actual production constraint
-- 
-- IMPORTANT: This is a DISCOVERY-ONLY script
-- Do NOT execute V12 migration until constraint name is verified
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY 1: Find ALL unique constraints on leads table
-- ───────────────────────────────────────────────────────────────────────────

SELECT
    constraint_name,
    table_name,
    constraint_type,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'leads'
  AND constraint_type = 'UNIQUE'
ORDER BY constraint_name, ordinal_position;

-- Expected results:
-- - constraint_name: leads_pkey (on id, always present)
-- - constraint_name: leads_email_key (or similar - this is what we need to drop)
-- 
-- If multiple UNIQUE constraints exist on email:
-- - leads_email_key (Hibernate auto-generated)
-- - leads_unique_email (manual naming convention)
-- - leads_email_unique (manual naming convention)
-- 
-- Document the EXACT constraint_name value
-- Use that in V12 migration DO $$ block

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY 2: Find UNIQUE indexes (might be index-backed constraint)
-- ───────────────────────────────────────────────────────────────────────────

SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
  AND indexdef LIKE '%UNIQUE%'
ORDER BY indexname;

-- Expected results:
-- - Index backing the unique constraint on email
-- - Might show "UNIQUE" in indexdef

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY 3: Detailed constraint definition
-- ───────────────────────────────────────────────────────────────────────────

SELECT
    t.table_name,
    c.constraint_name,
    c.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.tables t
  ON t.table_name = tc.table_name
WHERE tc.table_name = 'leads'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Returns:
// - Constraint name to DROP in V12
// - Column(s) involved
// - Deferral properties

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY 4: Alternative - Check for multi-column unique constraints
-- ───────────────────────────────────────────────────────────────────────────

SELECT
    constraint_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.key_column_usage
WHERE table_name = 'leads'
  AND constraint_type = 'UNIQUE'
GROUP BY constraint_name
ORDER BY constraint_name;

-- Expected output:
// leads_pkey: id
// leads_email_key: email (single column - this is the one we need to drop)
//
// If you see: "workspace_id, email" - that means it's already been done!
// Do NOT re-apply V12 migration if this exists

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY 5: Confirm email column properties
-- ───────────────────────────────────────────────────────────────────────────

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'email';

-- Expected output:
// column_name: email
// data_type: character varying or varchar
// is_nullable: NO
// column_default: (none)

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION READINESS CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Before running V12 migration, verify:
// ✓ Query 1 identifies exact unique constraint name
// ✓ Query 2 shows email index marked UNIQUE
// ✓ Query 3 shows single-column constraint on email
// ✓ Query 4 shows "email" only (not "workspace_id, email")
// ✓ Query 5 shows email column is NOT NULL
// ✓ NO errors from constraint discovery
// 
// If Query 4 shows "workspace_id, email" already:
// - Composite constraint already applied
// - Do NOT re-run V12 migration (idempotency check will prevent it)
// 
// If Query 1/2 find NO unique constraint on email:
// - UNEXPECTED - verify you're on correct database
// - Check if email was already dropped in previous migration
// - Verify against production schema before proceeding
// 
// REQUIRED ACTION FOR V12:
// Edit V12__feature_2_lead_magnet_schema.sql STEP 1
// Replace "leads_email_key" with actual constraint_name from Query 1
// Then execute V12 migration
// 
// ═══════════════════════════════════════════════════════════════════════════
