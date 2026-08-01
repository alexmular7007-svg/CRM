package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateEmailSegmentRequest;
import com.arjun.crm.dto.response.EmailCampaignSegmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * EmailCampaignSegmentService - FEATURE #3
 * 
 * Service interface for email campaign segment management
 */
public interface EmailCampaignSegmentService {
    
    /**
     * Create a new segment
     * 
     * Permission: OWNER/ADMIN only
     */
    EmailCampaignSegmentResponse createSegment(Long workspaceId, CreateEmailSegmentRequest request);
    
    /**
     * List segments in workspace
     * 
     * Permission: Any workspace member
     */
    Page<EmailCampaignSegmentResponse> listSegments(Long workspaceId, Pageable pageable);
    
    /**
     * Get segment details
     * 
     * Permission: Any workspace member
     */
    EmailCampaignSegmentResponse getSegment(Long workspaceId, Long segmentId);
    
    /**
     * Delete segment
     * 
     * Permission: OWNER/ADMIN only
     */
    void deleteSegment(Long workspaceId, Long segmentId);
}
