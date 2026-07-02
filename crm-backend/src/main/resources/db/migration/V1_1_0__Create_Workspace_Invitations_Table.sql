-- Create workspace_invitations table
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
  UNIQUE KEY uq_workspace_email (workspace_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_status ON workspace_invitations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_expires_at ON workspace_invitations(expires_at);
