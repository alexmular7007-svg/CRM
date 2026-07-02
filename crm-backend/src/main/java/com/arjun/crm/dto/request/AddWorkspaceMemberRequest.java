package com.arjun.crm.dto.request;

import com.arjun.crm.enums.WorkspaceRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddWorkspaceMemberRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotNull(message = "Role is required")
    private WorkspaceRole role;
}
