-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE: Marketing Automation - PHASE 2: Workflow Model
-- Adds database schema for automation steps
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Create automation_steps table with workflow support
-- 2. Create indexes for efficient queries
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. CREATE automation_steps TABLE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_steps (
    id BIGSERIAL PRIMARY KEY,
    
    -- Parent Automation: Mandatory foreign key
    automation_id BIGINT NOT NULL,
    CONSTRAINT fk_step_automation_id
        FOREIGN KEY (automation_id)
        REFERENCES automations(id)
        ON DELETE CASCADE,
    
    -- Step Ordering
    step_order INTEGER NOT NULL,
    CONSTRAINT ck_step_order CHECK (step_order > 0),
    
    -- Step Type: TRIGGER, ACTION, CONDITION, WAIT
    step_type VARCHAR(50) NOT NULL
        CHECK (step_type IN (
            'LEAD_CREATED',
            'LEAD_MAGNET_SUBMITTED',
            'EMAIL_OPENED',
            'EMAIL_CLICKED',
            'SEND_EMAIL',
            'UPDATE_LEAD',
            'UPDATE_LEAD_SCORE',
            'EMAIL_OPENED_CONDITION',
            'EMAIL_CLICKED_CONDITION',
            'LEAD_STATUS_CONDITION',
            'LEAD_SCORE_CONDITION',
            'WAIT_DURATION'
        )),
    
    -- JSONB Configuration: Flexible, step-type-specific settings
    configuration JSONB DEFAULT NULL,
    
    -- Enable/Disable
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Trail
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES FOR EFFICIENT QUERIES
-- ───────────────────────────────────────────────────────────────────────────

-- Index: Find all steps in an automation
CREATE INDEX IF NOT EXISTS idx_step_automation_id
    ON automation_steps(automation_id);

-- Composite Index: Get steps in order
CREATE INDEX IF NOT EXISTS idx_step_automation_order
    ON automation_steps(automation_id, step_order ASC);

-- Index: Find steps by type
CREATE INDEX IF NOT EXISTS idx_step_type
    ON automation_steps(step_type)
    WHERE enabled = true;

-- Index: Find enabled steps
CREATE INDEX IF NOT EXISTS idx_step_enabled
    ON automation_steps(enabled);

-- Index: Find steps by creation date
CREATE INDEX IF NOT EXISTS idx_step_created_at
    ON automation_steps(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. CONSTRAINT: Unique step order per automation
-- ───────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_step_automation_order_unique
    ON automation_steps(automation_id, step_order);

COMMIT;
