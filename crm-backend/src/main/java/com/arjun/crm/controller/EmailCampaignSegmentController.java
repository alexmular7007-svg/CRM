package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateEmailSegmentRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.EmailCampaignSegmentResponse;
import com.arjun.crm.service.EmailCampaignSegmentService;
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
 * EmailCampaignSegmentController - FEATURE #3
 * 
 * REST API for email campaign segment (audience) management
 * Base path: /api/workspaces/{workspaceId}/email-segments
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/email-segments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailCampaignSegmentController {
    
    private final EmailCampaignSegmentService segmentService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/email-segments
     * 
     * Create a new email segment (saved audience filter)
     * Permission: OWNER/ADMIN only
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmailCampaignSegmentResponse>> createSegment(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateEmailSegmentRequest request) {
        
        log.info("POST /api/workspaces/{}/email-segments - Creating segment", workspaceId);
        EmailCampaignSegmentResponse response = segmentService.createSegment(workspaceId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Segment created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/email-segments
     * 
     * List all segments in workspace
     * Permission: Any workspace member
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmailCampaignSegmentResponse>>> listSegments(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        log.info("GET /api/workspaces/{}/email-segments - Listing segments", workspaceId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<EmailCampaignSegmentResponse> segments = segmentService.listSegments(workspaceId, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Segments retrieved successfully", segments));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/email-segments/{segmentId}
     * 
     * Get segment details
     * Permission: Any workspace member
     */
    @GetMapping("/{segmentId}")
    public ResponseEntity<ApiResponse<EmailCampaignSegmentResponse>> getSegment(
            @PathVariable Long workspaceId,
            @PathVariable Long segmentId) {
        
        log.info("GET /api/workspaces/{}/email-segments/{} - Getting segment", workspaceId, segmentId);
        EmailCampaignSegmentResponse segment = segmentService.getSegment(workspaceId, segmentId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Segment retrieved successfully", segment));
    }
    
    /**
     * DELETE: DELETE /api/workspaces/{workspaceId}/email-segments/{segmentId}
     * 
     * Delete segment
     * Permission: OWNER/ADMIN only
     */
    @DeleteMapping("/{segmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteSegment(
            @PathVariable Long workspaceId,
            @PathVariable Long segmentId) {
        
        log.info("DELETE /api/workspaces/{}/email-segments/{} - Deleting segment", workspaceId, segmentId);
        segmentService.deleteSegment(workspaceId, segmentId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Segment deleted successfully", null));
    }
}
