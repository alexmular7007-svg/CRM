package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.WorkspaceCreateRequest;
import com.arjun.crm.dto.request.WorkspaceUpdateRequest;
import com.arjun.crm.dto.response.WorkspaceResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    
    // Additional repositories for cascade deletion
    private final TaskRepository taskRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final TaskWatcherRepository taskWatcherRepository;
    private final MentionRepository mentionRepository;
    private final LeadRepository leadRepository;
    private final LeadActivityRepository leadActivityRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final AttachmentRepository attachmentRepository;
    private final NotificationRepository notificationRepository;
    private final AIInsightSnapshotRepository aiInsightSnapshotRepository;
    private final WorkspaceInvitationRepository workspaceInvitationRepository;

    @Override
    @Transactional
    public WorkspaceResponse createWorkspace(WorkspaceCreateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Creating workspace '{}' for user: {}", request.getName(), currentUser.getEmail());

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(currentUser)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);
        
        // Auto-add the creator as a workspace member with OWNER role
        // This is crucial because access validation checks the WorkspaceMember table
        com.arjun.crm.entity.WorkspaceMember member = com.arjun.crm.entity.WorkspaceMember.builder()
                .workspace(savedWorkspace)
                .user(currentUser)
                .role(com.arjun.crm.enums.WorkspaceRole.OWNER)
                .build();
        workspaceMemberRepository.save(member);

        log.info("Workspace created successfully with ID: {}", savedWorkspace.getId());

        return WorkspaceResponse.fromEntity(savedWorkspace);
    }

    @Override
    @Transactional
    public WorkspaceResponse updateWorkspace(Long workspaceId, WorkspaceUpdateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Updating workspace ID: {} by user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Only owner can update workspace
        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only workspace owner can update workspace details");
        }

        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());

        Workspace updatedWorkspace = workspaceRepository.save(workspace);
        log.info("Workspace updated successfully: {}", workspaceId);

        return WorkspaceResponse.fromEntity(updatedWorkspace);
    }

    @Override
    @Transactional
    public void deleteWorkspace(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        log.info("Deleting workspace ID: {} by user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Only owner can delete workspace
        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only workspace owner can delete workspace");
        }

        // Comprehensive cascade deletion in CORRECT dependency order
        // This prevents foreign key constraint violations by deleting children before parents
        // 
        // CRITICAL FK CONSTRAINT ANALYSIS:
        // - attachments.chat_message_id (FK) -> chat_messages.id
        // - attachments.task_id (FK) -> tasks.id
        // - mentions.comment_id (FK) -> task_comments.id
        // - task_comments.task_id (FK) -> tasks.id
        // 
        // REQUIRED DELETION ORDER (children before parents):
        // 1. Attachments (references chat_messages and tasks)
        // 2. Mentions (references task_comments)
        // 3. Task-related data (comments, activities, watchers)
        // 4. Tasks (parent of task attachments and comments)
        // 5. Lead-related data
        // 6. Chat-related data (messages reference attachments - must delete attachments first)
        // 7. Projects and project members
        // 8. Workspace members and invitations
        // 9. Workspace itself
        
        log.info("Starting cascade delete for workspace ID: {}", workspaceId);
        
        try {
            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 1: DELETE ALL ATTACHMENTS FIRST (Leaf nodes with FKs to multiple parents)
            // ═══════════════════════════════════════════════════════════════════════════
            // REASON: Attachments table has FKs to both chat_messages and tasks
            // If we delete chat_messages or tasks first, orphaned attachment records will violate FK constraints
            
            int deletedAttachments = attachmentRepository.deleteAllByWorkspaceId(workspaceId);
            log.info("Deleted {} attachments (chat + task)", deletedAttachments);
            
            // Also delete task attachments (separate entity in task_attachments table)
            int deletedTaskAttachments = taskAttachmentRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} task attachment metadata records", deletedTaskAttachments);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 2: DELETE TASK-RELATED DATA (Leaf → Parent)
            // ═══════════════════════════════════════════════════════════════════════════
            // REASON: Task comments reference task, mentions reference task comments
            // Must delete in order: Mentions → TaskComments → TaskActivities → TaskWatchers → Tasks
            
            int deletedMentions = mentionRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} mentions", deletedMentions);
            
            int deletedComments = taskCommentRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} task comments", deletedComments);
            
            int deletedActivities = taskActivityRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} task activities", deletedActivities);
            
            int deletedWatchers = taskWatcherRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} task watchers", deletedWatchers);
            
            int deletedTasks = taskRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} tasks", deletedTasks);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 3: DELETE LEAD-RELATED DATA (Leaf → Parent)
            // ═══════════════════════════════════════════════════════════════════════════
            
            int deletedLeadActivities = leadActivityRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} lead activities", deletedLeadActivities);
            
            int deletedLeads = leadRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} leads", deletedLeads);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 4: DELETE CHAT-RELATED DATA (Leaf → Parent)
            // ═══════════════════════════════════════════════════════════════════════════
            // REASON: ChatParticipants and ChatMessages reference ChatRoom
            // All attachments already deleted in Phase 1, so chat message deletion won't violate FK
            
            int deletedChatParticipants = chatParticipantRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} chat participants", deletedChatParticipants);
            
            int deletedChatMessages = chatMessageRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} chat messages", deletedChatMessages);
            
            int deletedChatRooms = chatRoomRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} chat rooms", deletedChatRooms);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 5: DELETE PROJECT-RELATED DATA (Leaf → Parent)
            // ═══════════════════════════════════════════════════════════════════════════
            
            int deletedProjectMembers = projectMemberRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} project members", deletedProjectMembers);
            
            int deletedProjects = projectRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} projects", deletedProjects);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 6: DELETE WORKSPACE METADATA & ANALYTICS
            // ═══════════════════════════════════════════════════════════════════════════
            
            int deletedAIInsights = aiInsightSnapshotRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} AI insight snapshots", deletedAIInsights);
            
            int deletedNotifications = notificationRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} notifications", deletedNotifications);
            
            int deletedInvitations = workspaceInvitationRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} workspace invitations", deletedInvitations);

            int deletedMembers = workspaceMemberRepository.deleteByWorkspaceId(workspaceId);
            log.info("Deleted {} workspace members", deletedMembers);

            // ═══════════════════════════════════════════════════════════════════════════
            // PHASE 7: DELETE ROOT ENTITY (Workspace)
            // ═══════════════════════════════════════════════════════════════════════════
            // At this point, all child entities have been deleted
            // Workspace has no remaining FK references
            
            workspaceRepository.delete(workspace);
            log.info("✅ Workspace deleted successfully: workspaceId={}, " +
                    "attachments={}, taskAttachments={}, mentions={}, taskComments={}, " +
                    "taskActivities={}, taskWatchers={}, tasks={}, leads={}, leadActivities={}, " +
                    "chatParticipants={}, chatMessages={}, chatRooms={}, projects={}, projectMembers={}, " +
                    "aiInsights={}, notifications={}, invitations={}, members={}",
                    workspaceId, deletedAttachments, deletedTaskAttachments, deletedMentions,
                    deletedComments, deletedActivities, deletedWatchers, deletedTasks,
                    deletedLeads, deletedLeadActivities, deletedChatParticipants, deletedChatMessages,
                    deletedChatRooms, deletedProjects, deletedProjectMembers, deletedAIInsights,
                    deletedNotifications, deletedInvitations, deletedMembers);
            
        } catch (org.hibernate.exception.ConstraintViolationException e) {
            log.error("❌ Database constraint violation during workspace deletion for workspace ID: {}", workspaceId, e);
            log.error("Constraint Name: {}, SQL State: {}", e.getConstraintName(), e.getSQLState());
            throw new RuntimeException("Cannot delete workspace: Constraint violation - " + e.getConstraintName(), e);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("❌ Data integrity violation during workspace deletion for workspace ID: {}", workspaceId, e);
            log.error("Root Cause: {}", e.getRootCause().getMessage(), e);
            throw new RuntimeException("Cannot delete workspace: Data integrity violation", e);
        } catch (org.hibernate.LazyInitializationException e) {
            log.error("❌ Lazy initialization error during workspace deletion for workspace ID: {}", workspaceId, e);
            log.error("This indicates an entity relationship was accessed outside transaction scope");
            throw new RuntimeException("Cannot delete workspace: Entity relationship error", e);
        } catch (Exception e) {
            log.error("❌ Unexpected error during workspace deletion for workspace ID: {}", workspaceId);
            log.error("Exception Type: {}", e.getClass().getName());
            log.error("Exception Message: {}", e.getMessage());
            log.error("Full Stack Trace:", e);
            throw new RuntimeException("Failed to delete workspace: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspace(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching workspace ID: {} for user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if user has access (owner or member)
        // Use repository method instead of lazy-loaded collection to ensure accuracy
        boolean isOwner = workspace.getOwner().getId().equals(currentUser.getId());
        boolean isMember = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId());
        
        if (!isOwner && !isMember) {
            throw new AccessDeniedException("You don't have access to this workspace");
        }

        return WorkspaceResponse.fromEntity(workspace);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkspaceResponse> listUserWorkspaces(Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Listing workspaces for user: {}", currentUser.getEmail());

        Page<Workspace> workspaces = workspaceRepository
                .findAllByUserIdAsOwnerOrMember(currentUser.getId(), pageable);

        return workspaces.map(workspace -> buildWorkspaceResponse(workspace, currentUser));
    }

    /**
     * Build workspace response with current user's role
     */
    private WorkspaceResponse buildWorkspaceResponse(Workspace workspace, User currentUser) {
        WorkspaceResponse response = WorkspaceResponse.fromEntity(workspace);
        
        // Determine user's role in this workspace
        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            response.setUserRole(com.arjun.crm.enums.WorkspaceRole.OWNER);
        } else {
            // Look up role from WorkspaceMember table
            workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), currentUser.getId())
                    .ifPresent(member -> response.setUserRole(member.getRole()));
        }
        
        return response;
    }

    /**
     * Get authenticated user from security context
     */
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
