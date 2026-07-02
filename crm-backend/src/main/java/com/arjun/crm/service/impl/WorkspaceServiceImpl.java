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
    private final LeadRepository leadRepository;
    private final LeadActivityRepository leadActivityRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
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

        // Comprehensive cascade deletion in correct order
        // This prevents foreign key constraint violations
        log.info("Starting cascade delete for workspace ID: {}", workspaceId);
        
        try {
            // 1. Delete all task-related data (leaf nodes first)
            int deletedAttachments = taskAttachmentRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} task attachments", deletedAttachments);
            
            int deletedWatchers = taskWatcherRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} task watchers", deletedWatchers);
            
            int deletedComments = taskCommentRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} task comments", deletedComments);
            
            int deletedActivities = taskActivityRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} task activities", deletedActivities);
            
            int deletedTasks = taskRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} tasks", deletedTasks);

            // 2. Delete all lead-related data
            int deletedLeadActivities = leadActivityRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} lead activities", deletedLeadActivities);
            
            int deletedLeads = leadRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} leads", deletedLeads);

            // 3. Delete all chat-related data
            int deletedChatMessages = chatMessageRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} chat messages", deletedChatMessages);
            
            int deletedChatParticipants = chatParticipantRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} chat participants", deletedChatParticipants);
            
            int deletedChatRooms = chatRoomRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} chat rooms", deletedChatRooms);

            // 4. Delete all project-related data
            int deletedProjectMembers = projectMemberRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} project members", deletedProjectMembers);
            
            int deletedProjects = projectRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} projects", deletedProjects);

            // 5. Delete analytics and AI insights
            int deletedAIInsights = aiInsightSnapshotRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} AI insights", deletedAIInsights);
            
            int deletedNotifications = notificationRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} notifications", deletedNotifications);

            // 6. Delete all invitations (NEW - was missing)
            int deletedInvitations = workspaceInvitationRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} workspace invitations", deletedInvitations);

            // 7. Delete workspace members
            int deletedMembers = workspaceMemberRepository.deleteByWorkspaceId(workspaceId);
            log.debug("Deleted {} workspace members", deletedMembers);

            // 8. Finally, delete the workspace itself
            workspaceRepository.delete(workspace);
            log.info("Workspace deleted successfully: {} (attachments: {}, comments: {}, tasks: {}, leads: {}, projects: {}, invitations: {}, members: {})", 
                    workspaceId, deletedAttachments, deletedComments, deletedTasks, deletedLeads, deletedProjects, deletedInvitations, deletedMembers);
            
        } catch (Exception e) {
            log.error("Error during workspace deletion for workspace ID: {}", workspaceId, e);
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

        return workspaces.map(WorkspaceResponse::fromEntity);
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
