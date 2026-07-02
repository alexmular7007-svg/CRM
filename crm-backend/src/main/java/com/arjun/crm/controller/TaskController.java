package com.arjun.crm.controller;

import com.arjun.crm.dto.request.TaskCreateRequest;
import com.arjun.crm.dto.request.TaskStatusUpdateRequest;
import com.arjun.crm.dto.request.TaskUpdateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.TaskResponse;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskCreateRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Admin") String userName) {

        // ════════════════════════════════════════════════════════════
        // LOG INCOMING REQUEST - BEFORE VALIDATION
        // ════════════════════════════════════════════════════════════
        log.info("");
        log.info("╔══════════════════════════════════════════════════════════════════╗");
        log.info("║ TASK CREATION REQUEST - DETAILED AUDIT LOG                      ║");
        log.info("╚══════════════════════════════════════════════════════════════════╝");
        log.info("");
        log.info("REQUEST HEADERS:");
        log.info("  X-User-Id: {}", userId);
        log.info("  X-User-Name: {}", userName);
        log.info("");
        log.info("DESERIALIZED DTO (TaskCreateRequest):");
        log.info("  workspaceId: {} (type: {})", request.getWorkspaceId(), 
                 request.getWorkspaceId() != null ? request.getWorkspaceId().getClass().getSimpleName() : "null");
        log.info("  title: '{}'", request.getTitle());
        log.info("  description: '{}'", request.getDescription() != null ? request.getDescription().substring(0, Math.min(100, request.getDescription().length())) + "..." : "null");
        log.info("  status: {} (enum value)", request.getStatus());
        log.info("  priority: {} (enum value)", request.getPriority());
        log.info("  dueDate: {}", request.getDueDate());
        log.info("  assignedToId: {} (type: {})", request.getAssignedToId(), 
                 request.getAssignedToId() != null ? request.getAssignedToId().getClass().getSimpleName() : "null");
        log.info("  assignedToName: '{}'", request.getAssignedToName());
        log.info("  projectId: {} (type: {})", request.getProjectId(), 
                 request.getProjectId() != null ? request.getProjectId().getClass().getSimpleName() : "null");
        log.info("  projectName: '{}'", request.getProjectName());
        log.info("");
        log.info("VALIDATION STATUS: ✓ PASSED (Request reached controller - @Valid annotations satisfied)");
        log.info("");
        
        log.info("POST /api/tasks - Creating task by user: {} in workspace: {}", userId, request.getWorkspaceId());
        
        // Validate user has access to workspace
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        // Validate assignee is in same workspace if assigned
        if (request.getAssignedToId() != null) {
            workspaceAuthService.validateAssigneeInWorkspace(request.getWorkspaceId(), request.getAssignedToId());
        }
        
        TaskResponse response = taskService.createTask(request, userId, userName);
        log.info("╔══════════════════════════════════════════════════════════════════╗");
        log.info("║ ✓ TASK CREATED SUCCESSFULLY - ID: {}                                      ║", response.getId());
        log.info("╚══════════════════════════════════════════════════════════════════╝");
        log.info("");
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", response));
    }

    // ─── READ ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        log.info("GET /api/tasks/{} from workspace {}", id, workspaceId);
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        TaskResponse response = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success("Task fetched successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getAllTasks(
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TaskResponse> response = taskService.getAllTasks(pageable);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched successfully", response));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getTasksByStatus(
            @PathVariable TaskStatus status,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskResponse> response = taskService.getTasksByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched by status", response));
    }

    @GetMapping("/assignee/{assignedToId}")
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getTasksByAssignee(
            @PathVariable Long assignedToId,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Validate workspace access and assignee is in workspace
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateAssigneeInWorkspace(workspaceId, assignedToId);

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskResponse> response = taskService.getTasksByAssignee(assignedToId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched by assignee", response));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getTasksByProject(
            @PathVariable Long projectId,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskResponse> response = taskService.getTasksByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched by project", response));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getTasksByPriority(
            @PathVariable TaskPriority priority,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskResponse> response = taskService.getTasksByPriority(priority, pageable);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched by priority", response));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> searchTasks(
            @RequestParam String keyword,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskResponse> response = taskService.searchTasks(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results", response));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getOverdueTasks(
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        List<TaskResponse> response = taskService.getOverdueTasks();
        return ResponseEntity.ok(ApiResponse.success("Overdue tasks fetched", response));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTaskStatusSummary(
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        Map<String, Long> summary = taskService.getTaskStatusSummary();
        return ResponseEntity.ok(ApiResponse.success("Task summary fetched", summary));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request) {

        log.info("PUT /api/tasks/{}", id);
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        // Validate assignee is in workspace if being reassigned
        if (request.getAssignedToId() != null) {
            workspaceAuthService.validateAssigneeInWorkspace(request.getWorkspaceId(), request.getAssignedToId());
        }
        
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request) {

        log.info("PATCH /api/tasks/{}/status to {}", id, request.getStatus());
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        TaskResponse response = taskService.updateTaskStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task status updated", response));
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        log.info("DELETE /api/tasks/{} from workspace {}", id, workspaceId);
        
        // Validate workspace access and authorization
        var member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }
}
