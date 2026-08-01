package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * EmailCampaignStatusRequest - FEATURE #3
 * 
 * Request DTO for updating campaign status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignStatusRequest {
    
    @NotBlank(message = "Status is required")
    private String status;  // SCHEDULED, SENDING, PAUSED, COMPLETED, CANCELLED, etc.
}
