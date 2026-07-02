package com.arjun.crm.controller;

import com.arjun.crm.dto.request.ResendInvitationRequest;
import com.arjun.crm.dto.request.RevokeInvitationRequest;
import com.arjun.crm.dto.request.InviteNewUserRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.WorkspaceInvitationResponse;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;
import com.arjun.crm.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class InvitationController {

    private final InvitationService invitationService;

    /**
     * Send invitation to new user
     * POST /api/workspaces/{workspaceId}/invitations
     */
    @PostMapping("/api/workspaces/{workspaceId}/invitations")
    public ResponseEntity<ApiResponse<WorkspaceInvitationResponse>> sendInvitation(
            @PathVariable Long workspaceId,
            @Valid @RequestBody InviteNewUserRequest request) {
        log.info("Send invitation request for workspace ID: {} to email: {}", workspaceId, request.getEmail());
        
        // Create request with workspace ID
        InviteNewUserRequest requestWithWorkspace = InviteNewUserRequest.builder()
                .email(request.getEmail())
                .role(request.getRole())
                .build();
        
        WorkspaceInvitationResponse response = invitationService.inviteNewUser(workspaceId, requestWithWorkspace);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invitation sent successfully", response));
    }

    /**
     * Resend invitation to pending user
     * POST /api/workspaces/{workspaceId}/invitations/resend
     */
    @PostMapping("/api/workspaces/{workspaceId}/invitations/resend")
    public ResponseEntity<ApiResponse<WorkspaceInvitationResponse>> resendInvitation(
            @PathVariable Long workspaceId,
            @Valid @RequestBody ResendInvitationRequest request) {
        log.info("Resend invitation request for workspace ID: {} to email: {}", workspaceId, request.getEmail());
        WorkspaceInvitationResponse response = invitationService.resendInvitation(workspaceId, request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Invitation resent successfully", response));
    }

    /**
     * Revoke pending invitation
     * DELETE /api/workspaces/{workspaceId}/invitations
     */
    @DeleteMapping("/api/workspaces/{workspaceId}/invitations")
    public ResponseEntity<ApiResponse<Void>> revokeInvitation(
            @PathVariable Long workspaceId,
            @Valid @RequestBody RevokeInvitationRequest request) {
        log.info("Revoke invitation request for workspace ID: {} for email: {}", workspaceId, request.getEmail());
        invitationService.revokeInvitation(workspaceId, request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Invitation revoked successfully", null));
    }

    /**
     * Get pending invitations for workspace
     * GET /api/workspaces/{workspaceId}/invitations/pending
     */
    @GetMapping("/api/workspaces/{workspaceId}/invitations/pending")
    public ResponseEntity<ApiResponse<java.util.List<WorkspaceInvitationResponse>>> getPendingInvitations(
            @PathVariable Long workspaceId) {
        log.info("Get pending invitations request for workspace ID: {}", workspaceId);
        
        java.util.List<WorkspaceInvitationResponse> response = invitationService.getPendingInvitations(workspaceId);
        return ResponseEntity.ok(ApiResponse.success("Pending invitations fetched successfully", response));
    }

    /**
     * Accept invitation (user-facing endpoint - no workspace ID required)
     * POST /api/workspaces/invitations/accept/{token}
     */
    @PostMapping("/api/workspaces/invitations/accept/{token}")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> acceptInvitation(@PathVariable String token) {
        log.info("Accept invitation request for token: {}", token.substring(0, Math.min(10, token.length())) + "...");
        WorkspaceMemberResponse response = invitationService.acceptInvitation(token);
        return ResponseEntity.ok(ApiResponse.success("Invitation accepted successfully", response));
    }
}

