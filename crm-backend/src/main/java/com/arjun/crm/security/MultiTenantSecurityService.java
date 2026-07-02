package com.arjun.crm.security;

import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
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
 * Service for multi-tenant security checks.
 * Ensures users can only access data from workspaces they belong to.
 * 
 * CRITICAL: Never trust workspaceId from frontend.
 * Always validate through authenticated user + workspace membership.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MultiTenantSecurityService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    /**
     * Get authenticated user from security context.
     * Every security check starts here.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    /**
     * Verify user has access to workspace.
     * Checks if user is workspace owner OR workspace member.
     */
    public void validateWorkspaceAccess(Long workspaceId) {
        User currentUser = getCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

        boolean isOwner = workspace.getOwner().getId().equals(currentUser.getId());
        boolean isMember = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId());

        if (!isOwner && !isMember) {
            log.warn("Access denied: User {} attempted to access workspace {}", currentUser.getId(), workspaceId);
            throw new AccessDeniedException("You don't have access to this workspace");
        }
    }

    /**
     * Verify workspace exists and user has access to it.
     * Returns the workspace if valid.
     */
    public Workspace getAccessibleWorkspace(Long workspaceId) {
        validateWorkspaceAccess(workspaceId);
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
    }

    /**
     * Get workspace members (excluding blocked users).
     * Used for filtering users in "Start Conversation".
     */
    public java.util.List<User> getWorkspaceMembers(Long workspaceId) {
        validateWorkspaceAccess(workspaceId);
        User currentUser = getCurrentUser();
        
        // Get all members in workspace (using a better query if available)
        java.util.Set<Long> memberIds = new java.util.HashSet<>();
        
        // Add all WorkspaceMember users
        workspaceMemberRepository.findAll().stream()
                .filter(wm -> wm.getWorkspace().getId().equals(workspaceId))
                .map(wm -> wm.getUser().getId())
                .forEach(memberIds::add);
        
        // Add workspace owner
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace != null) {
            memberIds.add(workspace.getOwner().getId());
        }

        // Get all user IDs blocked by current user
        java.util.Set<Long> blockedUserIds = getBlockedUserIds(currentUser.getId());

        // Return members excluding blocked users and current user
        return userRepository.findAllById(memberIds)
                .stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> !blockedUserIds.contains(u.getId()))
                .toList();
    }

    /**
     * Get list of users blocked by the current user.
     */
    public java.util.Set<Long> getBlockedUserIds(Long userId) {
        // This assumes BlockedUser entity exists
        // Returns set of blocked user IDs
        return new java.util.HashSet<>(); // Placeholder - implement based on BlockedUser entity
    }

    /**
     * Verify user is workspace owner.
     */
    public boolean isWorkspaceOwner(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
        return workspace.getOwner().getId().equals(user.getId());
    }

    /**
     * Verify user is workspace owner or admin.
     */
    public boolean isWorkspaceOwnerOrAdmin(Long workspaceId, User user) {
        if (isWorkspaceOwner(workspaceId, user)) {
            return true;
        }
        return workspaceMemberRepository.isUserAdminOfWorkspace(workspaceId, user.getId());
    }

    /**
     * Verify user is workspace member (any role).
     */
    public boolean isWorkspaceMember(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
        
        boolean isOwner = workspace.getOwner().getId().equals(user.getId());
        boolean isMember = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId());
        
        return isOwner || isMember;
    }
}
