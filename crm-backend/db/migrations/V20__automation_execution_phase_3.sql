-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE: Marketing Automation - PHASE 3: Execution Engine
-- Adds database schema for automation execution tracking
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Create automation_executions table for execution tracking
-- 2. Create indexes for efficient queries
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. CREATE automation_executions TABLE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_executions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign Key to automation
    automation_id BIGINT NOT NULL,
    CONSTRAINT fk_execution_automation_id
        FOREIGN KEY (automation_id)
        REFERENCES automations(id)
        ON DELETE CASCADE,
    
    -- Foreign Key to lead (optional for future trigger types)
    lead_id BIGINT,
    CONSTRAINT fk_execution_lead_id
        FOREIGN KEY (lead_id)
        REFERENCES leads(id)
        ON DELETE CASCADE,
    
    -- Execution Status: PENDING, RUNNING, WAITING, COMPLETED, FAILED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED')),
    
    -- Current step (1-based, null if not started)
    current_step INTEGER,
    
    -- Error message (if failed)
    error TEXT,
    
    -- Failed step ID (if status=FAILED)
    failed_step_id BIGINT,
    
    -- Execution timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,      -- When paused at WAIT_DURATION
    resume_at TIMESTAMP,       -- When to resume after wait
    
    -- Audit timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES
-- ───────────────────────────────────────────────────────────────────────────

-- Find executions for an automation
CREATE INDEX IF NOT EXISTS idx_execution_automation_id
    ON automation_executions(automation_id);

-- Find executions for a lead
CREATE INDEX IF NOT EXISTS idx_execution_lead_id
    ON automation_executions(lead_id);

-- Find executions by status
CREATE INDEX IF NOT EXISTS idx_execution_status
    ON automation_executions(status);

-- Find executions by creation time
CREATE INDEX IF NOT EXISTS idx_execution_created_at
    ON automation_executions(created_at DESC);

-- Composite: Find pending automations for a workspace automation
CREATE INDEX IF NOT EXISTS idx_execution_automation_status
    ON automation_executions(automation_id, status);

-- Find waiting executions that need to resume
CREATE INDEX IF NOT EXISTS idx_execution_waiting
    ON automation_executions(resume_at)
    WHERE status = 'WAITING' AND resume_at IS NOT NULL;

COMMIT;
