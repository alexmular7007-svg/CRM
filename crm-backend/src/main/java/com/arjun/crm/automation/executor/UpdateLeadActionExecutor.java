package com.arjun.crm.automation.executor;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.enums.LeadStatus;
import com.arjun.crm.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * UpdateLeadActionExecutor - PHASE 3: Execution Engine
 * 
 * Executes UPDATE_LEAD action steps
 * Updates supported lead fields
 * 
 * Configuration:
 * {
 *   "fields": {
 *     "status": "QUALIFIED",
 *     "priority": "HIGH",
 *     "notes": "Updated by automation"
 *   }
 * }
 * 
 * Supported Fields:
 * - status: LeadStatus enum (PROSPECT, LEAD, QUALIFIED, CUSTOMER, etc.)
 * - notes: String field
 * - otherFields: Extensible for custom fields
 * 
 * Behavior:
 * 1. Get fields map from configuration
 * 2. For each field, update the corresponding lead property
 * 3. Save lead to database
 * 4. Return success/failure
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UpdateLeadActionExecutor implements AutomationStepExecutor {
    
    private final LeadRepository leadRepository;
    
    @Override
    public StepExecutionResult execute(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Executing UPDATE_LEAD step: {} for lead: {}", step.getId(), lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return StepExecutionResult.failure("UPDATE_LEAD configuration is empty");
            }
            
            // Get fields map
            @SuppressWarnings("unchecked")
            Map<String, Object> fields = (Map<String, Object>) config.get("fields");
            if (fields == null || fields.isEmpty()) {
                return StepExecutionResult.failure("fields is required in UPDATE_LEAD configuration");
            }
            
            // Update each field
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                String fieldName = entry.getKey();
                Object fieldValue = entry.getValue();
                
                updateLeadField(lead, fieldName, fieldValue);
            }
            
            // Save lead
            leadRepository.save(lead);
            
            log.info("Lead updated successfully: {}", lead.getId());
            return StepExecutionResult.success();
            
        } catch (Exception e) {
            log.error("Error executing UPDATE_LEAD step: {}", step.getId(), e);
            return StepExecutionResult.failure("Lead update failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getStepType() {
        return AutomationStepType.UPDATE_LEAD;
    }
    
    /**
     * Update a single lead field
     * 
     * @param lead the lead entity
     * @param fieldName the field to update
     * @param fieldValue the new value
     */
    private void updateLeadField(Lead lead, String fieldName, Object fieldValue) {
        switch (fieldName.toLowerCase()) {
            case "status":
                // Convert string to LeadStatus enum
                if (fieldValue instanceof String) {
                    try {
                        LeadStatus status = LeadStatus.valueOf((String) fieldValue);
                        lead.setStatus(status);
                        log.info("Updated lead status to: {}", status);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid LeadStatus value: {}", fieldValue);
                    }
                }
                break;
                
            case "notes":
                // Update notes field
                if (fieldValue instanceof String) {
                    lead.setNotes((String) fieldValue);
                    log.info("Updated lead notes");
                }
                break;
                
            case "priority":
                // Update priority if field exists
                if (fieldValue instanceof String) {
                    // lead.setPriority((String) fieldValue);  // Uncomment if priority field exists
                    log.info("Priority field update: {}", fieldValue);
                }
                break;
                
            default:
                log.warn("Unknown lead field: {}", fieldName);
        }
    }
}
