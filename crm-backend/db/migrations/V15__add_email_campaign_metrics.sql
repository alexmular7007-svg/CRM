-- V15__add_email_campaign_metrics.sql
-- Add sent_count and failed_count columns to email_campaigns table
-- for tracking campaign delivery metrics

ALTER TABLE email_campaigns
ADD COLUMN sent_count BIGINT DEFAULT 0,
ADD COLUMN failed_count BIGINT DEFAULT 0;

-- Create index for status and sent_count for analytics queries
CREATE INDEX idx_campaign_status_sent_count ON email_campaigns(status, sent_count);

-- Add comment for clarity
COMMENT ON COLUMN email_campaigns.sent_count IS 'Number of emails successfully sent by Brevo API';
COMMENT ON COLUMN email_campaigns.failed_count IS 'Number of emails that failed to send';
