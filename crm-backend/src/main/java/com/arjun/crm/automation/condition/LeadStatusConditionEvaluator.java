package com.arjun.crm.automation.condition;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.enums.LeadStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * LeadStatusConditionEvaluator - PHASE 7.2: Automation Condition Engine
 * 
 * Evaluates lead status conditions using enum equality.
 * Enables automation to branch based on lead status.
 * 
 * Configuration:
 * {
 *   "status": "QUALIFIED"    // LeadStatus enum value
 * }
 * 
 * Supported Statuses:
 * - LEAD: Initial lead status
 * - QUALIFIED: Lead has been qualified
 * - PROPOSAL: Proposal sent
 * - NEGOTIATION: Active negotiation
 * - WON: Deal won
 * - LOST: Deal lost
 * 
 * Behavior:
 * 1. Parse target status from configuration
 * 2. Get lead status from Lead entity
 * 3. Compare for equality
 * 4. Return TRUE if matched, FALSE if not
 * 
 * Error Handling:
 * - Missing status: failure
 * - Invalid status (invalid enum): failure
 * - Null lead status: treat as not equal (failure)
 * 
 * Example Configuration:
 * - If status is QUALIFIED: { "status": "QUALIFIED" }
 * - If status is WON: { "status": "WON" }
 * - If status is LOST: { "status": "LOST" }
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeadStatusConditionEvaluator implements ConditionEvaluator {
    
    @Override
    public ConditionResult evaluate(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Evaluating LEAD_STATUS_CONDITION for lead: {}", lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return ConditionResult.error("LEAD_STATUS_CONDITION configuration is empty");
            }
            
            // Parse target status
            String statusStr = (String) config.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ConditionResult.error("status is required in LEAD_STATUS_CONDITION configuration");
            }
            
            LeadStatus targetStatus;
            try {
                targetStatus = LeadStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ConditionResult.error("Invalid status: " + statusStr + 
                        ". Valid values: " + String.join(", ", 
                        java.util.Arrays.stream(LeadStatus.values())
                            .map(Enum::name)
                            .toArray(String[]::new)));
            }
            
            // Get lead current status
            LeadStatus currentStatus = lead.getStatus();
            if (currentStatus == null) {
                log.warn("Lead {} has null status", lead.getId());
                return ConditionResult.FALSE();
            }
            
            // Compare
            boolean result = currentStatus.equals(targetStatus);
            
            log.info("LEAD_STATUS_CONDITION result: {} (current={}, target={})", 
                    result, currentStatus, targetStatus);
            
            return result ? ConditionResult.TRUE() : ConditionResult.FALSE();
            
        } catch (Exception e) {
            log.error("Error evaluating LEAD_STATUS_CONDITION step: {}", step.getId(), e);
            return ConditionResult.error("Status condition evaluation failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getConditionType() {
        return AutomationStepType.LEAD_STATUS_CONDITION;
    }
}
