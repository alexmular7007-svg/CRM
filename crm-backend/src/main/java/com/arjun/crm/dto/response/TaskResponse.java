package com.arjun.crm.dto.response;

import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private Long assignedToId;
    private String assignedToName;
    private UserSummaryResponse assignedTo;
    private Long createdById;
    private String createdByName;
    private Long projectId;
    private String projectName;
    private String attachmentUrls;
    private List<TaskCommentResponse> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private boolean overdue;
}
