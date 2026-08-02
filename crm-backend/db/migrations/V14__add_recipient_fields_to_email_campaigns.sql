-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add recipient_mode and recipient_data columns to email_campaigns
-- 
-- REASON: EmailCampaign entity was enhanced to support multiple recipient modes:
--         - MANUAL: Direct email list
--         - SEGMENT: Saved audience segment
--         - CRM_FILTER: CRM lead filter
--
-- This migration adds the missing columns to support the entity changes.
-- 
-- IDEMPOTENT: Uses IF NOT EXISTS for safe re-execution
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Add recipient_mode column (VARCHAR with max length 50)
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS recipient_mode VARCHAR(50);

-- Add recipient_data column (JSONB for flexible recipient data storage)
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS recipient_data JSONB DEFAULT '{}';

-- Create index on recipient_mode for query optimization
CREATE INDEX IF NOT EXISTS idx_campaign_recipient_mode 
ON email_campaigns(recipient_mode);

COMMIT;
