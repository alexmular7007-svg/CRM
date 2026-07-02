package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.TaskCommentRequest;
import com.arjun.crm.dto.request.TaskCreateRequest;
import com.arjun.crm.dto.request.TaskStatusUpdateRequest;
import com.arjun.crm.dto.request.TaskUpdateRequest;
import com.arjun.crm.dto.response.TaskCommentResponse;
import com.arjun.crm.dto.response.TaskResponse;
import com.arjun.crm.dto.response.UserSummaryResponse;
import com.arjun.crm.entity.Project;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.TaskComment;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ProjectRepository;
import com.arjun.crm.repository.TaskCommentRepository;
import com.arjun.crm.repository.TaskRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.service.TaskActivityService;
import com.arjun.crm.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskActivityService taskActivityService;

    @Override
    public TaskResponse createTask(TaskCreateRequest request, Long createdById, String createdByName) {
        User currentUser = getAuthenticatedUser();
        log.info("Creating task with title: {} by user: {}", request.getTitle(), currentUser.getEmail());

        // Get workspace and validate it exists
        Long workspaceId = request.getWorkspaceId();
        if (workspaceId == null) {
            throw new ResourceNotFoundException("Workspace ID is required");
        }
        
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        // Verify current user is active member of workspace
        if (!workspaceMemberRepository.existsActiveMember(workspaceId, currentUser.getId())) {
            throw new AccessDeniedException("You are not an active member of this workspace");
        }

        // Fetch assigned user if provided
        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with ID: " + request.getAssignedToId()));
            
            // PHASE 3: Validate assignee is active member of workspace (not soft-deleted)
            if (!workspaceMemberRepository.existsActiveMember(workspaceId, request.getAssignedToId())) {
                throw new AccessDeniedException("Assignee is not an active member of this workspace");
            }
        }

        // Fetch project if provided
        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));
            
            // Verify project belongs to same workspace
            if (!project.getWorkspace().getId().equals(workspaceId)) {
                throw new AccessDeniedException("Project does not belong to this workspace");
            }
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .startDate(LocalDate.now())
                .assignedTo(assignedTo)
                .assignedBy(currentUser)
                .createdBy(currentUser)
                .project(project)
                .workspace(workspace)
                .build();

        Task savedTask = taskRepository.save(task);
        
        // Log task creation activity
        taskActivityService.logTaskCreation(savedTask, currentUser);
        
        log.info("Task created with id: {}", savedTask.getId());
        return mapToResponse(savedTask);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "task", key = "#id")
    public TaskResponse getTaskById(Long id) {
        Task task = findTaskOrThrow(id);
        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getAllTasks(Pageable pageable) {
        return taskRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByStatus(TaskStatus status, Pageable pageable) {
        return taskRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByAssignee(Long assignedToId, Pageable pageable) {
        return taskRepository.findByAssignedToIdOrderByCreatedAtDesc(assignedToId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * PHASE 3: Get tasks assigned to user in a SPECIFIC workspace only
     * Prevents global task queries across all workspaces
     * Validates assignee is active member of workspace
     */
    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByAssigneeInWorkspace(Long workspaceId, Long assignedToId, Pageable pageable) {
        // Verify workspace exists
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with ID: " + workspaceId);
        }
        
        // Verify assignee is active member (not deleted) of this workspace
        if (!workspaceMemberRepository.existsActiveMember(workspaceId, assignedToId)) {
            log.warn("User {} is not an active member of workspace {}", assignedToId, workspaceId);
            return Page.empty(pageable);
        }
        
        return taskRepository.findByWorkspaceIdAndAssignedToId(workspaceId, assignedToId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasksByPriority(TaskPriority priority, Pageable pageable) {
        return taskRepository.findByPriorityOrderByCreatedAtDesc(priority, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> searchTasks(String keyword, Pageable pageable) {
        return taskRepository.searchByKeyword(keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @CacheEvict(value = "task", key = "#id")
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Updating task id: {} by user: {}", id, currentUser.getEmail());
        
        Task task = findTaskOrThrow(id);
        Long workspaceId = task.getWorkspace().getId();

        // Verify current user is active member of workspace
        if (!workspaceMemberRepository.existsActiveMember(workspaceId, currentUser.getId())) {
            throw new AccessDeniedException("You are not an active member of this workspace");
        }

        // Track changes for activity logging
        String oldStatus = task.getStatus() != null ? task.getStatus().name() : null;
        String oldPriority = task.getPriority() != null ? task.getPriority().name() : null;
        String oldAssignee = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null;
        String oldDueDate = task.getDueDate() != null ? task.getDueDate().toString() : null;

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (task.getCompletedAt() != null) {
                task.setCompletedAt(null);
            }
        }
        
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        
        // PHASE 3: Validate assignee is active member before assignment
        if (request.getAssignedToId() != null) {
            // Verify assignee is active member (not deleted) of this workspace
            if (!workspaceMemberRepository.existsActiveMember(workspaceId, request.getAssignedToId())) {
                throw new AccessDeniedException("Assignee is not an active member of this workspace");
            }
            
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with ID: " + request.getAssignedToId()));
            task.setAssignedTo(assignedTo);
            task.setAssignedBy(currentUser);
        }
        
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));
            
            // Verify project belongs to same workspace
            if (!project.getWorkspace().getId().equals(workspaceId)) {
                throw new AccessDeniedException("Project does not belong to this workspace");
            }
            
            task.setProject(project);
            task.setWorkspace(project.getWorkspace());
        }

        Task updatedTask = taskRepository.save(task);
        
        // Log activities for changes
        String newStatus = updatedTask.getStatus() != null ? updatedTask.getStatus().name() : null;
        String newPriority = updatedTask.getPriority() != null ? updatedTask.getPriority().name() : null;
        String newAssignee = updatedTask.getAssignedTo() != null ? updatedTask.getAssignedTo().getFullName() : null;
        String newDueDate = updatedTask.getDueDate() != null ? updatedTask.getDueDate().toString() : null;
        
        if (oldStatus != null && newStatus != null && !oldStatus.equals(newStatus)) {
            taskActivityService.logStatusChange(updatedTask, currentUser, oldStatus, newStatus);
        }
        
        if (oldPriority != null && newPriority != null && !oldPriority.equals(newPriority)) {
            taskActivityService.logPriorityChange(updatedTask, currentUser, oldPriority, newPriority);
        }
        
        if ((oldAssignee == null && newAssignee != null) || 
            (oldAssignee != null && !oldAssignee.equals(newAssignee))) {
            taskActivityService.logAssignmentChange(updatedTask, currentUser, oldAssignee, newAssignee);
        }
        
        if ((oldDueDate == null && newDueDate != null) || 
            (oldDueDate != null && !oldDueDate.equals(newDueDate))) {
            taskActivityService.logDueDateChange(updatedTask, currentUser, oldDueDate, newDueDate);
        }
        
        log.info("Task id: {} updated successfully", id);
        return mapToResponse(updatedTask);
    }

    @Override
    @CacheEvict(value = "task", key = "#id")
    public TaskResponse updateTaskStatus(Long id, TaskStatusUpdateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Updating status of task id: {} to {} by user: {}", id, request.getStatus(), currentUser.getEmail());
        
        Task task = findTaskOrThrow(id);
        String oldStatus = task.getStatus().name();
        
        task.setStatus(request.getStatus());

        if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        Task updatedTask = taskRepository.save(task);
        
        // Log status change activity
        taskActivityService.logStatusChange(updatedTask, currentUser, oldStatus, request.getStatus().name());
        
        return mapToResponse(updatedTask);
    }

    @Override
    @CacheEvict(value = "task", key = "#id")
    public void deleteTask(Long id) {
        log.info("Deleting task id: {}", id);
        Task task = findTaskOrThrow(id);
        taskCommentRepository.deleteByTaskId(id);
        taskRepository.delete(task);
        log.info("Task id: {} deleted successfully", id);
    }

    @Override
    public TaskCommentResponse addComment(Long taskId, TaskCommentRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Adding comment to task id: {} by user: {}", taskId, currentUser.getEmail());
        
        Task task = findTaskOrThrow(taskId);

        TaskComment comment = TaskComment.builder()
                .task(task)
                .user(currentUser)
                .message(request.getContent())
                .build();

        TaskComment savedComment = taskCommentRepository.save(comment);
        
        // Log comment creation activity
        taskActivityService.logCommentCreation(task, currentUser);
        
        return mapCommentToResponse(savedComment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskCommentResponse> getCommentsByTask(Long taskId) {
        findTaskOrThrow(taskId);
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::mapCommentToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteComment(Long taskId, Long commentId) {
        findTaskOrThrow(taskId);
        TaskComment comment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        taskCommentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getOverdueTasks() {
        return taskRepository.findOverdueTasks(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getTaskStatusSummary() {
        Map<String, Long> summary = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            summary.put(status.name(), taskRepository.countByStatus(status));
        }
        return summary;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private TaskResponse mapToResponse(Task task) {
        List<TaskCommentResponse> commentResponses = task.getComments() == null ? List.of() :
                task.getComments().stream()
                        .map(this::mapCommentToResponse)
                        .collect(Collectors.toList());

        boolean overdue = task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != TaskStatus.DONE
                && task.getStatus() != TaskStatus.CANCELLED;

        Long projectId = task.getProject() != null ? task.getProject().getId() : null;
        String projectName = task.getProject() != null ? task.getProject().getName() : null;
        
        Long assignedToId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        String assignedToName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null;
        UserSummaryResponse assignedToUser = task.getAssignedTo() != null ?
                UserSummaryResponse.builder()
                        .id(task.getAssignedTo().getId())
                        .fullName(task.getAssignedTo().getFullName())
                        .email(task.getAssignedTo().getEmail())
                        .build()
                : null;
        
        Long createdById = task.getCreatedBy() != null ? task.getCreatedBy().getId() : null;
        String createdByName = task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null;

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .assignedToId(assignedToId)
                .assignedToName(assignedToName)
                .assignedTo(assignedToUser)
                .createdById(createdById)
                .createdByName(createdByName)
                .projectId(projectId)
                .projectName(projectName)
                .attachmentUrls(null) // Will be populated separately if needed
                .comments(commentResponses)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .completedAt(task.getCompletedAt())
                .overdue(overdue)
                .build();
    }

    private TaskCommentResponse mapCommentToResponse(TaskComment comment) {
        return TaskCommentResponse.fromEntity(comment);
    }
    
    /**
     * Get authenticated user from security context
     */
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
