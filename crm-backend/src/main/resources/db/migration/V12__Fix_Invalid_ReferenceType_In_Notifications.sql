-- Migration: Fix invalid CHAT reference_type values in notifications
-- Date: 2026-06-29
-- Purpose: Set reference_type to NULL for notifications with invalid 'CHAT' value
--          This fixes the enum deserialization error where ReferenceType doesn't have CHAT constant

-- Update all notifications with reference_type = 'CHAT' to NULL
UPDATE notifications 
SET reference_type = NULL 
WHERE reference_type = 'CHAT';

-- Verify the fix
-- SELECT COUNT(*) FROM notifications WHERE reference_type = 'CHAT';
