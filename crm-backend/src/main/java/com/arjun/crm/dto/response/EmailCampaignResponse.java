package com.arjun.crm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EmailCampaignResponse - FEATURE #3
 * 
 * Response DTO for email campaigns
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignResponse {
    
    private Long id;
    
    private String name;
    
    private String description;
    
    private String subject;
    
    private String[] subjectVariables;
    
    private Long templateId;
    
    private String templateName;
    
    private String contentType;
    
    private String status;
    
    private Boolean isActive;
    
    private Long createdById;
    
    private String createdByName;
    
    private LocalDateTime scheduledAt;
    
    private LocalDateTime sendStartedAt;
    
    private LocalDateTime sendCompletedAt;
    
    private Long totalRecipients;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime deletedAt;
}
