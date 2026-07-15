package com.arjun.crm.dto.response;

import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Response returned when a user accepts an invitation.
 * Includes both member info and workspace info so frontend can redirect properly.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationAcceptResponse {
    
    private Member member;
    private Workspace workspace;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Member {
        private Long id;
        private Long userId;
        private String userName;
        private String userEmail;
        private WorkspaceRole role;
        private LocalDateTime joinedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Workspace {
        private Long id;
        private String name;
        private String description;
    }

    public static InvitationAcceptResponse fromEntity(WorkspaceMember workspaceMember) {
        String displayName = workspaceMember.getUser().getFullName() != null && !workspaceMember.getUser().getFullName().trim().isEmpty()
                ? workspaceMember.getUser().getFullName()
                : workspaceMember.getUser().getEmail();

        Member memberDto = Member.builder()
                .id(workspaceMember.getId())
                .userId(workspaceMember.getUser().getId())
                .userName(displayName)
                .userEmail(workspaceMember.getUser().getEmail())
                .role(workspaceMember.getRole())
                .joinedAt(workspaceMember.getJoinedAt())
                .build();

        Workspace workspaceDto = Workspace.builder()
                .id(workspaceMember.getWorkspace().getId())
                .name(workspaceMember.getWorkspace().getName())
                .description(workspaceMember.getWorkspace().getDescription())
                .build();

        return InvitationAcceptResponse.builder()
                .member(memberDto)
                .workspace(workspaceDto)
                .build();
    }
}
