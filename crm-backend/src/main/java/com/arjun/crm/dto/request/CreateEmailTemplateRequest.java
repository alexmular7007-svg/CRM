package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CreateEmailTemplateRequest - FEATURE #3
 * 
 * Request DTO for creating an email template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmailTemplateRequest {
    
    @NotBlank(message = "Template name is required")
    @Size(min = 1, max = 255, message = "Template name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @NotBlank(message = "Category is required")
    private String category;  // WELCOME, PROMOTIONAL, TRANSACTIONAL, etc.
    
    @NotBlank(message = "Subject template is required")
    @Size(min = 1, max = 255, message = "Subject template must be between 1 and 255 characters")
    private String subjectTemplate;
    
    @NotBlank(message = "HTML content is required")
    private String htmlContent;
    
    private String plainTextContent;
    
    private String[] variables;
    
    private String thumbnailUrl;
    
    @Builder.Default
    private Boolean isPublic = false;
}
