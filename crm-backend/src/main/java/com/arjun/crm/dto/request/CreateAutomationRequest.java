package com.arjun.crm.dto.request;

import com.arjun.crm.enums.AutomationTriggerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * CreateAutomationRequest - PHASE 1: Core Foundation
 * 
 * Request DTO for creating a new automation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAutomationRequest {
    
    /**
     * Automation name (must be unique per workspace)
     */
    @NotBlank(message = "Automation name is required")
    private String name;
    
    /**
     * Automation description (optional)
     */
    private String description;
    
    /**
     * Trigger type that initiates this automation
     * LEAD_CREATED, LEAD_MAGNET_SUBMITTED, EMAIL_OPENED, EMAIL_CLICKED
     */
    @NotNull(message = "Trigger type is required")
    private AutomationTriggerType triggerType;
    
    /**
     * Trigger configuration (JSON)
     * Flexible structure for trigger-specific settings
     * 
     * Examples:
     * LEAD_MAGNET_SUBMITTED: {"leadMagnetIds": [1, 2, 3], "delay": 3600}
     * EMAIL_OPENED: {"emailCampaignIds": [5, 6]}
     * EMAIL_CLICKED: {"emailCampaignIds": [5, 6]}
     * LEAD_CREATED: {} (triggers on any lead creation)
     */
    @NotNull(message = "Trigger config is required")
    private Map<String, Object> triggerConfig;
}
