-- ═══════════════════════════════════════════════════════════════════════════
-- WORKSPACE DELETION VERIFICATION SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════
-- This script verifies that workspace deletion properly removes all child entities
-- and checks for foreign key violations.
--
-- USAGE:
-- 1. Run this BEFORE workspace deletion to establish baseline
-- 2. Delete a workspace via API
-- 3. Run this script AFTER deletion to verify cleanup
-- ═══════════════════════════════════════════════════════════════════════════

-- Declare variables for test workspace ID
-- Adjust WORKSPACE_ID below to the workspace being tested
\set WORKSPACE_ID 1

\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'WORKSPACE DELETION VERIFICATION'
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo ''

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 1: ATTACHMENTS DELETED BEFORE CHAT/TASK ENTITIES
-- ════════════════════════════════════════════════════════════════════════════
\echo 'PHASE 1: ATTACHMENTS'
\echo '════════════════════════════════════════════════════════════════════════════'

SELECT 
    'Total Attachments in workspace' AS check_point,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM attachments 
WHERE workspace_id = :WORKSPACE_ID;

\echo ''
\echo 'Checking for orphaned attachments (should be 0):'
SELECT 
    'Attachments with NULL chat_message_id AND NULL task_id' AS orphan_check,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL - ORPHAN RECORDS EXIST' END AS status
FROM attachments 
WHERE workspace_id = :WORKSPACE_ID 
    AND chat_message_id IS NULL 
    AND task_id IS NULL;

\echo ''
\echo 'Verification: Delete query used'
\echo 'DELETE FROM attachments WHERE workspace_id = :WORKSPACE_ID'
\echo 'Expected rows deleted: ALL attachment rows'
\echo ''

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 2: TASK-RELATED DATA DELETED IN CORRECT ORDER
-- ════════════════════════════════════════════════════════════════════════════
\echo 'PHASE 2: TASK-RELATED DATA'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
\echo 'Delete order for Phase 2:'
\echo '  1. Mentions (references task_comments)'
\echo '  2. TaskComments (references tasks)'
\echo '  3. TaskActivities'
\echo '  4. TaskWatchers'
\echo '  5. Tasks'
\echo ''

SELECT 
    'Mentions' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM mentions m
WHERE m.comment_id IN (
    SELECT id FROM task_comments WHERE task_id IN (
        SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID
    )
);

\echo ''
SELECT 
    'TaskComments' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM task_comments 
WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'TaskActivities' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM task_activities
WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'TaskWatchers' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM task_watchers
WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'Tasks' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM tasks
WHERE workspace_id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 3: LEAD-RELATED DATA DELETED
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'PHASE 3: LEAD-RELATED DATA'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
SELECT 
    'LeadActivities' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM lead_activities
WHERE lead_id IN (SELECT id FROM leads WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'Leads' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM leads
WHERE workspace_id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 4: CHAT-RELATED DATA DELETED (Must be after attachments)
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'PHASE 4: CHAT-RELATED DATA'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
\echo 'Delete order for Phase 4:'
\echo '  1. ChatParticipants'
\echo '  2. ChatMessages'
\echo '  3. ChatRooms'
\echo ''

SELECT 
    'ChatParticipants' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM chat_participants
WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'ChatMessages' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM chat_messages
WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'ChatRooms' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM chat_rooms
WHERE workspace_id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 5: PROJECT-RELATED DATA DELETED
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'PHASE 5: PROJECT-RELATED DATA'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
SELECT 
    'ProjectMembers' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM project_members
WHERE project_id IN (SELECT id FROM projects WHERE workspace_id = :WORKSPACE_ID);

\echo ''
SELECT 
    'Projects' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM projects
WHERE workspace_id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 6: WORKSPACE METADATA DELETED
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'PHASE 6: WORKSPACE METADATA'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
SELECT 
    'AIInsightSnapshots' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM ai_insight_snapshots
WHERE workspace_id = :WORKSPACE_ID;

\echo ''
SELECT 
    'Notifications' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM notifications
WHERE workspace_id = :WORKSPACE_ID;

\echo ''
SELECT 
    'WorkspaceInvitations' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM workspace_invitations
WHERE workspace_id = :WORKSPACE_ID;

\echo ''
SELECT 
    'WorkspaceMembers' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM workspace_members
WHERE workspace_id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY PHASE 7: ROOT WORKSPACE ENTITY DELETED
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'PHASE 7: WORKSPACE ROOT ENTITY'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
SELECT 
    'Workspaces' AS entity,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ DELETED' ELSE '✗ REMAIN' END AS status
FROM workspaces
WHERE id = :WORKSPACE_ID;

-- ════════════════════════════════════════════════════════════════════════════
-- CRITICAL FK CONSTRAINT CHECKS
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'CRITICAL FK CONSTRAINT VERIFICATION'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
\echo 'Checking for orphaned attachment references (should all be 0):'
\echo ''

SELECT 
    'Attachments with invalid chat_message_id refs' AS check_point,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL - FK VIOLATION' END AS status
FROM attachments a
WHERE a.chat_message_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.id = a.chat_message_id);

\echo ''
SELECT 
    'Attachments with invalid task_id refs' AS check_point,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL - FK VIOLATION' END AS status
FROM attachments a
WHERE a.task_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = a.task_id);

\echo ''
SELECT 
    'Mentions with invalid comment_id refs' AS check_point,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL - FK VIOLATION' END AS status
FROM mentions m
WHERE NOT EXISTS (SELECT 1 FROM task_comments tc WHERE tc.id = m.comment_id);

\echo ''
SELECT 
    'TaskComments with invalid task_id refs' AS check_point,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL - FK VIOLATION' END AS status
FROM task_comments tc
WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = tc.task_id);

-- ════════════════════════════════════════════════════════════════════════════
-- FINAL SUMMARY
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
\echo 'FINAL SUMMARY - Total remaining entities for workspace ID :WORKSPACE_ID:'
\echo '════════════════════════════════════════════════════════════════════════════'

\echo ''
SELECT 
    table_name,
    COUNT(*) as rows_count
FROM (
    SELECT 'attachments' as table_name FROM attachments WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'chat_messages' FROM chat_messages WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'chat_rooms' FROM chat_rooms WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'chat_participants' FROM chat_participants WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'tasks' FROM tasks WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'task_comments' FROM task_comments WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'mentions' FROM mentions WHERE comment_id IN (SELECT id FROM task_comments WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID))
    UNION ALL
    SELECT 'task_activities' FROM task_activities WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'leads' FROM leads WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'lead_activities' FROM lead_activities WHERE lead_id IN (SELECT id FROM leads WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'projects' FROM projects WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'project_members' FROM project_members WHERE project_id IN (SELECT id FROM projects WHERE workspace_id = :WORKSPACE_ID)
    UNION ALL
    SELECT 'notifications' FROM notifications WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'workspace_invitations' FROM workspace_invitations WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'workspace_members' FROM workspace_members WHERE workspace_id = :WORKSPACE_ID
    UNION ALL
    SELECT 'workspaces' FROM workspaces WHERE id = :WORKSPACE_ID
) counts
GROUP BY table_name
ORDER BY table_name;

\echo ''
\echo 'Expected result above: NO ROWS (all should be deleted)'
\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo 'VERIFICATION COMPLETE'
\echo '════════════════════════════════════════════════════════════════════════════'
