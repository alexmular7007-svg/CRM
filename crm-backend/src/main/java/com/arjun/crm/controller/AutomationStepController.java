package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateAutomationStepRequest;
import com.arjun.crm.dto.request.UpdateAutomationStepRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.AutomationStepResponse;
import com.arjun.crm.service.AutomationStepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AutomationStepController - PHASE 2: Workflow Model
 * 
 * REST API for automation step management
 * Base path: /api/workspaces/{workspaceId}/automations/{automationId}/steps
 * 
 * All endpoints require authentication.
 * CREATE/UPDATE/DELETE/REORDER require OWNER/ADMIN role.
 * READ (list/get) available to all workspace members.
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/automations/{automationId}/steps")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AutomationStepController {
    
    private final AutomationStepService automationStepService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/automations/{automationId}/steps
     * 
     * Create a new automation step
     * New steps are appended to the end of the workflow.
     * Permission: OWNER/ADMIN only
     * 
     * @return 201 Created with step details
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AutomationStepResponse>> createStep(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @Valid @RequestBody CreateAutomationStepRequest request) {
        
        log.info("POST /api/workspaces/{}/automations/{}/steps - Creating step", workspaceId, automationId);
        AutomationStepResponse response = automationStepService.createStep(workspaceId, automationId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Step created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/automations/{automationId}/steps
     * 
     * List all steps in an automation (ordered by step_order)
     * Permission: Any workspace member
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AutomationStepResponse>>> listSteps(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId) {
        
        log.info("GET /api/workspaces/{}/automations/{}/steps - Listing steps", workspaceId, automationId);
        
        List<AutomationStepResponse> steps = automationStepService.listSteps(workspaceId, automationId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Steps retrieved successfully", steps));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/automations/{automationId}/steps/{stepId}
     * 
     * Get step details by ID
     * Permission: Any workspace member
     */
    @GetMapping("/{stepId}")
    public ResponseEntity<ApiResponse<AutomationStepResponse>> getStep(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @PathVariable Long stepId) {
        
        log.info("GET /api/workspaces/{}/automations/{}/steps/{} - Getting step", workspaceId, automationId, stepId);
        
        AutomationStepResponse response = automationStepService.getStep(workspaceId, automationId, stepId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Step retrieved successfully", response));
    }
    
    /**
     * UPDATE: PATCH /api/workspaces/{workspaceId}/automations/{automationId}/steps/{stepId}
     * 
     * Update step (configuration and enabled flag only)
     * Cannot change step type or order via this endpoint.
     * Permission: OWNER/ADMIN only
     * 
     * @return 200 OK with updated step details
     */
    @PatchMapping("/{stepId}")
    public ResponseEntity<ApiResponse<AutomationStepResponse>> updateStep(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateAutomationStepRequest request) {
        
        log.info("PATCH /api/workspaces/{}/automations/{}/steps/{} - Updating step", workspaceId, automationId, stepId);
        
        AutomationStepResponse response = automationStepService.updateStep(workspaceId, automationId, stepId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Step updated successfully", response));
    }
    
    /**
     * DELETE: DELETE /api/workspaces/{workspaceId}/automations/{automationId}/steps/{stepId}
     * 
     * Delete a step
     * Subsequent steps are automatically renumbered.
     * Permission: OWNER/ADMIN only
     * 
     * @return 204 No Content
     */
    @DeleteMapping("/{stepId}")
    public ResponseEntity<Void> deleteStep(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @PathVariable Long stepId) {
        
        log.info("DELETE /api/workspaces/{}/automations/{}/steps/{} - Deleting step", workspaceId, automationId, stepId);
        
        automationStepService.deleteStep(workspaceId, automationId, stepId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * REORDER: POST /api/workspaces/{workspaceId}/automations/{automationId}/steps/{stepId}/reorder
     * 
     * Reorder a step within the workflow
     * Automatically shifts affected steps.
     * Permission: OWNER/ADMIN only
     * 
     * Request body:
     * {
     *   "newOrder": 2
     * }
     * 
     * @return 200 OK with updated step (new order)
     */
    @PostMapping("/{stepId}/reorder")
    public ResponseEntity<ApiResponse<AutomationStepResponse>> reorderStep(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @PathVariable Long stepId,
            @RequestParam Integer newOrder) {
        
        log.info("POST /api/workspaces/{}/automations/{}/steps/{}/reorder - Reordering to {}", 
                workspaceId, automationId, stepId, newOrder);
        
        AutomationStepResponse response = automationStepService.reorderStep(workspaceId, automationId, stepId, newOrder);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Step reordered successfully", response));
    }
}
