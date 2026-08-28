package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateAutomationRequest;
import com.arjun.crm.dto.request.UpdateAutomationRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.service.AutomationService;
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

/**
 * AutomationController - PHASE 1: Core Foundation
 * 
 * REST API for automation management
 * Base path: /api/workspaces/{workspaceId}/automations
 * 
 * All endpoints require authentication.
 * CREATE/UPDATE/ACTIVATE/PAUSE/ARCHIVE require OWNER/ADMIN role.
 * READ (list/get) available to all workspace members.
 * 
 * Status Transitions (visible via endpoints):
 * POST /automations → Create (DRAFT)
 * POST /automations/{id}/activate → Activate (DRAFT/PAUSED → ACTIVE)
 * POST /automations/{id}/pause → Pause (ACTIVE → PAUSED)
 * DELETE /automations/{id} → Archive (any → ARCHIVED)
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/automations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AutomationController {
    
    private final AutomationService automationService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/automations
     * 
     * Create a new automation
     * Permission: OWNER/ADMIN only
     * 
     * @return 201 Created with automation details
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AutomationResponse>> createAutomation(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateAutomationRequest request) {
        
        log.info("POST /api/workspaces/{}/automations - Creating automation", workspaceId);
        AutomationResponse response = automationService.createAutomation(workspaceId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Automation created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/automations
     * 
     * List all automations in a workspace (paginated)
     * Permission: Any workspace member
     * 
     * Query Parameters:
     * - page: 0-based page number (default: 0)
     * - size: page size (default: 20)
     * - sortBy: field to sort by (default: createdAt)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AutomationResponse>>> listAutomations(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false) AutomationStatus status) {
        
        log.info("GET /api/workspaces/{}/automations - page: {}, size: {}", workspaceId, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<AutomationResponse> automations = automationService.listAutomations(workspaceId, pageable, status);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Automations retrieved successfully", automations));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/automations/{automationId}
     * 
     * Get automation details by ID
     * Permission: Any workspace member
     */
    @GetMapping("/{automationId}")
    public ResponseEntity<ApiResponse<AutomationResponse>> getAutomation(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId) {
        
        log.info("GET /api/workspaces/{}/automations/{} - Getting automation", workspaceId, automationId);
        
        AutomationResponse response = automationService.getAutomation(workspaceId, automationId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Automation retrieved successfully", response));
    }
    
    /**
     * UPDATE: PUT /api/workspaces/{workspaceId}/automations/{automationId}
     * 
     * Update automation (DRAFT only)
     * Permission: OWNER/ADMIN only
     * 
     * @return 200 OK with updated automation details
     */
    @PutMapping("/{automationId}")
    public ResponseEntity<ApiResponse<AutomationResponse>> updateAutomation(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId,
            @Valid @RequestBody UpdateAutomationRequest request) {
        
        log.info("PUT /api/workspaces/{}/automations/{} - Updating automation", workspaceId, automationId);
        
        AutomationResponse response = automationService.updateAutomation(workspaceId, automationId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Automation updated successfully", response));
    }
    
    /**
     * ACTIVATE: POST /api/workspaces/{workspaceId}/automations/{automationId}/activate
     * 
     * Activate an automation (DRAFT or PAUSED → ACTIVE)
     * Permission: OWNER/ADMIN only
     * 
     * @return 200 OK with updated automation (status = ACTIVE)
     */
    @PostMapping("/{automationId}/activate")
    public ResponseEntity<ApiResponse<AutomationResponse>> activateAutomation(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId) {
        
        log.info("POST /api/workspaces/{}/automations/{}/activate - Activating automation", workspaceId, automationId);
        
        AutomationResponse response = automationService.activateAutomation(workspaceId, automationId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Automation activated successfully", response));
    }
    
    /**
     * PAUSE: POST /api/workspaces/{workspaceId}/automations/{automationId}/pause
     * 
     * Pause an active automation (ACTIVE → PAUSED)
     * Permission: OWNER/ADMIN only
     * 
     * @return 200 OK with updated automation (status = PAUSED)
     */
    @PostMapping("/{automationId}/pause")
    public ResponseEntity<ApiResponse<AutomationResponse>> pauseAutomation(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId) {
        
        log.info("POST /api/workspaces/{}/automations/{}/pause - Pausing automation", workspaceId, automationId);
        
        AutomationResponse response = automationService.pauseAutomation(workspaceId, automationId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Automation paused successfully", response));
    }
    
    /**
     * ARCHIVE: DELETE /api/workspaces/{workspaceId}/automations/{automationId}
     * 
     * Archive an automation (soft delete)
     * Archived automations no longer process triggers
     * Permission: OWNER/ADMIN only
     * 
     * @return 204 No Content
     */
    @DeleteMapping("/{automationId}")
    public ResponseEntity<Void> archiveAutomation(
            @PathVariable Long workspaceId,
            @PathVariable Long automationId) {
        
        log.info("DELETE /api/workspaces/{}/automations/{} - Archiving automation", workspaceId, automationId);
        
        automationService.archiveAutomation(workspaceId, automationId);
        
        return ResponseEntity.noContent().build();
    }
}
