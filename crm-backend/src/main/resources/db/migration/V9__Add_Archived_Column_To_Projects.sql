-- Add archived column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Create index on archived for filtering
ALTER TABLE projects ADD INDEX IF NOT EXISTS idx_projects_archived (archived);
