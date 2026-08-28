-- Phase 13.1.4: automation recipient context
--
-- Flyway is not configured in this application.
-- Production Supabase requires manual execution of this SQL after review.
-- This script does not drop constraints, delete data, or modify existing rows.

BEGIN;

ALTER TABLE email_campaign_recipients
    ADD COLUMN IF NOT EXISTS automation_id BIGINT,
    ADD COLUMN IF NOT EXISTS execution_id BIGINT,
    ADD COLUMN IF NOT EXISTS automation_step_id BIGINT,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_recipient_automation_id'
          AND conrelid = 'email_campaign_recipients'::regclass
    ) THEN
        ALTER TABLE email_campaign_recipients
            ADD CONSTRAINT fk_recipient_automation_id
            FOREIGN KEY (automation_id) REFERENCES automations(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_recipient_execution_id'
          AND conrelid = 'email_campaign_recipients'::regclass
    ) THEN
        ALTER TABLE email_campaign_recipients
            ADD CONSTRAINT fk_recipient_execution_id
            FOREIGN KEY (execution_id) REFERENCES automation_executions(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_recipient_automation_step_id'
          AND conrelid = 'email_campaign_recipients'::regclass
    ) THEN
        ALTER TABLE email_campaign_recipients
            ADD CONSTRAINT fk_recipient_automation_step_id
            FOREIGN KEY (automation_step_id) REFERENCES automation_steps(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recipient_automation_id
    ON email_campaign_recipients(automation_id);
CREATE INDEX IF NOT EXISTS idx_recipient_execution_id
    ON email_campaign_recipients(execution_id);
CREATE INDEX IF NOT EXISTS idx_recipient_automation_step_id
    ON email_campaign_recipients(automation_step_id);
CREATE INDEX IF NOT EXISTS idx_recipient_idempotency_key
    ON email_campaign_recipients(idempotency_key);

DO $$
BEGIN
    IF EXISTS (
        SELECT idempotency_key
        FROM email_campaign_recipients
        WHERE idempotency_key IS NOT NULL
        GROUP BY idempotency_key
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate non-null idempotency keys exist; unique index not created';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipient_idempotency_key
    ON email_campaign_recipients(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

COMMIT;