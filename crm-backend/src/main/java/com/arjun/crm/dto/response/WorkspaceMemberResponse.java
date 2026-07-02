package com.arjun.crm.dto.response;

import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceMemberResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private WorkspaceRole role;
    private LocalDateTime joinedAt;

    public static WorkspaceMemberResponse fromEntity(WorkspaceMember member) {
        // Use fullName if available, fallback to email if fullName is null
        String displayName = member.getUser().getFullName() != null && !member.getUser().getFullName().trim().isEmpty()
                ? member.getUser().getFullName()
                : member.getUser().getEmail();
        
        return WorkspaceMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .userName(displayName)
                .userEmail(member.getUser().getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
