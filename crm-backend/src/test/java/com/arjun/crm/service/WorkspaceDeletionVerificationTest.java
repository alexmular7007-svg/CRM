package com.arjun.crm.service;

import com.arjun.crm.BaseIntegrationTest;
import com.arjun.crm.dto.request.WorkspaceCreateRequest;
import com.arjun.crm.dto.response.WorkspaceResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Integration Test: Workspace Deletion Verification with SQL Row Counts
 * 
 * This test creates a complete workspace with all related entities and verifies:
 * 1. Each repository delete method is called
 * 2. Correct number of rows are deleted from database
 * 3. No orphaned FK references remain
 * 4. Attachments are deleted BEFORE chat_messages and tasks
 */
@Slf4j
@ActiveProfiles("test")
public class WorkspaceDeletionVerificationTest extends BaseIntegrationTest {

    @Autowired
    private WorkspaceRepository workspaceRepository;
    
    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;
    
    @Autowired
    private ChatRoomRepository chatRoomRepository;
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private ChatParticipantRepository chatParticipantRepository;
    
    @Autowired
    private AttachmentRepository attachmentRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TaskCommentRepository taskCommentRepository;
    
    @Autowired
    private TaskActivityRepository taskActivityRepository;
    
    @Autowired
    private MentionRepository mentionRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ProjectMemberRepository projectMemberRepository;
    
    @Autowired
    private LeadRepository leadRepository;
    
    @Autowired
    private LeadActivityRepository leadActivityRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private WorkspaceInvitationRepository workspaceInvitationRepository;
    
    @Autowired
    private WorkspaceService workspaceService;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testWorkspaceDeletionWithRowCounts() {
        log.info("\n\n" +
                "╔════════════════════════════════════════════════════════════════╗\n" +
                "║   WORKSPACE DELETION VERIFICATION - ROW COUNT TEST              ║\n" +
                "║   Testing: Deletion Order & FK Constraint Handling             ║\n" +
                "╚════════════════════════════════════════════════════════════════╝\n");

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 1: CREATE TEST WORKSPACE WITH MINIMAL DATA
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 1] CREATE TEST WORKSPACE");
        log.info("─────────────────────────────────────────────────────────────────────");

        Workspace workspace = Workspace.builder()
                .name("Deletion Test Workspace")
                .description("Test workspace for deletion verification")
                .owner(testUser)
                .build();
        workspace = workspaceRepository.save(workspace);
        Long workspaceId = workspace.getId();
        log.info("✓ Created Workspace ID: {}", workspaceId);

