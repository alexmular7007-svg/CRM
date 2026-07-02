-- Fix for InvalidDataAccessApiUsageException: No enum constant com.arjun.crm.enums.ReferenceType.CHAT
-- Problem: Database has notifications with reference_type='CHAT' but Java enum only has CHAT_ROOM
-- Solution: Delete or update these records

-- Option 1: Delete all notifications with invalid reference_type='CHAT'
DELETE FROM notifications WHERE reference_type = 'CHAT';

-- Option 2: Update them to CHAT_ROOM (if you want to preserve them)
-- UPDATE notifications SET reference_type = 'CHAT_ROOM' WHERE reference_type = 'CHAT';

-- Verify the fix
SELECT reference_type, COUNT(*) FROM notifications GROUP BY reference_type;
