package com.arjun.crm.controller;

import com.arjun.crm.dto.request.ProjectCreateRequest;
import com.arjun.crm.dto.request.ProjectUpdateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.ProjectResponse;
import com.arjun.crm.enums.ProjectStatus;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ProjectService;
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

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    /**
     * Create a new project
     * POST /api/projects
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectCreateRequest request) {
        log.info("Create project request received: {}", request.getName());
        
        // Validate user has access to workspace
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", response));
    }

    /**
     * Update project
     * PUT /api/projects/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectUpdateRequest request) {
        log.info("Update project request received for ID: {}", id);
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        ProjectResponse response = projectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", response));
    }

    /**
     * Delete project
     * DELETE /api/projects/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        log.info("Delete project request received for ID: {}", id);
        
        // Validate workspace access and authorization
        var member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    /**
     * Get project details
     * GET /api/projects/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        log.info("Get project request received for ID: {}", id);
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        ProjectResponse response = projectService.getProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project fetched successfully", response));
    }

    /**
     * List projects by workspace
     * GET /api/projects/workspace/{workspaceId}
     */
    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listProjectsByWorkspace(
            @PathVariable Long workspaceId,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        log.info("List projects request received for workspace ID: {}", workspaceId);
        
        // Validate user has access to workspace
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProjectResponse> response = projectService.listProjectsByWorkspace(workspaceId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Projects fetched successfully", response));
    }

    /**
     * Archive project
     * PUT /api/projects/{id}/archive
     */
    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ProjectResponse>> archiveProject(
            @PathVariable Long id) {
        log.info("Archive project request received for ID: {}", id);
        
        ProjectResponse response = projectService.archiveProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project archived successfully", response));
    }

    /**
     * Unarchive project
     * PUT /api/projects/{id}/unarchive
     */
    @PutMapping("/{id}/unarchive")
    public ResponseEntity<ApiResponse<ProjectResponse>> unarchiveProject(
            @PathVariable Long id) {
        log.info("Unarchive project request received for ID: {}", id);
        
        ProjectResponse response = projectService.unarchiveProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project unarchived successfully", response));
    }
}
