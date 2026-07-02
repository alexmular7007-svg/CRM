package com.arjun.crm.security;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

/**
 * Centralized service for workspace authorization and access control.
 * 
 * SECURITY PRINCIPLE: Never trust workspaceId from frontend.
 * Always validate against JWT + workspace_member table.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceAuthorizationService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    /**
     * Get current authenticated user from security context
     */
    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    /**
     * Validate user's access to workspace.
     * Returns WorkspaceMember if user has access, throws 403 otherwise.
     * 
     * @param workspaceId The workspace to validate access for
     * @return WorkspaceMember record if user is member or owner
     * @throws AccessDeniedException if user has no access
     */
    public WorkspaceMember validateWorkspaceAccess(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // If user is the owner
        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            return WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.OWNER)
                    .build();
        }

        // Check if user is a member
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .orElseThrow(() -> new AccessDeniedException("User does not have access to this workspace"));

        log.debug("User {} has {} access to workspace {}", currentUser.getId(), member.getRole(), workspaceId);
        return member;
    }

    /**
     * Validate user has specific role(s) in workspace.
     * Throws 403 if user doesn't have required role.
     * 
     * @param member The workspace member to validate
     * @param requiredRoles Roles that are allowed (OWNER or ADMIN)
     * @throws AccessDeniedException if user doesn't have required role
     */
    public void validateRole(WorkspaceMember member, WorkspaceRole... requiredRoles) {
        for (WorkspaceRole role : requiredRoles) {
            if (member.getRole() == role) {
                log.debug("Role validation passed: {} has {}", member.getUser().getId(), role);
                return;
            }
        }
        throw new AccessDeniedException("User does not have required permissions for this action");
    }

    /**
     * Validate user is OWNER or ADMIN of workspace.
     * 
     * @param member The workspace member to validate
     * @throws AccessDeniedException if user is not OWNER or ADMIN
     */
    public void validateOwnerOrAdmin(WorkspaceMember member) {
        validateRole(member, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    }

    /**
     * Validate user is OWNER of workspace.
     * 
     * @param member The workspace member to validate
     * @throws AccessDeniedException if user is not OWNER
     */
    public void validateOwner(WorkspaceMember member) {
        validateRole(member, WorkspaceRole.OWNER);
    }

    /**
     * Validate a resource (identified by its workspace) is accessible to user.
     * Used when retrieving resources that have workspace_id.
     * 
     * @param resourceWorkspaceId The workspace ID of the resource
     * @return WorkspaceMember if authorized
     * @throws AccessDeniedException if user doesn't have access
     */
    public WorkspaceMember validateResourceAccess(Long resourceWorkspaceId) {
        return validateWorkspaceAccess(resourceWorkspaceId);
    }

    /**
     * Validate user can assign a task/project to another user.
     * Both users must be in the same workspace.
     * 
     * @param workspaceId The workspace ID
     * @param assigneeId The ID of the user being assigned to
     * @throws AccessDeniedException if assignee not in same workspace
     */
    public void validateAssigneeInWorkspace(Long workspaceId, Long assigneeId) {
        boolean assigneeInWorkspace = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, assigneeId);
        
        if (!assigneeInWorkspace) {
            // Also check if assignee is the workspace owner
            Workspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            
            if (!workspace.getOwner().getId().equals(assigneeId)) {
                throw new AccessDeniedException("Cannot assign to user outside this workspace");
            }
        }
    }

    /**
     * Validate that both users share at least one common workspace.
     * Used for direct messaging to enforce workspace isolation.
     * 
     * SECURITY: Both users MUST belong to the same workspace.
     * Users can message each other only if they share a workspace.
     * 
     * @param currentUserId The ID of the current user
     * @param otherUserId The ID of the user to message
     * @throws AccessDeniedException if users don't share a workspace
     */
    public void validateUsersShareWorkspace(Long currentUserId, Long otherUserId) {
        // Find common workspaces
        // User is member if: 
        //   1. They are in workspace_member table with this workspace
        //   2. OR they are the workspace owner
        
        boolean usersShareWorkspace = workspaceMemberRepository.existsCommonWorkspace(currentUserId, otherUserId);
        
        if (!usersShareWorkspace) {
            log.warn("Users {} and {} do not share a common workspace", currentUserId, otherUserId);
            throw new AccessDeniedException("Cannot message users outside your workspaces");
        }
        
        log.debug("Users {} and {} share at least one common workspace", currentUserId, otherUserId);
    }
}
