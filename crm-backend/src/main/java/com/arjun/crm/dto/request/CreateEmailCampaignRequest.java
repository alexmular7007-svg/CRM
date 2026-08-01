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
 * Supports multiple content modes (TEMPLATE or CUSTOM) and recipient modes (MANUAL, SEGMENT, CRM_FILTER)
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
    
    private Long templateId;  // nullable - required when contentType = TEMPLATE
    
    private String contentType;  // TEMPLATE, CUSTOM
    
    private String htmlContent;  // required if contentType = CUSTOM
    
    private String plainTextContent;
    
    private String[] variables;  // Array of variable names
    
    // NEW: Recipient mode - MANUAL, SEGMENT, or CRM_FILTER
    private String recipientMode;  // MANUAL, SEGMENT, CRM_FILTER
    
    // NEW: Recipient data as JSON string
    // For MANUAL: { "type": "MANUAL", "emails": "email1@example.com,email2@example.com" }
    // For SEGMENT: { "type": "SEGMENT", "segmentId": 123 }
    // For CRM_FILTER: { "type": "CRM_FILTER", "filters": { "leadStatus": "LEAD", "country": "USA" } }
    private String recipientData;  // JSON string containing recipient information
    
    private String status;  // DRAFT, SCHEDULED, SENT
    
    @Builder.Default
    private Boolean isActive = true;
}
