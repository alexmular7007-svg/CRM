package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EmailTemplateResponse - FEATURE #3
 * 
 * Response DTO for email templates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplateResponse {
    
    private Long id;
    
    private String name;
    
    private String description;
    
    private String category;
    
    private String subjectTemplate;
    
    private String htmlContent;
    
    private String plainTextContent;
    
    private String[] variables;
    
    private String thumbnailUrl;
    
    private Boolean isPublic;
    
    private Long createdById;
    
    private String createdByName;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
