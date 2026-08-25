-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE: Marketing Automation - PHASE 1: Core Foundation
-- Adds database schema for automation entities
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Create automations table with workspace isolation
-- 2. Create indexes for efficient queries
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. CREATE automations TABLE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Workspace Isolation: Mandatory foreign key
    workspace_id BIGINT NOT NULL,
    CONSTRAINT fk_automation_workspace_id
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,
    
    -- Core Fields
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status Lifecycle: DRAFT, ACTIVE, PAUSED, ARCHIVED
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED')),
    
    -- Trigger Type: LEAD_CREATED, LEAD_MAGNET_SUBMITTED, EMAIL_OPENED, EMAIL_CLICKED
    trigger_type VARCHAR(50) NOT NULL
        CHECK (trigger_type IN ('LEAD_CREATED', 'LEAD_MAGNET_SUBMITTED', 'EMAIL_OPENED', 'EMAIL_CLICKED')),
    
    -- JSONB Configuration: Flexible, trigger-specific settings
    trigger_config JSONB NOT NULL DEFAULT '{}',
    
    -- JSONB Actions: Reserved for Phase 2+
    action_config JSONB DEFAULT NULL,
    
    -- Audit Trail
    created_by_id BIGINT NOT NULL,
    CONSTRAINT fk_automation_created_by_id
        FOREIGN KEY (created_by_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft Delete
    archived_at TIMESTAMP DEFAULT NULL
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES FOR EFFICIENT QUERIES
-- ───────────────────────────────────────────────────────────────────────────

-- Index: Find all automations in a workspace
CREATE INDEX IF NOT EXISTS idx_automation_workspace_id
    ON automations(workspace_id);

-- Index: Find active automations in a workspace
CREATE INDEX IF NOT EXISTS idx_automation_status
    ON automations(status)
    WHERE archived_at IS NULL;

-- Index: Find automations by trigger type
CREATE INDEX IF NOT EXISTS idx_automation_trigger_type
    ON automations(trigger_type)
    WHERE archived_at IS NULL;

-- Composite Index: Common query - active automations in workspace by trigger
CREATE INDEX IF NOT EXISTS idx_automation_workspace_status
    ON automations(workspace_id, status)
    WHERE archived_at IS NULL;

-- Index: List automations by creation date (for sorted queries)
CREATE INDEX IF NOT EXISTS idx_automation_created_at
    ON automations(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. CONSTRAINT: Unique automation name per workspace
-- ───────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_workspace_name_unique
    ON automations(workspace_id, name)
    WHERE archived_at IS NULL;

COMMIT;
