package com.arjun.crm.security;

import com.arjun.crm.entity.User;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Central workspace security service.
 * All workspace access checks go through here — never trust frontend workspaceId alone.
 * Derives authorization from the authenticated user's membership records.
 */
@Service("workspaceSecurity")
@RequiredArgsConstructor
@Slf4j
public class WorkspaceSecurityService {

    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    // ─── Current user helpers ─────────────────────────────────────────────

    public User getCurrentUser() {
        String email = ((UserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    // ─── Membership checks ────────────────────────────────────────────────

    /** Returns true if the current user is a member of the workspace. */
    public boolean isMember(Long workspaceId) {
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, getCurrentUserId());
    }

    /** Returns true if the current user has ADMIN or OWNER role in the workspace. */
    public boolean isAdminOrOwner(Long workspaceId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, getCurrentUserId())
                .map(m -> m.getRole() == WorkspaceRole.ADMIN || m.getRole() == WorkspaceRole.OWNER)
                .orElse(false);
    }

    /** Returns true if the current user has OWNER role in the workspace. */
    public boolean isOwner(Long workspaceId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, getCurrentUserId())
                .map(m -> m.getRole() == WorkspaceRole.OWNER)
                .orElse(false);
    }

    /** Returns the current user's role in a workspace, or null if not a member. */
    public WorkspaceRole getRole(Long workspaceId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, getCurrentUserId())
                .map(com.arjun.crm.entity.WorkspaceMember::getRole)
                .orElse(null);
    }

    // ─── Enforcement methods (throw on violation) ─────────────────────────

    /** Throws 403 if the current user is not a member of the workspace. */
    public void requireMembership(Long workspaceId) {
        if (!isMember(workspaceId)) {
            log.warn("Access denied: user {} is not a member of workspace {}",
                    getCurrentUserId(), workspaceId);
            throw new AccessDeniedException("You do not have access to this workspace");
        }
    }

    /** Throws 403 if the current user is not ADMIN or OWNER of the workspace. */
    public void requireAdminOrOwner(Long workspaceId) {
        if (!isAdminOrOwner(workspaceId)) {
            log.warn("Access denied: user {} lacks admin/owner role in workspace {}",
                    getCurrentUserId(), workspaceId);
            throw new AccessDeniedException("You need admin privileges for this action");
        }
    }

    /** Throws 403 if the current user is not OWNER of the workspace. */
    public void requireOwner(Long workspaceId) {
        if (!isOwner(workspaceId)) {
            log.warn("Access denied: user {} is not owner of workspace {}", getCurrentUserId(), workspaceId);
            throw new AccessDeniedException("Only the workspace owner can perform this action");
        }
    }

    /**
     * Validate that a target user is a member of a workspace.
     * Used to block cross-workspace task assignments etc.
     */
    public void requireUserIsMember(Long workspaceId, Long targetUserId) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, targetUserId)) {
            log.warn("Cross-workspace operation blocked: user {} is not a member of workspace {}",
                    targetUserId, workspaceId);
            throw new AccessDeniedException(
                    "The assigned user is not a member of this workspace");
        }
    }

    /**
     * Checks if a given userId is a member of the workspace.
     * Used for validating participants in chat rooms.
     */
    @Transactional(readOnly = true)
    public boolean isUserMemberOfWorkspace(Long workspaceId, Long userId) {
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }
}
