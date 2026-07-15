package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.InviteNewUserRequest;
import com.arjun.crm.dto.response.WorkspaceInvitationResponse;
import com.arjun.crm.dto.response.InvitationAcceptResponse;
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
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.invitation-base-url:http://localhost:3000/invitations}")
    private String invitationBaseUrl;

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

        // Check if already invited to same workspace (only PENDING invitations block re-invite)
        // REVOKED or EXPIRED invitations can be re-sent
        if (invitationRepository.existsByWorkspaceIdAndEmailAndStatus(workspaceId, email, InvitationStatus.PENDING)) {
            throw new DuplicateMemberException("User is already invited to this workspace");
        }

        // Check if already an active (non-deleted) member
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && memberRepository.existsActiveMember(workspaceId, existingUser.get().getId())) {
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
        String invitationLink = invitationBaseUrl + "/" + token;
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
    public InvitationAcceptResponse acceptInvitation(String token) {
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

        // Check if already an active member (not soft-deleted)
        if (memberRepository.existsActiveMember(invitation.getWorkspace().getId(), currentUser.getId())) {
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

        return InvitationAcceptResponse.fromEntity(savedMember);
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

        // Normalize email
        String normalizedEmail = email.toLowerCase().trim();
        
        // Find PENDING invitations for this email
        List<WorkspaceInvitation> pendingInvitations = invitationRepository
            .findByWorkspaceIdAndEmailAndStatus(workspaceId, normalizedEmail, InvitationStatus.PENDING);
        
        if (pendingInvitations.isEmpty()) {
            throw new ResourceNotFoundException("No pending invitation found for this email");
        }
        
        // If multiple PENDING invitations exist (shouldn't happen but handle it), 
        // delete duplicates and keep the first one
        WorkspaceInvitation invitation = pendingInvitations.get(0);
        if (pendingInvitations.size() > 1) {
            log.warn("Found {} PENDING invitations for {} in workspace {}. Deleting duplicates.", 
                pendingInvitations.size(), normalizedEmail, workspaceId);
            for (int i = 1; i < pendingInvitations.size(); i++) {
                invitationRepository.delete(pendingInvitations.get(i));
            }
        }

        // Update expiry and send new email
        LocalDateTime newExpiresAt = tokenService.generateExpiryTime();
        invitation.setExpiresAt(newExpiresAt);
        WorkspaceInvitation updatedInvitation = invitationRepository.save(invitation);

        // Send email
        String invitationLink = invitationBaseUrl + "/" + invitation.getToken();
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

        // Normalize email
        String normalizedEmail = email.toLowerCase().trim();
        
        // Find PENDING invitations for this email
        List<WorkspaceInvitation> pendingInvitations = invitationRepository
            .findByWorkspaceIdAndEmailAndStatus(workspaceId, normalizedEmail, InvitationStatus.PENDING);
        
        if (pendingInvitations.isEmpty()) {
            throw new ResourceNotFoundException("No pending invitation found for this email");
        }
        
        // Revoke all pending invitations for this email
        pendingInvitations.forEach(invitation -> {
            invitation.setStatus(InvitationStatus.REVOKED);
            invitationRepository.save(invitation);
        });
        
        log.info("Revoked {} pending invitations for {}", pendingInvitations.size(), normalizedEmail);
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
