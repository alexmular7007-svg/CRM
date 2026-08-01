package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CreateEmailCampaignRequest - FEATURE #3
 * 
 * Request DTO for creating a new email campaign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmailCampaignRequest {
    
    @NotBlank(message = "Campaign name is required")
    @Size(min = 1, max = 255, message = "Campaign name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 1, max = 255, message = "Subject must be between 1 and 255 characters")
    private String subject;
    
    private Long templateId;  // nullable
    
    private String contentType;  // TEMPLATE, CUSTOM_HTML, MARKDOWN
    
    private String htmlContent;  // required if contentType != TEMPLATE
    
    private String plainTextContent;
    
    private String[] variables;  // Array of variable names
    
    private String segmentFilter;  // JSON filter criteria
    
    @Builder.Default
    private Boolean isActive = true;
}
