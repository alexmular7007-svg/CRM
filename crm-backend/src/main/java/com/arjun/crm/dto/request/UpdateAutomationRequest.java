package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * UpdateAutomationRequest - PHASE 1: Core Foundation
 * 
 * Request DTO for updating an automation (DRAFT only)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAutomationRequest {
    
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
     * Trigger configuration (JSON)
     * Can be updated only in DRAFT state
     */
    private Map<String, Object> triggerConfig;
}
