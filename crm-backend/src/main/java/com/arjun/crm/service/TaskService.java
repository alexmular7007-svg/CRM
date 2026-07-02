package com.arjun.crm.service;

import com.arjun.crm.dto.request.TaskCommentRequest;
import com.arjun.crm.dto.request.TaskCreateRequest;
import com.arjun.crm.dto.request.TaskStatusUpdateRequest;
import com.arjun.crm.dto.request.TaskUpdateRequest;
import com.arjun.crm.dto.response.TaskCommentResponse;
import com.arjun.crm.dto.response.TaskResponse;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface TaskService {

    TaskResponse createTask(TaskCreateRequest request, Long createdById, String createdByName);

    TaskResponse getTaskById(Long id);

    Page<TaskResponse> getAllTasks(Pageable pageable);

    Page<TaskResponse> getTasksByStatus(TaskStatus status, Pageable pageable);

    Page<TaskResponse> getTasksByAssignee(Long assignedToId, Pageable pageable);

    /**
     * PHASE 3: Get tasks assigned to user in a SPECIFIC workspace only
     * Validates assignee is active member of workspace
     */
    Page<TaskResponse> getTasksByAssigneeInWorkspace(Long workspaceId, Long assignedToId, Pageable pageable);

    Page<TaskResponse> getTasksByProject(Long projectId, Pageable pageable);

    Page<TaskResponse> getTasksByPriority(TaskPriority priority, Pageable pageable);

    Page<TaskResponse> searchTasks(String keyword, Pageable pageable);

    TaskResponse updateTask(Long id, TaskUpdateRequest request);

    TaskResponse updateTaskStatus(Long id, TaskStatusUpdateRequest request);

    void deleteTask(Long id);

    TaskCommentResponse addComment(Long taskId, TaskCommentRequest request);

    List<TaskCommentResponse> getCommentsByTask(Long taskId);

    void deleteComment(Long taskId, Long commentId);

    List<TaskResponse> getOverdueTasks();

    Map<String, Long> getTaskStatusSummary();
}
