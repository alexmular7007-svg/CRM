-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: Add Idempotency Key to Email Campaign History
-- Prevents duplicate webhook events from being processed multiple times
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Add idempotency_key column to email_campaign_history table
-- 2. Create unique index on (workspace_id, idempotency_key) for deduplication
-- 3. Backfill existing records with provider_event_id as idempotency_key
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. ADD IDEMPOTENCY_KEY COLUMN TO email_campaign_history
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE email_campaign_history
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. BACKFILL IDEMPOTENCY_KEY FROM provider_event_id
-- ───────────────────────────────────────────────────────────────────────────
UPDATE email_campaign_history
SET idempotency_key = provider_event_id
WHERE idempotency_key IS NULL AND provider_event_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. CREATE UNIQUE INDEX FOR IDEMPOTENCY DETECTION
-- ───────────────────────────────────────────────────────────────────────────
-- Ensures each (workspace_id, idempotency_key) combination is unique
-- This prevents duplicate webhook events from being processed
CREATE UNIQUE INDEX IF NOT EXISTS idx_history_idempotency_key_unique 
    ON email_campaign_history(workspace_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. CREATE INDEX FOR FAST LOOKUPS BY IDEMPOTENCY_KEY
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_history_idempotency_key 
    ON email_campaign_history(idempotency_key);

COMMIT;
