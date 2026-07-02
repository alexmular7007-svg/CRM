package com.arjun.crm.service;

import com.arjun.crm.dto.request.InviteNewUserRequest;
import com.arjun.crm.dto.response.WorkspaceInvitationResponse;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing workspace invitations
 */
public interface InvitationService {

    /**
     * Invite new unregistered user to workspace
     * @param workspaceId workspace ID
     * @param request invitation details (email, role)
     * @return invitation response with token
     */
    WorkspaceInvitationResponse inviteNewUser(Long workspaceId, InviteNewUserRequest request);

    /**
     * Accept invitation for existing registered user
     * @param token unique invitation token
     * @return created workspace member
     */
    WorkspaceMemberResponse acceptInvitation(String token);

    /**
     * Resend invitation to pending member
     * @param workspaceId workspace ID
     * @param email email to resend to
     * @return updated invitation response
     */
    WorkspaceInvitationResponse resendInvitation(Long workspaceId, String email);

    /**
     * Revoke pending invitation
     * @param workspaceId workspace ID
     * @param email email of invitation to revoke
     */
    void revokeInvitation(Long workspaceId, String email);

    /**
     * Get pending invitations for workspace
     * @param workspaceId workspace ID
     * @return list of pending invitations
     */
    List<WorkspaceInvitationResponse> getPendingInvitations(Long workspaceId);

    /**
     * Validate and get invitation by token
     * @param token invitation token
     * @return invitation if found and valid
     */
    Optional<WorkspaceInvitationResponse> getInvitationByToken(String token);

    /**
     * Cleanup expired invitations - scheduled job
     */
    void cleanupExpiredInvitations();
}
