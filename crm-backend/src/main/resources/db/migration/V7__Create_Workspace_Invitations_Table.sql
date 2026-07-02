-- Create workspace_invitations table for invitation system
CREATE TABLE IF NOT EXISTS workspace_invitations (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    invited_by_id BIGINT NOT NULL,
    accepted_by_id BIGINT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_id) REFERENCES users(id),
    FOREIGN KEY (accepted_by_id) REFERENCES users(id),
    
    UNIQUE KEY uq_workspace_email (workspace_id, email),
    INDEX idx_invitation_token (token),
    INDEX idx_invitation_status (status),
    INDEX idx_invitation_expires_at (expires_at),
    INDEX idx_invitation_workspace_status (workspace_id, status)
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_workspace_invitations_timestamp
BEFORE UPDATE ON workspace_invitations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
