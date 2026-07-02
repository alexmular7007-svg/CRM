-- Extend workspace_members table with invitation tracking fields
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS invited_by_id BIGINT;

-- Add foreign key for invited_by_id
ALTER TABLE workspace_members ADD CONSTRAINT FOREIGN KEY (invited_by_id) REFERENCES users(id) IF NOT EXISTS;

-- Add index on status for filtering active/pending members
ALTER TABLE workspace_members ADD INDEX IF NOT EXISTS idx_workspace_member_status (status);

-- Set all existing members to ACTIVE status if not already set
UPDATE workspace_members SET status = 'ACTIVE' WHERE status IS NULL;

-- Make status NOT NULL after ensuring all have a value
ALTER TABLE workspace_members MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
