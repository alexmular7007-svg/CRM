package com.arjun.crm.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UpdateEmailCampaignRequest - FEATURE #3
 * 
 * Request DTO for updating an email campaign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmailCampaignRequest {
    
    @Size(min = 1, max = 255, message = "Campaign name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @Size(min = 1, max = 255, message = "Subject must be between 1 and 255 characters")
    private String subject;
    
    private Long templateId;
    
    private String htmlContent;
    
    private String plainTextContent;
    
    private String[] variables;
    
    private String segmentFilter;
    
    private Boolean isActive;
}
