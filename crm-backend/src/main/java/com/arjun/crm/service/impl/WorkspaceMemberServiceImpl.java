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
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard", allEntries = true)
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

        // Check if user is already an active (non-deleted) member
        if (workspaceMemberRepository.existsActiveMember(workspaceId, userToAdd.getId())) {
            throw new DuplicateMemberException("User is already a member of this workspace");
        }

        // Allow adding any user with any role (including OWNER to support multiple owners)
        // This enables scenarios where Owner A can add User B as Owner, so both can manage workspace independently
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(userToAdd)
                .role(request.getRole())
                .build();

        WorkspaceMember savedMember = workspaceMemberRepository.save(member);
        log.info("Member added successfully with role {} to workspace: {}", request.getRole(), workspaceId);

        return WorkspaceMemberResponse.fromEntity(savedMember);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard", allEntries = true)
    public void removeMember(Long workspaceId, Long userId) {
        User currentUser = getAuthenticatedUser();
        log.info("Removing member from workspace ID: {} by user: {}", workspaceId, currentUser.getEmail());

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check if current user is owner or admin
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can remove members");
        }

        // Check if user being removed exists
        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // CRITICAL: Cannot remove if this is the ONLY OWNER left
        // Must have at least one active owner in workspace at all times
        long activeOwnerCount = workspaceMemberRepository.countActiveOwnersInWorkspace(workspaceId);
        boolean isLastOwner = workspace.getOwner().getId().equals(userId) && activeOwnerCount <= 1;
        
        if (isLastOwner) {
            log.error("❌ Cannot remove last owner {} from workspace {}", userId, workspaceId);
            throw new IllegalArgumentException("Cannot remove the last owner from workspace. Promote someone to owner first.");
        }

        // Find and soft-delete the member record
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        // Use soft delete: set deletedAt timestamp instead of physical delete
        member.setDeletedAt(LocalDateTime.now());
        workspaceMemberRepository.save(member);
        log.info("Member soft-deleted successfully from workspace: {}", workspaceId);

        // Publish member removed event for notification
        eventPublisher.publishEvent(new com.arjun.crm.event.MemberRemovedEvent(
                this,
                userToRemove,
                workspace,
                currentUser
        ));
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

        // Check if user is the original owner (legacy support)
        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            log.info("User {} is workspace owner of workspace {}", currentUser.getEmail(), workspaceId);
            WorkspaceMember ownerMember = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.OWNER)
                    .build();
            WorkspaceMemberResponse response = WorkspaceMemberResponse.fromEntity(ownerMember);
            log.info("Returning OWNER role response: role={}", response.getRole());
            return response;
        }

        // Check if user has a member record in the workspace
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this workspace"));

        // Check if member was soft-deleted
        if (member.getDeletedAt() != null) {
            throw new AccessDeniedException("You have been removed from this workspace");
        }

        log.info("User {} has role {} in workspace {}", currentUser.getEmail(), member.getRole(), workspaceId);
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

        // Cannot demote the original owner - they must stay as owner
        if (workspace.getOwner().getId().equals(userId) && newRole != WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot demote the original workspace owner. Transfer ownership first.");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        WorkspaceRole oldRole = member.getRole();
        
        // Prevent demoting if this is the last owner
        if (oldRole == WorkspaceRole.OWNER && newRole != WorkspaceRole.OWNER) {
            long activeOwnerCount = workspaceMemberRepository.countActiveOwnersInWorkspace(workspaceId);
            if (activeOwnerCount <= 1) {
                throw new IllegalArgumentException("Cannot demote the last owner. Promote someone else first.");
            }
        }

        member.setRole(newRole);
        member = workspaceMemberRepository.save(member);

        // Publish role changed event for notification
        eventPublisher.publishEvent(new RoleChangedEvent(this, targetUser, workspace, oldRole.name(), newRole.name(), currentUser));

        log.info("Member role updated successfully from {} to {}", oldRole, newRole);
        return WorkspaceMemberResponse.fromEntity(member);
    }

    /**
     * Check if user is owner or admin of workspace
     * User is considered owner/admin if:
     * 1. They are the workspace owner (workspace.owner_id)
     * 2. They have ADMIN or OWNER role in workspace_member table
     */
    private boolean isOwnerOrAdmin(Workspace workspace, User user) {
        // Original owner always has access
        if (workspace.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // Check if user is admin or owner member using repository
        return workspaceMemberRepository.isUserAdminOfWorkspace(workspace.getId(), user.getId()) ||
               workspaceMemberRepository.isUserOwnerOfWorkspace(workspace.getId(), user.getId());
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
