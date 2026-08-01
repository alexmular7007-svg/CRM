-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE #3: Email Campaigns Schema Migration
-- Initializes the complete email campaign system
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- PHASE: Foundation (Database + Domain Foundation)
-- TABLES CREATED: 6 (email_campaigns, email_templates, email_campaign_recipients, 
--                    email_campaign_history, email_campaign_segments, email_campaign_analytics_snapshot)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. CREATE email_templates TABLE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
    subject_template VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    plain_text_content TEXT,
    variables VARCHAR[] DEFAULT '{}',
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_template_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_template_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT email_templates_workspace_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_template_workspace_id ON email_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_template_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_template_is_public ON email_templates(is_public);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. CREATE email_campaigns TABLE (Master table)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    subject_variables VARCHAR[] DEFAULT '{}',
    template_id BIGINT,
    content_type VARCHAR(50) NOT NULL DEFAULT 'TEMPLATE',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    send_started_at TIMESTAMP WITH TIME ZONE,
    send_completed_at TIMESTAMP WITH TIME ZONE,
    total_recipients BIGINT DEFAULT 0,
    segment_filter JSONB DEFAULT '{}',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_campaign_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_template FOREIGN KEY (template_id)
        REFERENCES email_templates(id) ON DELETE SET NULL,
    CONSTRAINT fk_campaign_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT email_campaigns_workspace_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_campaign_workspace_id ON email_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_workspace_status ON email_campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_scheduled_at ON email_campaigns(scheduled_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. CREATE email_campaign_recipients TABLE (Pivot + Status tracking)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    lead_id BIGINT,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_company VARCHAR(255),
    recipient_variables JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'PENDING',
    bounce_type VARCHAR(50),
    delivery_attempts INT DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    first_clicked_at TIMESTAMP WITH TIME ZONE,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    click_count INT DEFAULT 0,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    provider_message_id VARCHAR(255),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_recipient_campaign FOREIGN KEY (campaign_id)
        REFERENCES email_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipient_lead FOREIGN KEY (lead_id)
        REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT email_campaign_recipients_campaign_email_unique UNIQUE (campaign_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_recipient_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipient_status ON email_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_recipient_email ON email_campaign_recipients(recipient_email);
CREATE INDEX IF NOT EXISTS idx_recipient_opened_at ON email_campaign_recipients(opened_at);
CREATE INDEX IF NOT EXISTS idx_recipient_campaign_status ON email_campaign_recipients(campaign_id, status);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. CREATE email_campaign_history TABLE (Append-only audit log)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaign_history (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    recipient_id BIGINT,
    recipient_email VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    link_url TEXT,
    bounce_reason VARCHAR(255),
    provider_event_id VARCHAR(255),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_history_campaign FOREIGN KEY (campaign_id)
        REFERENCES email_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_recipient FOREIGN KEY (recipient_id)
        REFERENCES email_campaign_recipients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_history_campaign_id ON email_campaign_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_history_event_type ON email_campaign_history(event_type);
CREATE INDEX IF NOT EXISTS idx_history_recipient_email ON email_campaign_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_history_occurred_at ON email_campaign_history(occurred_at);
CREATE INDEX IF NOT EXISTS idx_history_campaign_event ON email_campaign_history(campaign_id, event_type, occurred_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. CREATE email_campaign_segments TABLE (Saved audience filters)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaign_segments (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_criteria JSONB NOT NULL,
    lead_count BIGINT DEFAULT 0,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_segment_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_segment_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT email_campaign_segments_workspace_name_unique UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_segment_workspace_id ON email_campaign_segments(workspace_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. CREATE email_campaign_analytics_snapshot TABLE (Pre-computed aggregates)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaign_analytics_snapshot (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL,
    total_sent BIGINT DEFAULT 0,
    total_delivered BIGINT DEFAULT 0,
    total_opened BIGINT DEFAULT 0,
    total_clicked BIGINT DEFAULT 0,
    total_bounced BIGINT DEFAULT 0,
    total_failed BIGINT DEFAULT 0,
    total_unsubscribed BIGINT DEFAULT 0,
    total_replies BIGINT DEFAULT 0,
    unique_opens BIGINT DEFAULT 0,
    unique_clicks BIGINT DEFAULT 0,
    delivery_rate_percent DECIMAL(5, 2) DEFAULT 0,
    open_rate_percent DECIMAL(5, 2) DEFAULT 0,
    click_rate_percent DECIMAL(5, 2) DEFAULT 0,
    bounce_rate_percent DECIMAL(5, 2) DEFAULT 0,
    reply_rate_percent DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_analytics_campaign FOREIGN KEY (campaign_id)
        REFERENCES email_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON email_campaign_analytics_snapshot(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_at ON email_campaign_analytics_snapshot(snapshot_at);

COMMIT;
