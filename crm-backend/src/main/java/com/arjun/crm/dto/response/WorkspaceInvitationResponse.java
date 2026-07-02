package com.arjun.crm.dto.response;

import com.arjun.crm.entity.WorkspaceInvitation;
import com.arjun.crm.enums.InvitationStatus;
import com.arjun.crm.enums.WorkspaceRole;
import lombok.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceInvitationResponse {

    private Long id;
    private Long workspaceId;
    private String email;
    private String token;
    private WorkspaceRole role;
    private InvitationStatus status;
    private LocalDateTime invitedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime expiresAt;
    private String invitedByName;
    private String invitedByEmail;
    private Long hoursUntilExpiry;

    public static WorkspaceInvitationResponse fromEntity(WorkspaceInvitation invitation) {
        long hoursUntilExpiry = invitation.getExpiresAt() != null ? 
            ChronoUnit.HOURS.between(LocalDateTime.now(), invitation.getExpiresAt()) : 0;
        
        return WorkspaceInvitationResponse.builder()
            .id(invitation.getId())
            .workspaceId(invitation.getWorkspace().getId())
            .email(invitation.getEmail())
            .token(invitation.getToken())
            .role(invitation.getRole())
            .status(invitation.getStatus())
            .invitedAt(invitation.getInvitedAt())
            .acceptedAt(invitation.getAcceptedAt())
            .expiresAt(invitation.getExpiresAt())
            .invitedByName(invitation.getInvitedBy().getFullName())
            .invitedByEmail(invitation.getInvitedBy().getEmail())
            .hoursUntilExpiry(hoursUntilExpiry)
            .build();
    }

    /**
     * Response for invitation validation (public - no token exposure)
     */
    public WorkspaceInvitationResponse toPublicResponse() {
        return WorkspaceInvitationResponse.builder()
            .workspaceId(this.workspaceId)
            .email(this.email)
            .role(this.role)
            .status(this.status)
            .expiresAt(this.expiresAt)
            .invitedByName(this.invitedByName)
            .build();
    }
}
