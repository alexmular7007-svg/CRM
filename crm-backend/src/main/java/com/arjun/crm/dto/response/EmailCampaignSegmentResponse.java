package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EmailCampaignSegmentResponse - FEATURE #3
 * 
 * Response DTO for email campaign segments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignSegmentResponse {
    
    private Long id;
    
    private String name;
    
    private String description;
    
    private String filterCriteria;
    
    private Long leadCount;
    
    private Long createdById;
    
    private String createdByName;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
