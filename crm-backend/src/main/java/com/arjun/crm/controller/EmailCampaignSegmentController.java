package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.EmailCampaignSegmentResponse;
import com.arjun.crm.service.EmailCampaignSegmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * EmailCampaignSegmentController - FEATURE #3
 * 
 * REST API for email campaign segment management
 * Base path: /api/workspaces/{workspaceId}/email-segments
 * 
 * All endpoints require authentication and workspace access.
 * READ (list/get) available to all workspace members.
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/email-segments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailCampaignSegmentController {
    
    private final EmailCampaignSegmentService segmentService;
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/email-segments
     * 
     * List all segments in workspace (paginated)
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
     * Get segment details by ID
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
}
