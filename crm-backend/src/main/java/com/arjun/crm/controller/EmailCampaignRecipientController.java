package com.arjun.crm.controller;

import com.arjun.crm.dto.request.AddRecipientsRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.EmailCampaignRecipientResponse;
import com.arjun.crm.service.EmailCampaignRecipientService;
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
 * EmailCampaignRecipientController - FEATURE #3
 * 
 * REST API for email campaign recipient management
 * Base path: /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailCampaignRecipientController {
    
    private final EmailCampaignRecipientService recipientService;
    
    /**
     * ADD RECIPIENTS: POST /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients
     * 
     * Add recipients to a campaign (from segment or manual list)
     * Permission: OWNER/ADMIN only
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addRecipients(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @Valid @RequestBody AddRecipientsRequest request) {
        
        log.info("POST /api/workspaces/{}/email-campaigns/{}/recipients - Adding recipients", 
                workspaceId, campaignId);
        
        recipientService.addRecipients(workspaceId, campaignId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Recipients added successfully", null));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients
     * 
     * List all recipients for a campaign (paginated)
     * Permission: Any workspace member
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmailCampaignRecipientResponse>>> listRecipients(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        log.info("GET /api/workspaces/{}/email-campaigns/{}/recipients - Listing recipients", 
                workspaceId, campaignId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<EmailCampaignRecipientResponse> recipients = recipientService.listRecipients(workspaceId, campaignId, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Recipients retrieved successfully", recipients));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients/{recipientId}
     * 
     * Get recipient details
     * Permission: Any workspace member
     */
    @GetMapping("/{recipientId}")
    public ResponseEntity<ApiResponse<EmailCampaignRecipientResponse>> getRecipient(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @PathVariable Long recipientId) {
        
        log.info("GET /api/workspaces/{}/email-campaigns/{}/recipients/{} - Getting recipient", 
                workspaceId, campaignId, recipientId);
        
        EmailCampaignRecipientResponse recipient = recipientService.getRecipient(workspaceId, campaignId, recipientId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Recipient retrieved successfully", recipient));
    }
    
    /**
     * REMOVE: DELETE /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/recipients/{recipientId}
     * 
     * Remove recipient from campaign
     * Permission: OWNER/ADMIN only
     */
    @DeleteMapping("/{recipientId}")
    public ResponseEntity<ApiResponse<Void>> removeRecipient(
            @PathVariable Long workspaceId,
            @PathVariable Long campaignId,
            @PathVariable Long recipientId) {
        
        log.info("DELETE /api/workspaces/{}/email-campaigns/{}/recipients/{} - Removing recipient", 
                workspaceId, campaignId, recipientId);
        
        recipientService.removeRecipient(workspaceId, campaignId, recipientId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Recipient removed successfully", null));
    }
}
