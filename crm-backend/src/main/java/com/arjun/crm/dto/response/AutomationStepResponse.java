package com.arjun.crm.dto.response;

import com.arjun.crm.enums.AutomationStepType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AutomationStepResponse - PHASE 2: Workflow Model
 * 
 * Response DTO for automation step data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationStepResponse {
    
    /**
     * Step ID
     */
    private Long id;
    
    /**
     * Parent automation ID
     */
    private Long automationId;
    
    /**
     * Step order in workflow (1, 2, 3, ...)
     */
    private Integer stepOrder;
    
    /**
     * Step type
     */
    private AutomationStepType type;
    
    /**
     * Step-specific configuration
     */
    private Map<String, Object> configuration;
    
    /**
     * Whether step is enabled
     */
    private Boolean enabled;
    
    /**
     * Timestamp when step was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when step was last updated
     */
    private LocalDateTime updatedAt;
}
