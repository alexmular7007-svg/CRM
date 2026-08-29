package com.arjun.crm.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * UpdateAutomationStepRequest - PHASE 2: Workflow Model
 * 
 * Request DTO for updating an automation step
 * Note: step_order and type cannot be changed; use reorder endpoint for ordering
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAutomationStepRequest {
    
    /**
     * Step-specific configuration (JSON)
     * Optional; if provided, replaces entire configuration
     */
    private Map<String, Object> configuration;
    
    /**
     * Whether this step is enabled
     */
    private Boolean enabled;
}
