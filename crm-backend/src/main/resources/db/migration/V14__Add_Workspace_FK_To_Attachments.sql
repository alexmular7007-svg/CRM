-- Migration V14: Add Workspace Foreign Key to Attachments
-- 
-- ROOT CAUSE FIX for workspace deletion bug:
-- Previous deletion query used complex OR condition with nested JOINs:
--   DELETE FROM Attachment a WHERE 
--   (a.chatMessage IS NOT NULL AND a.chatMessage.chatRoom.workspace.id = :workspaceId) OR 
--   (a.task IS NOT NULL AND a.task.workspace.id = :workspaceId)
--
-- This query could fail in Hibernate when translating complex DELETE statements.
-- The fix: Add workspace_id FK directly to attachments table for fast, simple deletion.
--
-- Changes:
-- 1. Add workspace_id column to attachments table
-- 2. Add FK constraint to workspaces table
-- 3. Backfill existing attachments with their workspace
-- 4. Update delete query to use simple: DELETE FROM attachments WHERE workspace_id = :workspaceId

-- Step 1: Add workspace_id column (nullable initially for backfill)
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS workspace_id BIGINT;

-- Step 2: Create index on workspace_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_attachments_workspace_id 
ON attachments (workspace_id);

-- Step 3: Backfill workspace_id for chat attachments
UPDATE attachments 
SET workspace_id = (
  SELECT cr.workspace_id 
  FROM chat_messages cm
  JOIN chat_rooms cr ON cm.chat_room_id = cr.id
  WHERE cm.id = attachments.chat_message_id
)
WHERE chat_message_id IS NOT NULL AND workspace_id IS NULL;

-- Step 4: Backfill workspace_id for task attachments
UPDATE attachments 
SET workspace_id = (
  SELECT t.workspace_id 
  FROM tasks t
  WHERE t.id = attachments.task_id
)
WHERE task_id IS NOT NULL AND workspace_id IS NULL;

-- Step 5: Now add the NOT NULL constraint and FK
ALTER TABLE attachments 
ALTER COLUMN workspace_id SET NOT NULL,
ADD CONSTRAINT fk_attachment_workspace 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Document the change
COMMENT ON COLUMN attachments.workspace_id IS 'Workspace this attachment belongs to. Added for fast workspace-based deletion without complex JPQL queries.';
