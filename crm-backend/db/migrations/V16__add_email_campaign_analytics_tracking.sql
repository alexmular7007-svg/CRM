-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE #3: Email Campaign Analytics Tracking
-- Adds analytics tracking metrics to email_campaigns and webhook support
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Add analytics metric columns to email_campaigns table
-- 2. Ensure unique constraint on providerEventId in email_campaign_history
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. ADD ANALYTICS COLUMNS TO email_campaigns TABLE
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS delivered_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count BIGINT DEFAULT 0;

-- Create indexes on new columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_campaign_delivered_count ON email_campaigns(delivered_count);
CREATE INDEX IF NOT EXISTS idx_campaign_opened_count ON email_campaigns(opened_count);
CREATE INDEX IF NOT EXISTS idx_campaign_clicked_count ON email_campaigns(clicked_count);
CREATE INDEX IF NOT EXISTS idx_campaign_bounced_count ON email_campaigns(bounced_count);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. ENSURE UNIQUE CONSTRAINT ON provider_event_id FOR DEDUPLICATION
-- ───────────────────────────────────────────────────────────────────────────
-- The unique constraint is already defined in the schema, but we ensure it exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_history_provider_event_id_unique 
    ON email_campaign_history(provider_event_id) 
    WHERE provider_event_id IS NOT NULL;

COMMIT;
