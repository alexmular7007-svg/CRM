package com.arjun.crm.service;

import com.arjun.crm.dto.request.ProjectCreateRequest;
import com.arjun.crm.dto.request.ProjectUpdateRequest;
import com.arjun.crm.dto.response.ProjectResponse;
import com.arjun.crm.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    
    /**
     * Create a new project
     * @param request project creation details
     * @return created project response
     */
    ProjectResponse createProject(ProjectCreateRequest request);
    
    /**
     * Update project details
     * @param projectId project ID
     * @param request update details
     * @return updated project response
     */
    ProjectResponse updateProject(Long projectId, ProjectUpdateRequest request);
    
    /**
     * Delete project
     * @param projectId project ID to delete
     */
    void deleteProject(Long projectId);
    
    /**
     * Get project details
     * @param projectId project ID
     * @return project response
     */
    ProjectResponse getProject(Long projectId);
    
    /**
     * List projects by workspace
     * @param workspaceId workspace ID
     * @param status optional status filter
     * @param pageable pagination details
     * @return page of projects
     */
    Page<ProjectResponse> listProjectsByWorkspace(Long workspaceId, ProjectStatus status, Pageable pageable);
    
    /**
     * Archive project
     * @param projectId project ID to archive
     * @return archived project response
     */
    ProjectResponse archiveProject(Long projectId);
    
    /**
     * Unarchive project
     * @param projectId project ID to unarchive
     * @return unarchived project response
     */
    ProjectResponse unarchiveProject(Long projectId);
}
