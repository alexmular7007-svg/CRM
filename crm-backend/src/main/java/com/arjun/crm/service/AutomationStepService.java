package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateAutomationStepRequest;
import com.arjun.crm.dto.request.UpdateAutomationStepRequest;
import com.arjun.crm.dto.response.AutomationStepResponse;

import java.util.List;

/**
 * AutomationStepService - PHASE 2: Workflow Model
 * 
 * Service interface for automation step management
 * 
 * Permission Model:
 * - OWNER/ADMIN: Full CRUD (create, read, update, delete, reorder)
 * - MEMBER: Read-only (list, get)
 * 
 * All operations are workspace-scoped through automation
 */
public interface AutomationStepService {
    
    /**
     * Create a new automation step
     * 
     * Permission: OWNER/ADMIN only
     * 
     * New steps are appended to the end of the workflow.
     * To change order, use reorderStep().
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param request creation request
     * @return created step response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     */
    AutomationStepResponse createStep(Long workspaceId, Long automationId, CreateAutomationStepRequest request);
    
    /**
     * List all steps in an automation (ordered by step_order)
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @return list of steps in order
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     * @throws com.arjun.crm.exception.ResourceNotFoundException if automation not found
     */
    List<AutomationStepResponse> listSteps(Long workspaceId, Long automationId);
    
    /**
     * Get a specific step by ID
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param stepId the step ID
     * @return step response
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     * @throws com.arjun.crm.exception.ResourceNotFoundException if step or automation not found
     */
    AutomationStepResponse getStep(Long workspaceId, Long automationId, Long stepId);
    
    /**
     * Update a step (configuration and enabled flag)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * Note: Cannot change step type or order via this method.
     * Use deleteStep() + createStep() to change type.
     * Use reorderStep() to change order.
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param stepId the step ID
     * @param request update request
     * @return updated step response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if step or automation not found
     */
    AutomationStepResponse updateStep(Long workspaceId, Long automationId, Long stepId, UpdateAutomationStepRequest request);
    
    /**
     * Delete a step
     * 
     * Permission: OWNER/ADMIN only
     * 
     * When a step is deleted, subsequent steps are automatically reordered
     * to maintain sequential ordering (1, 2, 3, ...).
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param stepId the step ID
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if step or automation not found
     */
    void deleteStep(Long workspaceId, Long automationId, Long stepId);
    
    /**
     * Reorder steps within an automation
     * 
     * Permission: OWNER/ADMIN only
     * 
     * Moves a step from currentOrder to newOrder.
     * All affected steps are automatically reordered.
     * 
     * Example:
     * Before: [Step1, Step2, Step3, Step4]
     * Reorder Step3 from position 3 to position 1:
     * After: [Step3, Step1, Step2, Step4]
     * 
     * @param workspaceId the workspace ID
     * @param automationId the automation ID
     * @param stepId the step ID to move
     * @param newOrder the new step order (1-based)
     * @return updated step response with new order
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if step or automation not found
     * @throws IllegalArgumentException if newOrder is invalid
     */
    AutomationStepResponse reorderStep(Long workspaceId, Long automationId, Long stepId, Integer newOrder);
}
