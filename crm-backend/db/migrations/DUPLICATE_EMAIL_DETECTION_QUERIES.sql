-- ═══════════════════════════════════════════════════════════════════════════
-- EMAIL NORMALIZATION AUDIT QUERIES
-- PHASE 1A.5 VERIFICATION
-- 
-- Run these queries BEFORE applying V12 migration to identify:
-- 1. Emails not already normalized
-- 2. Logical duplicates within same workspace
-- 
-- If results found: DO NOT apply V12 migration
-- Manually deduplicate/merge leads first, then retry
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY A: Find emails that are NOT already normalized
-- 
-- Normalized format: LOWER(TRIM(email))
-- This query finds emails where the stored value differs from normalized form
-- ───────────────────────────────────────────────────────────────────────────

SELECT 
    id,
    workspace_id,
    email,
    LOWER(TRIM(email)) AS normalized_email,
    CASE 
        WHEN email <> LOWER(TRIM(email)) THEN 'NOT_NORMALIZED'
        ELSE 'NORMALIZED'
    END AS status
FROM leads
WHERE email <> LOWER(TRIM(email))
ORDER BY workspace_id, email;

-- EXPECTED: Empty result set
-- MEANING: All emails are already in canonical form (lowercase + trimmed)
-- 
-- IF RESULTS FOUND:
-- These emails need normalization before adding composite unique constraint
-- Options:
-- 1. Update manually: UPDATE leads SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email));
-- 2. Or merge duplicates first

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY B: Find logical duplicates (same workspace + same normalized email)
-- 
-- Multiple leads with same email = different casing or spacing
-- This query groups leads by workspace and normalized email
-- ───────────────────────────────────────────────────────────────────────────

SELECT 
    workspace_id,
    LOWER(TRIM(email)) AS normalized_email,
    COUNT(*) AS duplicate_count,
    STRING_AGG(CAST(id AS VARCHAR), ', ') AS lead_ids,
    STRING_AGG(email, ', ') AS email_variants
FROM leads
GROUP BY workspace_id, LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY workspace_id, duplicate_count DESC;

-- EXPECTED: Empty result set
-- MEANING: No duplicate emails within any workspace
-- 
-- IF RESULTS FOUND:
-- These are conflicting leads that must be manually deduplicated
-- Options:
-- 1. Merge leads (keep one, migrate relationships)
-- 2. Delete one (only if truly duplicate data)
-- 3. Manually review to determine intent
-- 
-- REQUIRED BEFORE V12 MIGRATION:
-- All groups must have count = 1

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY C: Case-sensitive uniqueness violations (edge case)
-- 
-- Find emails that differ ONLY in case within same workspace
-- These would cause duplicate key exception with normalized storage
-- ───────────────────────────────────────────────────────────────────────────

SELECT 
    l1.workspace_id,
    l1.email AS email_1,
    l2.email AS email_2,
    l1.id AS id_1,
    l2.id AS id_2
FROM leads l1
JOIN leads l2 
    ON l1.workspace_id = l2.workspace_id
    AND LOWER(TRIM(l1.email)) = LOWER(TRIM(l2.email))
    AND l1.id < l2.id
ORDER BY l1.workspace_id, l1.email;

-- EXPECTED: Empty result set
-- MEANING: No case-variant duplicates
-- 
-- IF RESULTS FOUND:
-- Case variants exist that will violate composite unique constraint
-- Must be deduplicated before migration

-- ───────────────────────────────────────────────────────────────────────────
-- QUERY D: Summary Report
-- ───────────────────────────────────────────────────────────────────────────

SELECT 
    COUNT(*) AS total_leads,
    COUNT(DISTINCT workspace_id) AS workspaces,
    COUNT(DISTINCT LOWER(TRIM(email))) AS unique_normalized_emails,
    COUNT(DISTINCT email) AS unique_stored_emails,
    CASE 
        WHEN COUNT(*) = 0 THEN 'EMPTY'
        WHEN COUNT(DISTINCT email) = COUNT(DISTINCT LOWER(TRIM(email))) 
            AND COUNT(*) = COUNT(DISTINCT LOWER(TRIM(email))) 
            THEN 'CLEAN - Ready for migration'
        ELSE 'ISSUES - Requires manual remediation'
    END AS migration_status
FROM leads;

-- ───────────────────────────────────────────────────────────────────────────
-- MIGRATION READINESS CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Before applying V12 migration, verify:
-- ✓ Query A returns 0 rows (all emails normalized)
-- ✓ Query B returns 0 rows (no duplicate emails in workspace)
-- ✓ Query C returns 0 rows (no case-variant duplicates)
-- ✓ Query D shows "Ready for migration"
-- 
-- If any query returns unexpected results:
-- 1. STOP - Do not apply V12 migration
-- 2. Manually review conflicting leads
-- 3. Deduplicate (merge or delete) as appropriate
-- 4. Update emails to normalized form if needed
-- 5. Rerun queries to verify clean state
-- 6. Then proceed with V12 migration
-- 
-- ═══════════════════════════════════════════════════════════════════════════
