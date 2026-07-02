package com.arjun.crm.dto.request;

import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class TaskCreateRequest {

    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;

    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;

    @FutureOrPresent(message = "Due date must be today or in the future")
    private LocalDate dueDate;

    private Long assignedToId;
    private String assignedToName;

    private Long projectId;
    private String projectName;
}
