-- Migration: Add actionUrl column to notifications table
-- Purpose: Support deep linking from notifications to related entities
-- Date: 2026-06-27

ALTER TABLE notifications
ADD COLUMN action_url VARCHAR(500) AFTER reference_type;

-- Add index for faster filtering by type
CREATE INDEX idx_recipient_type ON notifications(recipient_id, type);

-- Add comment for documentation
COMMENT ON COLUMN notifications.action_url IS 'Deep link URL for navigating to the related entity. e.g., /tasks/123, /projects/45/tasks, /chat/room/789';
