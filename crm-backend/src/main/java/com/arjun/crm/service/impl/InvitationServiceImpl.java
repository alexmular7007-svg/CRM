package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.InviteNewUserRequest;
import com.arjun.crm.dto.response.WorkspaceInvitationResponse;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceInvitation;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.InvitationStatus;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.DuplicateMemberException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceInvitationRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.service.EmailService;
import com.arjun.crm.service.InvitationService;
import com.arjun.crm.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationServiceImpl implements InvitationService {

    private final WorkspaceInvitationRepository invitationRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final TokenService tokenService;

    private static final String INVITATION_BASE_URL = "http://localhost:3000/invitations";

    @Override
    @Transactional
    public WorkspaceInvitationResponse inviteNewUser(Long workspaceId, InviteNewUserRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Inviting new user {} to workspace {} by {}", request.getEmail(), workspaceId, currentUser.getEmail());

        // Get workspace
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check authorization (only owner or admin)
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can invite members");
        }

        // Normalize email
        String email = request.getEmail().toLowerCase().trim();

        // Check if already invited to same workspace
        if (invitationRepository.existsByWorkspaceIdAndEmail(workspaceId, email)) {
            throw new DuplicateMemberException("User is already invited to this workspace");
        }

        // Check if already a member
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && memberRepository.existsByWorkspaceIdAndUserId(workspaceId, existingUser.get().getId())) {
            throw new DuplicateMemberException("User is already a member of this workspace");
        }

        // Generate token and expiry
        String token = tokenService.generateInvitationToken();
        LocalDateTime expiresAt = tokenService.generateExpiryTime();

        // Create invitation
        WorkspaceInvitation invitation = WorkspaceInvitation.builder()
            .workspace(workspace)
            .email(email)
            .token(token)
            .role(request.getRole())
            .status(InvitationStatus.PENDING)
            .expiresAt(expiresAt)
            .invitedBy(currentUser)
            .build();

        WorkspaceInvitation savedInvitation = invitationRepository.save(invitation);
        log.info("Invitation created for {} with token", email);

        // Send email
        String invitationLink = INVITATION_BASE_URL + "/" + token;
        try {
            log.info("Calling EmailService.sendInvitationEmail for: {}", email);
            emailService.sendInvitationEmail(
                email,
                workspace.getName(),
                request.getRole().toString(),
                invitationLink,
                expiresAt,
                currentUser.getFullName()
            );
            log.info("✓ Invitation email DELIVERED successfully to: {}", email);
        } catch (Exception e) {
            log.error("✗ SMTP DELIVERY FAILED for invitation to: {} | Error: {} | Invitation saved but email NOT sent", 
                email, e.getMessage());
            log.error("SMTP Failure Details:", e);
            // Don't throw - invitation is still created, just email delivery failed
        }

        return WorkspaceInvitationResponse.fromEntity(savedInvitation);
    }

    @Override
    @Transactional
    public WorkspaceMemberResponse acceptInvitation(String token) {
        User currentUser = getAuthenticatedUser();
        log.info("User {} attempting to accept invitation with token", currentUser.getEmail());

        // Find invitation by token
        WorkspaceInvitation invitation = invitationRepository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired invitation token"));

        // Validate token
        if (!tokenService.isTokenValid(invitation.getExpiresAt())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new ResourceNotFoundException("Invitation token has expired");
        }

        // Check if already accepted
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Invitation has already been accepted");
        }

        // Check if revoked
        if (invitation.getStatus() == InvitationStatus.REVOKED) {
            throw new IllegalArgumentException("Invitation has been revoked");
        }

        // Verify email matches
        if (!invitation.getEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new AccessDeniedException("Invitation is for a different email address");
        }

        // Check if already a member
        if (memberRepository.existsByWorkspaceIdAndUserId(invitation.getWorkspace().getId(), currentUser.getId())) {
            throw new DuplicateMemberException("You are already a member of this workspace");
        }

        // Create workspace member
        WorkspaceMember member = WorkspaceMember.builder()
            .workspace(invitation.getWorkspace())
            .user(currentUser)
            .role(invitation.getRole())
            .status("ACTIVE")
            .invitedAt(invitation.getInvitedAt())
            .invitedBy(invitation.getInvitedBy())
            .build();

        WorkspaceMember savedMember = memberRepository.save(member);

        // Update invitation as accepted
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setAcceptedBy(currentUser);
        invitationRepository.save(invitation);

        log.info("Invitation accepted for {}, member created in workspace {}", currentUser.getEmail(), invitation.getWorkspace().getId());

        return WorkspaceMemberResponse.fromEntity(savedMember);
    }

    @Override
    @Transactional
    public WorkspaceInvitationResponse resendInvitation(Long workspaceId, String email) {
        User currentUser = getAuthenticatedUser();
        log.info("Resending invitation to {} in workspace {} by {}", email, workspaceId, currentUser.getEmail());

        // Get workspace
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check authorization
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can resend invitations");
        }

        // Find pending invitation
        String normalizedEmail = email.toLowerCase().trim();
        WorkspaceInvitation invitation = invitationRepository.findByWorkspaceIdAndEmail(workspaceId, normalizedEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        // Check if pending
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Can only resend pending invitations");
        }

        // Update expiry and send new email
        LocalDateTime newExpiresAt = tokenService.generateExpiryTime();
        invitation.setExpiresAt(newExpiresAt);
        WorkspaceInvitation updatedInvitation = invitationRepository.save(invitation);

        // Send email
        String invitationLink = INVITATION_BASE_URL + "/" + invitation.getToken();
        try {
            log.info("Calling EmailService.sendInvitationResendEmail for: {}", normalizedEmail);
            emailService.sendInvitationResendEmail(
                normalizedEmail,
                workspace.getName(),
                invitation.getRole().toString(),
                invitationLink,
                newExpiresAt,
                currentUser.getFullName()
            );
            log.info("✓ Resent invitation email DELIVERED successfully to: {}", normalizedEmail);
        } catch (Exception e) {
            log.error("✗ SMTP DELIVERY FAILED for resent invitation to: {} | Error: {} | Invitation updated but email NOT sent", 
                normalizedEmail, e.getMessage());
            log.error("SMTP Failure Details:", e);
            // Don't throw - invitation is still updated, just email delivery failed
        }

        log.info("Invitation resent to {}", normalizedEmail);
        return WorkspaceInvitationResponse.fromEntity(updatedInvitation);
    }

    @Override
    @Transactional
    public void revokeInvitation(Long workspaceId, String email) {
        User currentUser = getAuthenticatedUser();
        log.info("Revoking invitation for {} in workspace {} by {}", email, workspaceId, currentUser.getEmail());

        // Get workspace
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check authorization
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can revoke invitations");
        }

        // Find invitation
        String normalizedEmail = email.toLowerCase().trim();
        WorkspaceInvitation invitation = invitationRepository.findByWorkspaceIdAndEmail(workspaceId, normalizedEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        // Check if pending
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Can only revoke pending invitations");
        }

        // Revoke
        invitation.setStatus(InvitationStatus.REVOKED);
        invitationRepository.save(invitation);
        log.info("Invitation revoked for {}", normalizedEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceInvitationResponse> getPendingInvitations(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching pending invitations for workspace {}", workspaceId);

        // Get workspace
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Check authorization (owner or admin only)
        if (!isOwnerOrAdmin(workspace, currentUser)) {
            throw new AccessDeniedException("Only workspace owner or admin can view pending invitations");
        }

        return invitationRepository
            .findByWorkspaceIdAndStatus(workspaceId, InvitationStatus.PENDING)
            .stream()
            .map(WorkspaceInvitationResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkspaceInvitationResponse> getInvitationByToken(String token) {
        log.debug("Validating invitation token");

        return invitationRepository.findByToken(token)
            .filter(inv -> tokenService.isTokenValid(inv.getExpiresAt()))
            .map(WorkspaceInvitationResponse::fromEntity)
            .map(WorkspaceInvitationResponse::toPublicResponse);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 2 * * *")  // Run daily at 2 AM
    public void cleanupExpiredInvitations() {
        log.info("Starting cleanup of expired invitations");

        List<WorkspaceInvitation> expiredInvitations = invitationRepository
            .findExpiredInvitations(LocalDateTime.now());

        expiredInvitations.forEach(inv -> {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(inv);
        });

        log.info("Cleaned up {} expired invitations", expiredInvitations.size());
    }

    /**
     * Check if user is owner or admin of workspace
     */
    private boolean isOwnerOrAdmin(Workspace workspace, User user) {
        if (workspace.getOwner().getId().equals(user.getId())) {
            return true;
        }
        return memberRepository.isUserAdminOfWorkspace(workspace.getId(), user.getId());
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
