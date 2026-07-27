-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE #1: Lead → Client → Project Conversion
-- Migration to support converting WON leads to projects with clients
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Create Clients Table
-- ───────────────────────────────────────────────────────────────────────────
-- Represents business entities (companies/contacts) created from converted leads
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    
    -- Workspace isolation (required)
    workspace_id BIGINT NOT NULL,
    
    -- Company/business name (required)
    name VARCHAR(255) NOT NULL,
    
    -- Primary contact name
    contact_name VARCHAR(255),
    
    -- Primary contact email
    email VARCHAR(255),
    
    -- Primary contact phone
    phone VARCHAR(20),
    
    -- Source lead that was converted (one-to-one, nullable for future manual entry)
    source_lead_id BIGINT UNIQUE,
    
    -- User who created this client (required)
    created_by_id BIGINT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_client_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_source_lead FOREIGN KEY (source_lead_id)
        REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_client_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for common queries
CREATE INDEX idx_clients_workspace_id ON clients (workspace_id);
CREATE INDEX idx_clients_source_lead_id ON clients (source_lead_id);
CREATE INDEX idx_clients_created_at ON clients (created_at);

COMMENT ON TABLE clients IS 'Business entities/companies created from converted leads';
COMMENT ON COLUMN clients.source_lead_id IS 'Original lead that was converted to create this client (one-to-one)';
COMMENT ON COLUMN clients.name IS 'Company name (from Lead.company or Lead.name)';

-- ───────────────────────────────────────────────────────────────────────────
-- Extend Leads Table with Conversion Tracking
-- ───────────────────────────────────────────────────────────────────────────
-- Add columns to track lead conversion to projects

-- Check if column already exists before adding (for idempotency)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='leads' AND column_name='converted'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN converted BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN converted_project_id BIGINT,
        ADD COLUMN converted_client_id BIGINT;
        
        -- Add foreign key constraints
        ALTER TABLE leads
        ADD CONSTRAINT fk_lead_converted_project FOREIGN KEY (converted_project_id)
            REFERENCES projects(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_lead_converted_client FOREIGN KEY (converted_client_id)
            REFERENCES clients(id) ON DELETE SET NULL;
        
        -- Add indexes for conversion queries
        CREATE INDEX idx_leads_converted ON leads (converted);
        CREATE INDEX idx_leads_converted_project_id ON leads (converted_project_id);
        CREATE INDEX idx_leads_converted_client_id ON leads (converted_client_id);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Extend Projects Table with Source Lead & Client Link
-- ───────────────────────────────────────────────────────────────────────────
-- Add columns to link projects back to originating leads and clients

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='projects' AND column_name='source_lead_id'
    ) THEN
        ALTER TABLE projects
        ADD COLUMN source_lead_id BIGINT UNIQUE,
        ADD COLUMN client_id BIGINT;
        
        -- Add foreign key constraints (nullable, no cascading deletes)
        ALTER TABLE projects
        ADD CONSTRAINT fk_project_source_lead FOREIGN KEY (source_lead_id)
            REFERENCES leads(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_project_client FOREIGN KEY (client_id)
            REFERENCES clients(id) ON DELETE SET NULL;
        
        -- Add indexes for queries
        CREATE INDEX idx_projects_source_lead_id ON projects (source_lead_id);
        CREATE INDEX idx_projects_client_id ON projects (client_id);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Database-Level Idempotency Protection
-- ───────────────────────────────────────────────────────────────────────────
-- Prevent a single lead from creating multiple conversion records
-- 
-- Primary protection mechanisms:
-- 1. Pessimistic locking in application (PESSIMISTIC_WRITE on Lead)
-- 2. UNIQUE constraints on clients.source_lead_id and projects.source_lead_id
-- 3. Application-level check: if (lead.converted) throw ConflictException
--
-- These three mechanisms ensure exactly one Client and one Project per Lead:
-- - Pessimistic lock blocks concurrent conversions on same Lead
-- - UNIQUE constraints prevent database duplicate inserts
-- - Conversion state flag makes duplicate attempts immediately obvious

-- No trigger needed: pessimistic locking prevents the race condition entirely
-- UNIQUE constraints provide final defense-in-depth protection

-- ═══════════════════════════════════════════════════════════════════════════
-- End of Migration V10
-- ═══════════════════════════════════════════════════════════════════════════
