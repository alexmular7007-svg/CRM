package com.arjun.crm.controller;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.EmailCampaignResponse;
import com.arjun.crm.service.EmailCampaignService;
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
 * EmailCampaignController - FEATURE #3
 * 
 * REST API for email campaign management
 * Base path: /api/workspaces/{workspaceId}/email-campaigns
 * 
 * All endpoints require authentication.
 * CREATE/UPDATE/DELETE/SEND require OWNER/ADMIN role.
 * READ (list/get) available to all workspace members.
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/email-campaigns")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailCampaignController {
    
    private final EmailCampaignService emailCampaignService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/email-campaigns
     * 
     * Create a new email campaign
     * Permission: OWNER/ADMIN only
     * 
     * @return 201 Created with campaign details
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> createCampaign(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateEmailCampaignRequest request) {
        
        log.info("POST /api/workspaces/{}/email-campaigns - Creating campaign", workspaceId);
        EmailCampaignResponse response = emailCampaignService.createCampaign(workspaceId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Campaign created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/email-campaigns
     * 
     * List all campaigns in a workspace (paginated)
     * Permission: Any workspace member
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmailCampaignResponse>>> listCampaigns(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        log.info("🟢 [EmailCampaignController] GET /api/workspaces/{}/email-campaigns called - workspaceId: {}, page: {}, size: {}, timestamp: {}", 
                workspaceId, workspaceId, page, size, java.time.LocalDateTime.now());
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<EmailCampaignResponse> campaigns = emailCampaignService.listCampaigns(workspaceId, pageable);
        
        log.info("🟢 [EmailCampaignController] Returning {} campaigns", campaigns.getTotalElements());
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaigns retrieved successfully", campaigns));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}
     * 
     * Get campaign details by ID
     * Permission: Any workspace member
     */
    @GetMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> getCampaign(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId) {
        
        log.info("GET /api/workspaces/{}/email-campaigns/{} - Getting campaign", workspaceId, campaignId);
        EmailCampaignResponse campaign = emailCampaignService.getCampaign(workspaceId, campaignId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign retrieved successfully", campaign));
    }
    
    /**
     * LIST BY STATUS: GET /api/workspaces/{workspaceId}/email-campaigns/status/{status}
     * 
     * List campaigns by status
     * Permission: Any workspace member
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<EmailCampaignResponse>>> listCampaignsByStatus(
            @PathVariable Long workspaceId,
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/workspaces/{}/email-campaigns/status/{} - Listing by status", workspaceId, status);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<EmailCampaignResponse> campaigns = emailCampaignService.listCampaignsByStatus(workspaceId, status, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaigns retrieved successfully", campaigns));
    }
    
    /**
     * UPDATE: PUT /api/workspaces/{workspaceId}/email-campaigns/{campaignId}
     * 
     * Update campaign (DRAFT only)
     * Permission: OWNER/ADMIN only
     */
    @PutMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> updateCampaign(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @Valid @RequestBody UpdateEmailCampaignRequest request) {
        
        log.info("PUT /api/workspaces/{}/email-campaigns/{} - Updating campaign", workspaceId, campaignId);
        EmailCampaignResponse response = emailCampaignService.updateCampaign(workspaceId, campaignId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign updated successfully", response));
    }
    
    /**
     * SCHEDULE: POST /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/schedule
     * 
     * Schedule campaign for sending
     * Permission: OWNER/ADMIN only
     */
    @PostMapping("/{campaignId}/schedule")
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> scheduleCampaign(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @Valid @RequestBody ScheduleCampaignRequest request) {
        
        log.info("POST /api/workspaces/{}/email-campaigns/{}/schedule - Scheduling", workspaceId, campaignId);
        EmailCampaignResponse response = emailCampaignService.scheduleCampaign(workspaceId, campaignId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign scheduled successfully", response));
    }
    
    /**
     * SEND: POST /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/send
     * 
     * Send campaign immediately
     * Permission: OWNER/ADMIN only
     */
    @PostMapping("/{campaignId}/send")
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> sendCampaign(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId) {
        
        log.info("POST /api/workspaces/{}/email-campaigns/{}/send - Sending", workspaceId, campaignId);
        EmailCampaignResponse response = emailCampaignService.sendCampaign(workspaceId, campaignId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign sent successfully", response));
    }
    
    /**
     * UPDATE STATUS: PATCH /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/status
     * 
     * Update campaign status
     * Permission: OWNER/ADMIN only
     */
    @PatchMapping("/{campaignId}/status")
    public ResponseEntity<ApiResponse<EmailCampaignResponse>> updateStatus(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @Valid @RequestBody EmailCampaignStatusRequest request) {
        
        log.info("PATCH /api/workspaces/{}/email-campaigns/{}/status - Updating status", workspaceId, campaignId);
        EmailCampaignResponse response = emailCampaignService.updateCampaignStatus(workspaceId, campaignId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign status updated successfully", response));
    }
    
    /**
     * DELETE: DELETE /api/workspaces/{workspaceId}/email-campaigns/{campaignId}
     * 
     * Delete campaign (soft delete)
     * Permission: OWNER/ADMIN only
     */
    @DeleteMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId) {
        
        log.info("DELETE /api/workspaces/{}/email-campaigns/{} - Deleting", workspaceId, campaignId);
        emailCampaignService.deleteCampaign(workspaceId, campaignId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign deleted successfully", null));
    }
    
    /**
     * GET ANALYTICS: GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/analytics
     * 
     * Get campaign analytics and metrics
     * Permission: Any workspace member
     */
    @GetMapping("/{campaignId}/analytics")
    public ResponseEntity<ApiResponse<Object>> getCampaignAnalytics(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId) {
        
        log.info("GET /api/workspaces/{}/email-campaigns/{}/analytics - Getting analytics", workspaceId, campaignId);
        
        // For now, return campaign with metrics
        EmailCampaignResponse campaign = emailCampaignService.getCampaign(workspaceId, campaignId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Campaign analytics retrieved successfully", campaign));
    }
}
