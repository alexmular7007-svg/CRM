package com.arjun.crm.service;

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
     * List all segments in a workspace (paginated)
     */
    Page<EmailCampaignSegmentResponse> listSegments(Long workspaceId, Pageable pageable);
    
    /**
     * Get segment details by ID
     */
    EmailCampaignSegmentResponse getSegment(Long workspaceId, Long segmentId);
}
