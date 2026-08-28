package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateAutomationRequest;
import com.arjun.crm.dto.request.UpdateAutomationRequest;
import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.enums.AutomationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * AutomationService - PHASE 1: Core Foundation
 * 
 * Service interface for automation management
 * 
 * Permission Model:
 * - OWNER/ADMIN: Full access (create, read, update, activate, pause, archive)
 * - MEMBER: Read-only access (list, get)
 * 
 * All operations are workspace-scoped through WorkspaceAuthorizationService
 */
public interface AutomationService {
    
    /**
     * Create a new automation
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param request creation request
     * @return created automation response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if workspace not found
     * @throws com.arjun.crm.exception.ConflictException if automation name already exists
     */
    AutomationResponse createAutomation(Long workspaceId, CreateAutomationRequest request);
    
    /**
     * List all automations in a workspace (paginated)
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param pageable pagination settings
     * @return page of automations
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     */
    Page<AutomationResponse> listAutomations(Long workspaceId, Pageable pageable);

    Page<AutomationResponse> listAutomations(Long workspaceId, Pageable pageable, AutomationStatus status);
    
    /**
     * Get a specific automation by ID
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @return automation response
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     */
    AutomationResponse getAutomation(Long workspaceId, Long automationId);
    
    /**
     * Update automation (DRAFT only)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param request update request
     * @return updated automation response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     * @throws IllegalStateException if automation status is not DRAFT
     * @throws com.arjun.crm.exception.ConflictException if automation name already exists
     */
    AutomationResponse updateAutomation(Long workspaceId, Long automationId, UpdateAutomationRequest request);
    
    /**
     * Activate an automation (transition DRAFT or PAUSED → ACTIVE)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @return updated automation response with status ACTIVE
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     * @throws IllegalStateException if automation status is ARCHIVED
     */
    AutomationResponse activateAutomation(Long workspaceId, Long automationId);
    
    /**
     * Pause an active automation (ACTIVE → PAUSED)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @return updated automation response with status PAUSED
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     * @throws IllegalStateException if automation status is not ACTIVE
     */
    AutomationResponse pauseAutomation(Long workspaceId, Long automationId);
    
    /**
     * Archive an automation (soft delete)
     * Marks automation as archived but preserves data
     * Archived automations do not process triggers
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     */
    void archiveAutomation(Long workspaceId, Long automationId);
}
