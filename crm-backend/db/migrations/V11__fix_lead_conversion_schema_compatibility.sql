-- ═══════════════════════════════════════════════════════════════════════════
-- HOTFIX: Add missing Feature #1 columns for backward compatibility
-- This migration safely adds columns without breaking existing data
-- Idempotent: Safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Create Clients Table (if it doesn't exist)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    source_lead_id BIGINT UNIQUE,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_client_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_source_lead FOREIGN KEY (source_lead_id)
        REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_client_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Add missing columns to leads table
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS converted_project_id BIGINT,
ADD COLUMN IF NOT EXISTS converted_client_id BIGINT;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Add missing columns to projects table
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS source_lead_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS client_id BIGINT;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Add foreign key constraints (if not already present)
-- ───────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    -- Add FK from leads to projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_lead_converted_project') THEN
        ALTER TABLE leads
        ADD CONSTRAINT fk_lead_converted_project FOREIGN KEY (converted_project_id)
            REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
    
    -- Add FK from leads to clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_lead_converted_client') THEN
        ALTER TABLE leads
        ADD CONSTRAINT fk_lead_converted_client FOREIGN KEY (converted_client_id)
            REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
    
    -- Add FK from projects to leads
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_project_source_lead') THEN
        ALTER TABLE projects
        ADD CONSTRAINT fk_project_source_lead FOREIGN KEY (source_lead_id)
            REFERENCES leads(id) ON DELETE SET NULL;
    END IF;
    
    -- Add FK from projects to clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_project_client') THEN
        ALTER TABLE projects
        ADD CONSTRAINT fk_project_client FOREIGN KEY (client_id)
            REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Create indexes for performance
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id ON clients (workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_source_lead_id ON clients (source_lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at);

CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads (converted);
CREATE INDEX IF NOT EXISTS idx_leads_converted_project_id ON leads (converted_project_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted_client_id ON leads (converted_client_id);

CREATE INDEX IF NOT EXISTS idx_projects_source_lead_id ON projects (source_lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration complete: All Feature #1 columns and constraints are now in place
-- Existing leads are backward compatible (converted = FALSE by default)
-- ═══════════════════════════════════════════════════════════════════════════
