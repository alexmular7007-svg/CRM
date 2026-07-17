package com.arjun.crm.dto.request;

import com.arjun.crm.enums.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberRoleRequest {

    @NotNull(message = "Role is required")
    private WorkspaceRole role;
}
