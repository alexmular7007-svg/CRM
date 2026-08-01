package com.arjun.crm.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UpdateEmailTemplateRequest - FEATURE #3
 * 
 * Request DTO for updating an email template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmailTemplateRequest {
    
    @Size(min = 1, max = 255, message = "Template name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    private String category;
    
    @Size(min = 1, max = 255, message = "Subject template must be between 1 and 255 characters")
    private String subjectTemplate;
    
    private String htmlContent;
    
    private String plainTextContent;
    
    private String[] variables;
    
    private String thumbnailUrl;
    
    private Boolean isPublic;
}
