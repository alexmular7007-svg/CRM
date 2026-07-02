-- ═════════════════════════════════════════════════════════════════════════════
-- V10: Add Soft Delete Support to Workspace Members
-- Purpose: Enable soft delete to preserve audit trail when members are removed
-- ═════════════════════════════════════════════════════════════════════════════

-- Add deleted_at column for soft delete tracking
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for efficient queries filtering deleted members
CREATE INDEX IF NOT EXISTS idx_workspace_members_deleted 
ON workspace_members(workspace_id, deleted_at, status);

-- Comment for clarity
COMMENT ON COLUMN workspace_members.deleted_at IS 'Timestamp when member was removed. NULL = active member. Non-null = member has been removed.';
