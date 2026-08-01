package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ScheduleCampaignRequest - FEATURE #3
 * 
 * Request DTO for scheduling a campaign
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleCampaignRequest {
    
    @NotBlank(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;
    
    @Builder.Default
    private Integer retryCount = 3;
}
