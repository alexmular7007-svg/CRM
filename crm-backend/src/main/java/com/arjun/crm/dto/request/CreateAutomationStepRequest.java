package com.arjun.crm.dto.request;

import com.arjun.crm.enums.AutomationStepType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * CreateAutomationStepRequest - PHASE 2: Workflow Model
 * 
 * Request DTO for creating an automation step
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAutomationStepRequest {
    
    /**
     * Step type (trigger, action, condition, wait)
     */
    @NotNull(message = "Step type is required")
    private AutomationStepType type;
    
    /**
     * Step-specific configuration (JSON)
     * Structure depends on step type
     * 
     * Examples:
     * SEND_EMAIL: {emailTemplateId: 123, subject: "Welcome!"}
     * WAIT_DURATION: {duration: 24, unit: "HOURS"}
     * CONDITION: {operator: "ANY"}
     */
    private Map<String, Object> configuration;
    
    /**
     * Whether this step is enabled (optional, defaults to true)
     */
    @Builder.Default
    private Boolean enabled = true;
}
