package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.AddWorkspaceMemberRequest;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.event.RoleChangedEvent;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.DuplicateMemberException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.service.WorkspaceMemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceMemberServiceImpl implements WorkspaceMemberService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public WorkspaceMemberResponse addMember(Long workspaceId, AddWorkspaceMemberRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Adding member to workspace ID: {} by user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if current user is owner or admin
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can add members");
        }

        // Check if user to be added exists by email
        User userToAdd = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // Check if user is already a member
        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userToAdd.getId())) {
            throw new DuplicateMemberException("User is already a member of this workspace");
        }

        // Cannot add owner as member
        if (workspace.getOwner().getId().equals(userToAdd.getId())) {
            throw new IllegalArgumentException("Workspace owner cannot be added as a member");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(userToAdd)
                .role(request.getRole())
                .build();

        WorkspaceMember savedMember = workspaceMemberRepository.save(member);
        log.info("Member added successfully to workspace: {}", workspaceId);

        return WorkspaceMemberResponse.fromEntity(savedMember);
    }

    @Override
    @Transactional
    public void removeMember(Long workspaceId, Long userId) {
        User currentUser = getAuthenticatedUser();
        log.info("Removing member from workspace ID: {} by user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if current user is owner or admin
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can remove members");
        }

        // Cannot remove owner
        if (workspace.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot remove workspace owner");
        }

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        // Use soft delete: set deletedAt timestamp instead of physical delete
        member.setDeletedAt(LocalDateTime.now());
        workspaceMemberRepository.save(member);
        log.info("Member soft-deleted successfully from workspace: {}", workspaceId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkspaceMemberResponse> listMembers(Long workspaceId, Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Listing members for workspace ID: {}", workspaceId);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if user has access to workspace (owner or active member)
        // Access the owner within the transaction to avoid lazy loading issues
        Long ownerId = workspace.getOwner().getId();
        boolean isOwner = ownerId.equals(currentUser.getId());
        boolean isMember = workspaceMemberRepository.existsActiveMember(workspaceId, currentUser.getId());
        
        if (!isOwner && !isMember) {
            throw new AccessDeniedException("You don't have access to this workspace");
        }

        // Return only active (non-deleted) members
        Page<WorkspaceMember> members = workspaceMemberRepository.findActiveByWorkspaceId(workspaceId, pageable);
        return members.map(WorkspaceMemberResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceMemberResponse getMyRole(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        log.info("Getting role for user: {} in workspace: {}", currentUser.getEmail(), workspaceId);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // If user is the owner, construct OWNER role response
        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            WorkspaceMember ownerMember = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.OWNER)
                    .build();
            return WorkspaceMemberResponse.fromEntity(ownerMember);
        }

        // Otherwise find active member record for the user (exclude soft-deleted)
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this workspace"));

        // Check if member was soft-deleted
        if (member.getDeletedAt() != null) {
            throw new AccessDeniedException("You have been removed from this workspace");
        }

        return WorkspaceMemberResponse.fromEntity(member);
    }

    @Override
    @Transactional
    public WorkspaceMemberResponse updateMemberRole(Long workspaceId, Long userId, WorkspaceRole newRole) {
        User currentUser = getAuthenticatedUser();
        log.info("Updating member role for user: {} in workspace: {} to role: {}", userId, workspaceId, newRole);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if current user is owner or admin
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can update member roles");
        }

        // Cannot change owner role
        if (workspace.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot change workspace owner role");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        WorkspaceRole oldRole = member.getRole();
        member.setRole(newRole);
        member = workspaceMemberRepository.save(member);

        // Publish role changed event for notification
        eventPublisher.publishEvent(new RoleChangedEvent(this, targetUser, workspace, oldRole.name(), newRole.name(), currentUser));

        log.info("Member role updated successfully from {} to {}", oldRole, newRole);
        return WorkspaceMemberResponse.fromEntity(member);
    }

    /**
     * Check if user is owner or admin of workspace
     */
    private boolean isOwnerOrAdmin(Workspace workspace, User user) {
        // Owner always has access - access within transaction to trigger lazy load
        if (workspace.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // Check if user is admin member using repository (avoids lazy loading issues)
        return workspaceMemberRepository.isUserAdminOfWorkspace(workspace.getId(), user.getId());
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
