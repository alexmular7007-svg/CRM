package com.arjun.crm.controller;

import com.arjun.crm.dto.request.LeadMagnetCreateRequest;
import com.arjun.crm.dto.request.LeadMagnetUpdateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.LeadMagnetResponse;
import com.arjun.crm.service.LeadMagnetService;
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
 * LeadMagnetAdminController - FEATURE #2 PHASE 1B
 * 
 * REST API for authenticated lead magnet campaign management
 * Base path: /api/workspaces/{workspaceId}/lead-magnets
 * 
 * All endpoints require authentication.
 * CREATE/UPDATE/DELETE require OWNER/ADMIN role.
 * READ (list/get) available to all workspace members.
 * 
 * Not implemented in Phase 1B:
 * - Public endpoints (/api/public/lead-magnets/*)
 * - Public form submission
 * - Analytics endpoints
 * - Rate limiting
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/lead-magnets")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class LeadMagnetAdminController {
    
    private final LeadMagnetService leadMagnetService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/lead-magnets
     * 
     * Create a new lead magnet campaign
     * Permission: OWNER/ADMIN only
     * Authenticated via JWT → SecurityContext
     * 
     * @param workspaceId the workspace ID
     * @param request creation request
     * @return 201 Created with campaign details
     */
    @PostMapping
    public ResponseEntity<ApiResponse<LeadMagnetResponse>> createMagnet(
            @PathVariable Long workspaceId,
            @Valid @RequestBody LeadMagnetCreateRequest request) {
        
        log.info("POST /api/workspaces/{}/lead-magnets - Creating campaign", workspaceId);
        
        LeadMagnetResponse response = leadMagnetService.createMagnet(workspaceId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Campaign created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/lead-magnets
     * 
     * List all campaigns in a workspace (paginated)
     * Permission: Any workspace member
     * Authenticated via JWT → SecurityContext
     * 
     * Query parameters:
     * - page: page number (0-indexed, default 0)
     * - size: page size (default 20)
     * - sort: sort field (default "createdAt,desc")
     * 
     * @param workspaceId the workspace ID
     * @param page page number
     * @param size page size
     * @param sortBy sort field
     * @return 200 OK with paginated campaigns
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<LeadMagnetResponse>>> listMagnets(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        log.info("GET /api/workspaces/{}/lead-magnets - Listing campaigns", workspaceId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<LeadMagnetResponse> campaigns = leadMagnetService.listMagnets(workspaceId, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaigns retrieved successfully", campaigns));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/lead-magnets/{magnetId}
     * 
     * Get campaign details by ID
     * Permission: Any workspace member
     * Authenticated via JWT → SecurityContext
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @return 200 OK with campaign details
     * @throws ResourceNotFoundException if campaign not found (404)
     */
    @GetMapping("/{magnetId}")
    public ResponseEntity<ApiResponse<LeadMagnetResponse>> getMagnet(
            @PathVariable Long workspaceId,
            @PathVariable Long magnetId) {
        
        log.info("GET /api/workspaces/{}/lead-magnets/{} - Getting campaign", 
                workspaceId, magnetId);
        
        LeadMagnetResponse campaign = leadMagnetService.getMagnet(workspaceId, magnetId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign retrieved successfully", campaign));
    }
    
    /**
     * UPDATE: PUT /api/workspaces/{workspaceId}/lead-magnets/{magnetId}
     * 
     * Update campaign metadata (name, description, slug)
     * Permission: OWNER/ADMIN only
     * Authenticated via JWT → SecurityContext
     * 
     * Note: publicToken is immutable and cannot be updated
     * Note: Use PATCH /{magnetId}/status to toggle active state
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @param request update request
     * @return 200 OK with updated campaign
     * @throws ConflictException if slug collision (409)
     * @throws AccessDeniedException if insufficient permission (403)
     */
    @PutMapping("/{magnetId}")
    public ResponseEntity<ApiResponse<LeadMagnetResponse>> updateMagnet(
            @PathVariable Long workspaceId,
            @PathVariable Long magnetId,
            @Valid @RequestBody LeadMagnetUpdateRequest request) {
        
        log.info("PUT /api/workspaces/{}/lead-magnets/{} - Updating campaign", 
                workspaceId, magnetId);
        
        LeadMagnetResponse updated = leadMagnetService.updateMagnet(workspaceId, magnetId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign updated successfully", updated));
    }
    
    /**
     * TOGGLE STATUS: PATCH /api/workspaces/{workspaceId}/lead-magnets/{magnetId}/status
     * 
     * Toggle campaign active/inactive status
     * Permission: OWNER/ADMIN only
     * Authenticated via JWT → SecurityContext
     * 
     * Request body:
     * {
     *   "active": true
     * }
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @param statusRequest status update request
     * @return 200 OK with updated campaign
     * @throws AccessDeniedException if insufficient permission (403)
     */
    @PatchMapping("/{magnetId}/status")
    public ResponseEntity<ApiResponse<LeadMagnetResponse>> updateStatus(
            @PathVariable Long workspaceId,
            @PathVariable Long magnetId,
            @Valid @RequestBody StatusUpdateRequest statusRequest) {
        
        log.info("PATCH /api/workspaces/{}/lead-magnets/{}/status - Updating status to {}", 
                workspaceId, magnetId, statusRequest.getActive());
        
        LeadMagnetResponse updated = leadMagnetService.updateStatus(
                workspaceId, magnetId, statusRequest.getActive());
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign status updated successfully", updated));
    }
    
    /**
     * Inner class for status update request
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatusUpdateRequest {
        private Boolean active;
    }
}
