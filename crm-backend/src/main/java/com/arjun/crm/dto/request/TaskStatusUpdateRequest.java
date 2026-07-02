package com.arjun.crm.dto.request;

import com.arjun.crm.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskStatusUpdateRequest {

    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
