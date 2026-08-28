CREATE TABLE automations (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB,
    action_config JSONB,
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

CREATE INDEX idx_automation_workspace_id ON automations(workspace_id);
CREATE INDEX idx_automation_status ON automations(status);
CREATE INDEX idx_automation_trigger_type ON automations(trigger_type);
CREATE INDEX idx_automation_workspace_status ON automations(workspace_id, status);
CREATE INDEX idx_automation_created_at ON automations(created_at);