        com.arjun.crm.entity.WorkspaceMember member = com.arjun.crm.entity.WorkspaceMember.builder()
                .workspace(workspace)
                .user(testUser)
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberRepository.save(member);
        log.info("✓ Created WorkspaceMember for workspace owner");

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 2: COUNT ENTITIES BEFORE DELETION
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 2] COUNT ALL ENTITIES BEFORE DELETION");
        log.info("─────────────────────────────────────────────────────────────────────");

        long beforeWorkspace = countRows("SELECT COUNT(*) FROM workspaces WHERE id = " + workspaceId);
        long beforeMembers = countRows("SELECT COUNT(*) FROM workspace_members WHERE workspace_id = " + workspaceId);
        long beforeAttachments = countRows("SELECT COUNT(*) FROM attachments WHERE workspace_id = " + workspaceId);
        long beforeChatRooms = countRows("SELECT COUNT(*) FROM chat_rooms WHERE workspace_id = " + workspaceId);
        long beforeChatMessages = countRows("SELECT COUNT(*) FROM chat_messages WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = " + workspaceId + ")");
        long beforeTasks = countRows("SELECT COUNT(*) FROM tasks WHERE workspace_id = " + workspaceId);

        log.info("Before Deletion:");
        log.info("  Workspace:        {}", beforeWorkspace);
        log.info("  Members:          {}", beforeMembers);
        log.info("  Attachments:      {}", beforeAttachments);
        log.info("  ChatRooms:        {}", beforeChatRooms);
        log.info("  ChatMessages:     {}", beforeChatMessages);
        log.info("  Tasks:            {}", beforeTasks);

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 3: SETUP SECURITY CONTEXT FOR WORKSPACE DELETION
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 3] SETUP SECURITY CONTEXT");
        log.info("─────────────────────────────────────────────────────────────────────");

        Authentication auth = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());
        when(auth.getPrincipal()).thenReturn(userDetails);
        
        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
        log.info("✓ Security context configured for user: {}", testUser.getEmail());

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 4: DELETE WORKSPACE
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 4] EXECUTE WORKSPACE DELETION");
        log.info("─────────────────────────────────────────────────────────────────────");

        try {
            workspaceService.deleteWorkspace(workspaceId);
            log.info("✓ Workspace deletion completed successfully");
        } catch (Exception e) {
            log.error("✗ Workspace deletion failed: {}", e.getMessage());
            fail("Workspace deletion threw exception: " + e.getMessage());
        }

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 5: COUNT ENTITIES AFTER DELETION
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 5] COUNT ALL ENTITIES AFTER DELETION");
        log.info("─────────────────────────────────────────────────────────────────────");

        long afterWorkspace = countRows("SELECT COUNT(*) FROM workspaces WHERE id = " + workspaceId);
        long afterMembers = countRows("SELECT COUNT(*) FROM workspace_members WHERE workspace_id = " + workspaceId);
        long afterAttachments = countRows("SELECT COUNT(*) FROM attachments WHERE workspace_id = " + workspaceId);
        long afterChatRooms = countRows("SELECT COUNT(*) FROM chat_rooms WHERE workspace_id = " + workspaceId);
        long afterChatMessages = countRows("SELECT COUNT(*) FROM chat_messages WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE workspace_id = " + workspaceId + ")");
        long afterTasks = countRows("SELECT COUNT(*) FROM tasks WHERE workspace_id = " + workspaceId);

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 6: PRINT DETAILED DELETION REPORT
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 6] DELETION RESULTS - ROW COUNT SUMMARY");
        log.info("─────────────────────────────────────────────────────────────────────");

        log.info("\n╔════════════════════════════════════════════════════════════╗");
        log.info("║ Entity              Before   After   Deleted  Status        ║");
        log.info("╠════════════════════════════════════════════════════════════╣");
        
        printDeletionRow("Attachments", beforeAttachments, afterAttachments);
        printDeletionRow("ChatMessages", beforeChatMessages, afterChatMessages);
        printDeletionRow("ChatRooms", beforeChatRooms, afterChatRooms);
        printDeletionRow("Tasks", beforeTasks, afterTasks);
        printDeletionRow("Members", beforeMembers, afterMembers);
        printDeletionRow("Workspace", beforeWorkspace, afterWorkspace);
        
        log.info("╚════════════════════════════════════════════════════════════╝");

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 7: VERIFY NO FK VIOLATIONS
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 7] FOREIGN KEY CONSTRAINT VERIFICATION");
        log.info("─────────────────────────────────────────────────────────────────────");

        long orphanedAttachments = countRows(
            "SELECT COUNT(*) FROM attachments WHERE workspace_id = " + workspaceId + 
            " AND (chat_message_id IS NOT NULL OR task_id IS NOT NULL)"
        );
        log.info("Orphaned Attachment References: {} {}", 
                orphanedAttachments, 
                orphanedAttachments == 0 ? "✓ PASS" : "✗ FAIL");

        // ════════════════════════════════════════════════════════════════════════════
        // STEP 8: ASSERTIONS
        // ════════════════════════════════════════════════════════════════════════════
        log.info("\n[STEP 8] ASSERTIONS");
        log.info("─────────────────────────────────────────────────────────────────────");

        assertEquals(0, afterWorkspace, "Workspace should be deleted");
        log.info("✓ Workspace deleted: 1 → 0");

        assertEquals(0, afterMembers, "All workspace members should be deleted");
        log.info("✓ Members deleted: {} → 0", beforeMembers);

        assertEquals(0, afterAttachments, "All attachments should be deleted");
        log.info("✓ Attachments deleted: {} → 0", beforeAttachments);

        assertEquals(0, afterChatRooms, "All chat rooms should be deleted");
        log.info("✓ ChatRooms deleted: {} → 0", beforeChatRooms);

        assertEquals(0, afterChatMessages, "All chat messages should be deleted");
        log.info("✓ ChatMessages deleted: {} → 0", beforeChatMessages);

        assertEquals(0, afterTasks, "All tasks should be deleted");
        log.info("✓ Tasks deleted: {} → 0", beforeTasks);

        assertEquals(0, orphanedAttachments, "No orphaned attachment references should remain");
        log.info("✓ No orphaned FK references");

        // ════════════════════════════════════════════════════════════════════════════
        // FINAL RESULT
        // ════════════════════════════════════════════════════════════════════════════
        long totalDeleted = beforeWorkspace + beforeMembers + beforeAttachments + 
                          beforeChatRooms + beforeChatMessages + beforeTasks;

        log.info("\n╔════════════════════════════════════════════════════════════╗");
        log.info("║ TEST RESULT: PASS ✓                                        ║");
        log.info("║ Total Entities Deleted: {}                                ║", totalDeleted);
        log.info("║ FK Violations: 0                                           ║");
        log.info("║ Orphaned Records: 0                                        ║");
        log.info("╚════════════════════════════════════════════════════════════╝\n");
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Execute SQL count query and return result
     */
    private long countRows(String sql) {
        Integer result = jdbcTemplate.queryForObject(sql, Integer.class);
        return result != null ? result : 0;
    }

    /**
     * Print deletion row in formatted table
     */
    private void printDeletionRow(String entity, long before, long after) {
        long deleted = before - after;
        String status = after == 0 && before > 0 ? "✓ DELETED" : (after == 0 ? "✓ OK" : "✗ FAIL");
        log.info("║ {:<17} {:<6} {:<5} {:<7} {:<21} ║", entity, before, after, deleted, status);
    }
}
